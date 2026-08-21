import {COMMAND_TYPES, DIRECTIONS} from '../input/command-map.js';
import {copyCommandLog} from './command-log.js';

const REPLAY_VERSION = 1;

const REPLAY_PLAYER_IDS = Object.freeze([
    'a-snake',
    'b-snake',
]);

const REPLAY_ERROR_CODES = Object.freeze({
    INVALID_PAYLOAD: 'INVALID_REPLAY_PAYLOAD',
    UNSUPPORTED_VERSION: 'UNSUPPORTED_REPLAY_VERSION',
    INVALID_SEED: 'INVALID_REPLAY_SEED',
    INVALID_CONFIG: 'INVALID_REPLAY_CONFIG',
    INVALID_COMMANDS: 'INVALID_REPLAY_COMMANDS',
    INVALID_COMMAND: 'INVALID_REPLAY_COMMAND',
    INVALID_COMMAND_TICK: 'INVALID_REPLAY_COMMAND_TICK',
    INVALID_COMMAND_PLAYER: 'INVALID_REPLAY_COMMAND_PLAYER',
    INVALID_COMMAND_TYPE: 'INVALID_REPLAY_COMMAND_TYPE',
    INVALID_COMMAND_DIRECTION: 'INVALID_REPLAY_COMMAND_DIRECTION',
    INVALID_JSON: 'INVALID_REPLAY_JSON',
    INVALID_OPTIONS: 'INVALID_REPLAY_OPTIONS',
    INVALID_TARGET_TICK: 'INVALID_REPLAY_TARGET_TICK',
    INVALID_SAFETY_LIMIT: 'INVALID_REPLAY_SAFETY_LIMIT',
});

const createReplayError = function (code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
};

const isObject = function (value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const isPositiveInteger = function (value) {
    return Number.isSafeInteger(value) && value > 0;
};

const validateReplayConfig = function (config) {
    if (!isObject(config)) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_CONFIG,
            'Replay config must be an object.',
        );
    }

    const hasValidMapSize = isPositiveInteger(config.mapSize);
    const hasValidTickRate = isPositiveInteger(config.tickRate);
    const hasValidDuration = isPositiveInteger(config.durationTicks);

    if (!hasValidMapSize || !hasValidTickRate || !hasValidDuration) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_CONFIG,
            'Replay config requires positive integer mapSize, tickRate, and durationTicks values.',
        );
    }
};

const validateReplayCommand = function (command, index) {
    if (!isObject(command)) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_COMMAND,
            'Replay command at index ' + index + ' must be an object.',
        );
    }

    if (!Number.isSafeInteger(command.tick) || command.tick < 0) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_COMMAND_TICK,
            'Replay command tick must be an integer that is zero or greater.',
        );
    }

    if (!REPLAY_PLAYER_IDS.includes(command.playerId)) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_COMMAND_PLAYER,
            'Replay command has an unknown playerId.',
        );
    }

    if (command.type !== COMMAND_TYPES.CHANGE_DIRECTION) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_COMMAND_TYPE,
            'Replay command has an unsupported type.',
        );
    }

    if (!Object.values(DIRECTIONS).includes(command.direction)) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_COMMAND_DIRECTION,
            'Replay command has an unsupported direction.',
        );
    }
};

const validateReplayPayload = function (payload) {
    if (!isObject(payload)) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_PAYLOAD,
            'Replay payload must be an object.',
        );
    }

    if (payload.version !== REPLAY_VERSION) {
        throw createReplayError(
            REPLAY_ERROR_CODES.UNSUPPORTED_VERSION,
            'Replay payload version is not supported.',
        );
    }

    if (!Number.isSafeInteger(payload.seed)) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_SEED,
            'Replay seed must be an integer.',
        );
    }

    validateReplayConfig(payload.config);

    if (!Array.isArray(payload.commands)) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_COMMANDS,
            'Replay commands must be an array.',
        );
    }

    for (let index = 0; index < payload.commands.length; index++) {
        validateReplayCommand(payload.commands[index], index);
    }

    return payload;
};

const createReplayPayload = function ({seed, config, commands}) {
    const payload = {
        version: REPLAY_VERSION,
        seed: seed,
        config: config,
        commands: commands,
    };

    validateReplayPayload(payload);

    return {
        version: payload.version,
        seed: payload.seed,
        config: {
            mapSize: payload.config.mapSize,
            tickRate: payload.config.tickRate,
            durationTicks: payload.config.durationTicks,
        },
        commands: copyCommandLog(payload.commands),
    };
};

export {
    REPLAY_ERROR_CODES,
    REPLAY_VERSION,
    createReplayError,
    createReplayPayload,
    validateReplayPayload,
};
