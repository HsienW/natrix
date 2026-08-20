import {
    REPLAY_ERROR_CODES,
    createReplayError,
    validateReplayPayload,
} from './replay-schema.js';

const serializeReplay = function (payload) {
    validateReplayPayload(payload);
    return JSON.stringify(payload);
};

const parseReplay = function (serializedReplay) {
    if (typeof serializedReplay !== 'string') {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_JSON,
            'Serialized replay must be a JSON string.',
        );
    }

    let payload;

    try {
        payload = JSON.parse(serializedReplay);
    } catch (error) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_JSON,
            'Serialized replay contains invalid JSON.',
        );
    }

    validateReplayPayload(payload);
    return payload;
};

export {
    parseReplay,
    serializeReplay,
};
