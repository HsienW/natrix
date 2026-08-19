/** @jest-environment node */

const {createSimulation} = require('../../src/js/simulation/simulation.js');
const {createSnapshot} = require('../../src/js/state/snapshot.js');

const makeRandom = function (values) {
    let index = 0;
    return () => {
        if (index >= values.length) {
            return 0;
        }
        return values[index++];
    };
};

describe('simulation boundary', () => {
    test('runs in Node environment without JSDOM', () => {
        expect(typeof document).toBe('undefined');
        expect(typeof window).toBe('undefined');

        const simulation = createSimulation(
            {mapSize: 41, tickRate: 10, durationTicks: 600},
            {random: makeRandom([0, 0, 0, 0, 0])},
        );

        const snapshot = simulation.snapshot();
        expect(snapshot.tick).toBe(0);
        expect(snapshot.mapSize).toBe(41);
        expect(snapshot.snakes).toHaveLength(2);
    });

    test('step advances tick and returns events', () => {
        const simulation = createSimulation(
            {},
            {random: makeRandom([0, 0, 0, 0, 0])},
        );

        const result = simulation.step([
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
        ]);

        expect(result.state.tick).toBe(1);
        expect(Array.isArray(result.events)).toBe(true);
    });

    test('snapshot projects read-only view without DOM references', () => {
        const simulation = createSimulation(
            {},
            {random: makeRandom([0, 0, 0, 0, 0])},
        );

        const snapshot = simulation.snapshot();

        expect(snapshot).toEqual(expect.objectContaining({
            tick: 0,
            mapSize: 41,
            remainingSeconds: 60,
            finished: false,
            winner: null,
        }));

        expect(snapshot.snakes).toHaveLength(2);
        expect(snapshot.snakes[0]).toEqual(expect.objectContaining({
            id: 'a-snake',
            team: 'a-team',
            alive: true,
            style: 'a-snake-body',
        }));

        expect(snapshot.score).toEqual({blue: 0, red: 0});
    });

    test('snapshot does not contain mutable references to authoritative state', () => {
        const simulation = createSimulation(
            {},
            {random: makeRandom([0, 0, 0, 0, 0])},
        );

        const snapshotA = simulation.snapshot();
        simulation.step([]);
        const snapshotB = simulation.snapshot();

        expect(snapshotA.tick).toBe(0);
        expect(snapshotB.tick).toBe(1);
    });

    test('reset creates a fresh initial state', () => {
        const simulation = createSimulation(
            {},
            {random: makeRandom([0, 0, 0, 0, 0])},
        );

        simulation.step([
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
        ]);
        expect(simulation.getState().tick).toBe(1);

        simulation.reset({}, {random: makeRandom([0, 0, 0, 0, 0])});
        expect(simulation.getState().tick).toBe(0);
    });

    test('getState returns current authoritative state', () => {
        const simulation = createSimulation(
            {},
            {random: makeRandom([0, 0, 0, 0, 0])},
        );

        const state = simulation.getState();
        expect(state.version).toBe(1);
        expect(state.config.mapSize).toBe(41);
        expect(state.snakes).toHaveLength(2);
    });

    test('multiple steps accumulate correctly', () => {
        const simulation = createSimulation(
            {},
            {random: makeRandom([0, 0, 0, 0, 0])},
        );

        simulation.step([
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
        ]);
        simulation.step([]);
        simulation.step([]);

        const state = simulation.getState();
        expect(state.tick).toBe(3);
        expect(state.remainingTicks).toBe(597);

        const aSnake = state.snakes.find((s) => s.id === 'a-snake');
        expect(aSnake.body[0].x).toBe(4);
    });

    test('createSnapshot can be called independently without simulation facade', () => {
        const state = {
            tick: 42,
            config: {mapSize: 41, tickRate: 10, durationTicks: 600},
            remainingTicks: 558,
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    body: [{x: 10, y: 10}],
                    style: 'a-snake-body',
                },
            ],
            food: [],
            scores: {'a-team': 5, 'b-team': 3},
            finished: false,
            winner: null,
        };

        const snapshot = createSnapshot(state);

        expect(snapshot.tick).toBe(42);
        expect(snapshot.remainingSeconds).toBe(56);
        expect(snapshot.score).toEqual({blue: 5, red: 3});
        expect(snapshot.snakes).toHaveLength(1);
    });
});
