const replayConfig = Object.freeze({
    mapSize: 100,
    tickRate: 10,
    durationTicks: 30,
});

const replayCommands = Object.freeze([
    Object.freeze({
        tick: 0,
        type: 'CHANGE_DIRECTION',
        playerId: 'a-snake',
        direction: 'RIGHT',
    }),
    Object.freeze({
        tick: 0,
        type: 'CHANGE_DIRECTION',
        playerId: 'b-snake',
        direction: 'LEFT',
    }),
    Object.freeze({
        tick: 4,
        type: 'CHANGE_DIRECTION',
        playerId: 'a-snake',
        direction: 'DOWN',
    }),
    Object.freeze({
        tick: 4,
        type: 'CHANGE_DIRECTION',
        playerId: 'b-snake',
        direction: 'UP',
    }),
    Object.freeze({
        tick: 8,
        type: 'CHANGE_DIRECTION',
        playerId: 'a-snake',
        direction: 'LEFT',
    }),
    Object.freeze({
        tick: 8,
        type: 'CHANGE_DIRECTION',
        playerId: 'b-snake',
        direction: 'RIGHT',
    }),
]);

const expectedSummary = Object.freeze({
    tick: 12,
    remainingTicks: 18,
    scores: Object.freeze({
        'a-team': 0,
        'b-team': 0,
    }),
    finished: false,
    winner: null,
    finishReason: null,
    rngState: 826223,
    snakeHeads: Object.freeze([
        Object.freeze({
            id: 'a-snake',
            position: Object.freeze({x: 1, y: 6}),
        }),
        Object.freeze({
            id: 'b-snake',
            position: Object.freeze({x: 52, y: 95}),
        }),
    ]),
});

const deterministicReplayV1 = Object.freeze({
    replay: Object.freeze({
        version: 1,
        seed: 7,
        config: replayConfig,
        commands: replayCommands,
    }),
    targetTick: 12,
    expectedHash: '540:597270:936426',
    expectedSummary: expectedSummary,
});

module.exports = {
    deterministicReplayV1,
};
