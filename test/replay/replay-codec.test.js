const {parseReplay, serializeReplay} = require('../../src/js/replay/replay-codec.js');
const {
    REPLAY_ERROR_CODES,
    createReplayPayload,
} = require('../../src/js/replay/replay-schema.js');

const createValidPayload = function () {
    return {
        version: 1,
        seed: 23,
        config: {
            mapSize: 41,
            tickRate: 10,
            durationTicks: 20,
        },
        commands: [
            {tick: 3, type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
            {tick: 3, type: 'CHANGE_DIRECTION', playerId: 'b-snake', direction: 'LEFT'},
        ],
    };
};

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

describe('replay codec', () => {
    test('round trip preserves a valid payload and command order', () => {
        const payload = createValidPayload();

        const serializedReplay = serializeReplay(payload);
        const parsedReplay = parseReplay(serializedReplay);

        expect(parsedReplay).toEqual(payload);
        expect(parsedReplay.commands[0].playerId).toBe('a-snake');
        expect(parsedReplay.commands[1].playerId).toBe('b-snake');
    });

    test('creates a versioned payload with a defensive command copy', () => {
        const source = createValidPayload();
        const payload = createReplayPayload({
            seed: source.seed,
            config: source.config,
            commands: source.commands,
        });

        source.commands[0].direction = 'DOWN';

        expect(payload).toEqual(createValidPayload());
        expect(payload.config).toEqual({mapSize: 41, tickRate: 10, durationTicks: 20});
        expect(payload.config.seed).toBeUndefined();
    });

    test('rejects invalid JSON with a stable error code', () => {
        expectReplayError(
            () => parseReplay('{invalid json'),
            REPLAY_ERROR_CODES.INVALID_JSON,
        );
    });

    test('rejects an unsupported replay version', () => {
        const payload = {...createValidPayload(), version: 2};

        expectReplayError(
            () => serializeReplay(payload),
            REPLAY_ERROR_CODES.UNSUPPORTED_VERSION,
        );
    });

    test('rejects an invalid replay seed', () => {
        const payload = {...createValidPayload(), seed: '23'};

        expectReplayError(
            () => serializeReplay(payload),
            REPLAY_ERROR_CODES.INVALID_SEED,
        );
    });

    test('rejects an incompatible config', () => {
        const payload = createValidPayload();
        payload.config.mapSize = 0;

        expectReplayError(
            () => serializeReplay(payload),
            REPLAY_ERROR_CODES.INVALID_CONFIG,
        );
    });

    test('rejects invalid command ticks', () => {
        const payload = createValidPayload();
        payload.commands[0].tick = 0.5;

        expectReplayError(
            () => serializeReplay(payload),
            REPLAY_ERROR_CODES.INVALID_COMMAND_TICK,
        );
    });

    test('rejects unknown players', () => {
        const payload = createValidPayload();
        payload.commands[0].playerId = 'missing-snake';

        expectReplayError(
            () => serializeReplay(payload),
            REPLAY_ERROR_CODES.INVALID_COMMAND_PLAYER,
        );
    });

    test('rejects unsupported command types', () => {
        const payload = createValidPayload();
        payload.commands[0].type = 'PAUSE';

        expectReplayError(
            () => serializeReplay(payload),
            REPLAY_ERROR_CODES.INVALID_COMMAND_TYPE,
        );
    });

    test('rejects malformed directions', () => {
        const payload = createValidPayload();
        payload.commands[0].direction = 'SIDEWAYS';

        expectReplayError(
            () => serializeReplay(payload),
            REPLAY_ERROR_CODES.INVALID_COMMAND_DIRECTION,
        );
    });

    test('rejects a payload without a command array', () => {
        const payload = createValidPayload();
        delete payload.commands;

        expectReplayError(
            () => serializeReplay(payload),
            REPLAY_ERROR_CODES.INVALID_COMMANDS,
        );
    });
});
