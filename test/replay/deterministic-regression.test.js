/** @jest-environment node */

const {InputBuffer} = require('../../src/js/input/input-buffer.js');
const {GameRuntime} = require('../../src/js/runtime/game-runtime.js');
const {runReplay} = require('../../src/js/replay/replay-runner.js');
const {createStateHash} = require('../../src/js/state/state-hash.js');
const {
    deterministicReplayV1,
} = require('../fixtures/deterministic-replay-v1.js');

const createSimulationCommand = function (recordedCommand) {
    return {
        type: recordedCommand.type,
        playerId: recordedCommand.playerId,
        direction: recordedCommand.direction,
    };
};

const runLiveFixture = function (fixture) {
    const inputBuffer = new InputBuffer();
    const runtime = new GameRuntime({
        config: {...fixture.replay.config, seed: fixture.replay.seed},
        inputBuffer: inputBuffer,
    });

    while (runtime.getState().tick < fixture.targetTick
        && !runtime.getState().finished) {
        const tick = runtime.getState().tick;
        const recordedCommands = fixture.replay.commands.filter((command) => {
            return command.tick === tick;
        });

        for (const recordedCommand of recordedCommands) {
            inputBuffer.push(createSimulationCommand(recordedCommand));
        }

        runtime.handleUpdate();
    }

    return runtime;
};

const summarizeState = function (state) {
    return {
        tick: state.tick,
        remainingTicks: state.remainingTicks,
        scores: {...state.scores},
        finished: state.finished,
        winner: state.winner,
        finishReason: state.finishReason,
        rngState: state.rngState,
        snakeHeads: state.snakes.map((snake) => ({
            id: snake.id,
            position: {...snake.body[0]},
        })),
    };
};

describe('deterministic replay regression', () => {
    test('live runtime and replay produce the same authoritative final state', () => {
        const liveRuntime = runLiveFixture(deterministicReplayV1);
        const replayResult = runReplay(
            deterministicReplayV1.replay,
            {targetTick: deterministicReplayV1.targetTick},
        );

        expect(replayResult.state).toEqual(liveRuntime.getState());
        expect(createStateHash(replayResult.state))
            .toBe(createStateHash(liveRuntime.getState()));
        expect(liveRuntime.getReplayPayload()).toEqual(deterministicReplayV1.replay);
    });

    test('same fixture keeps its reviewed hash and final summary', () => {
        const firstRun = runReplay(
            deterministicReplayV1.replay,
            {targetTick: deterministicReplayV1.targetTick},
        );
        const secondRun = runReplay(
            deterministicReplayV1.replay,
            {targetTick: deterministicReplayV1.targetTick},
        );

        expect(createStateHash(firstRun.state)).toBe(deterministicReplayV1.expectedHash);
        expect(createStateHash(secondRun.state)).toBe(deterministicReplayV1.expectedHash);
        expect(summarizeState(firstRun.state)).toEqual(deterministicReplayV1.expectedSummary);
        expect(secondRun.state).toEqual(firstRun.state);
    });
});
