/** @jest-environment node */

const {createSimulation} = require('../../src/js/simulation/simulation.js');
const {
    REPLAY_STOP_REASONS,
    runReplay,
} = require('../../src/js/replay/replay-runner.js');
const {REPLAY_ERROR_CODES} = require('../../src/js/replay/replay-schema.js');

const createPayload = function (overrides = {}) {
    const config = overrides.config || {
        mapSize: 100,
        tickRate: 10,
        durationTicks: 20,
    };
    const commands = overrides.commands === undefined ? [] : overrides.commands;
    const seed = overrides.seed === undefined ? 7 : overrides.seed;

    return {
        version: 1,
        seed: seed,
        config: config,
        commands: commands,
    };
};

const movementCommands = [
    {tick: 0, type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
    {tick: 0, type: 'CHANGE_DIRECTION', playerId: 'b-snake', direction: 'LEFT'},
];

const expectReplayError = function (callback, expectedCode) {
    let caughtError;

    try {
        callback();
    } catch (error) {
        caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.code).toBe(expectedCode);
};

describe('replay runner', () => {
    test('runs headlessly without browser APIs', () => {
        expect(typeof document).toBe('undefined');
        expect(typeof window).toBe('undefined');
        expect(typeof requestAnimationFrame).toBe('undefined');

        const result = runReplay(
            createPayload({commands: movementCommands}),
            {targetTick: 3},
        );

        expect(result.state.tick).toBe(3);
        expect(result.executedTicks).toBe(3);
    });

    test('same payload produces deeply equal final states', () => {
        const payload = createPayload({commands: movementCommands});

        const firstRun = runReplay(payload, {targetTick: 5});
        const secondRun = runReplay(payload, {targetTick: 5});

        expect(firstRun.state).toEqual(secondRun.state);
        expect(firstRun.executedTicks).toBe(secondRun.executedTicks);
    });

    test('same-tick command order matches direct simulation behavior', () => {
        const commands = [
            {tick: 0, type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
            {tick: 0, type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'DOWN'},
        ];
        const payload = createPayload({commands: commands});
        const directSimulation = createSimulation({...payload.config, seed: payload.seed});

        directSimulation.step([
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'DOWN'},
        ]);
        const replayResult = runReplay(payload, {targetTick: 1});

        expect(replayResult.state).toEqual(directSimulation.getState());
        const aSnake = replayResult.state.snakes.find((snake) => snake.id === 'a-snake');
        expect(aSnake.direction).toEqual({x: 0, y: 1});
    });

    test('stops at the requested target tick', () => {
        const result = runReplay(
            createPayload({commands: movementCommands}),
            {targetTick: 4},
        );

        expect(result.state.finished).toBe(false);
        expect(result.state.tick).toBe(4);
        expect(result.executedTicks).toBe(4);
        expect(result.stopReason).toBe(REPLAY_STOP_REASONS.TARGET_TICK_REACHED);
    });

    test('stops when the match finishes', () => {
        const payload = createPayload({
            config: {mapSize: 100, tickRate: 10, durationTicks: 2},
            commands: movementCommands,
        });

        const result = runReplay(payload);

        expect(result.state.finished).toBe(true);
        expect(result.state.tick).toBe(2);
        expect(result.executedTicks).toBe(2);
        expect(result.stopReason).toBe(REPLAY_STOP_REASONS.MATCH_FINISHED);
    });

    test('stops at the safety limit when it is reached first', () => {
        const result = runReplay(
            createPayload({commands: movementCommands}),
            {targetTick: 15, safetyLimit: 2},
        );

        expect(result.state.finished).toBe(false);
        expect(result.executedTicks).toBe(2);
        expect(result.stopReason).toBe(REPLAY_STOP_REASONS.SAFETY_LIMIT_REACHED);
    });

    test('returns events and snapshots only when requested', () => {
        const payload = createPayload({
            config: {mapSize: 100, tickRate: 10, durationTicks: 2},
            commands: movementCommands,
        });

        const compactResult = runReplay(payload);
        const detailedResult = runReplay(payload, {
            includeEvents: true,
            includeSnapshots: true,
        });

        expect(compactResult.events).toBeUndefined();
        expect(compactResult.snapshots).toBeUndefined();
        expect(detailedResult.events.some((event) => event.type === 'MATCH_FINISHED')).toBe(true);
        expect(detailedResult.snapshots).toHaveLength(detailedResult.executedTicks + 1);
        expect(detailedResult.snapshots[0].tick).toBe(0);
        expect(detailedResult.snapshots[2].tick).toBe(2);
    });

    test('rejects invalid runner options with stable error codes', () => {
        const payload = createPayload();

        expectReplayError(
            () => runReplay(payload, null),
            REPLAY_ERROR_CODES.INVALID_OPTIONS,
        );
        expectReplayError(
            () => runReplay(payload, {targetTick: 0.5}),
            REPLAY_ERROR_CODES.INVALID_TARGET_TICK,
        );
        expectReplayError(
            () => runReplay(payload, {safetyLimit: 0}),
            REPLAY_ERROR_CODES.INVALID_SAFETY_LIMIT,
        );
    });
});
