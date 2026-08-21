import {createSimulation} from '../simulation/simulation.js';
import {ReplayPlayer} from './replay-player.js';
import {
    REPLAY_ERROR_CODES,
    createReplayError,
    validateReplayPayload,
} from './replay-schema.js';

const REPLAY_STOP_REASONS = Object.freeze({
    MATCH_FINISHED: 'MATCH_FINISHED',
    TARGET_TICK_REACHED: 'TARGET_TICK_REACHED',
    SAFETY_LIMIT_REACHED: 'SAFETY_LIMIT_REACHED',
});

const validateReplayOptions = function (options) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_OPTIONS,
            'Replay options must be an object.',
        );
    }
};

const validateReplayLimits = function (targetTick, safetyLimit) {
    if (!Number.isSafeInteger(targetTick) || targetTick < 0) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_TARGET_TICK,
            'Replay targetTick must be an integer that is zero or greater.',
        );
    }

    if (!Number.isSafeInteger(safetyLimit) || safetyLimit <= 0) {
        throw createReplayError(
            REPLAY_ERROR_CODES.INVALID_SAFETY_LIMIT,
            'Replay safetyLimit must be a positive integer.',
        );
    }
};

const getStopReason = function (state, targetTick) {
    if (state.finished) {
        return REPLAY_STOP_REASONS.MATCH_FINISHED;
    }
    if (state.tick >= targetTick) {
        return REPLAY_STOP_REASONS.TARGET_TICK_REACHED;
    }
    return REPLAY_STOP_REASONS.SAFETY_LIMIT_REACHED;
};

const runReplay = function (payload, options = {}) {
    validateReplayPayload(payload);
    validateReplayOptions(options);

    const targetTick = options.targetTick === undefined
        ? payload.config.durationTicks
        : options.targetTick;
    const safetyLimit = options.safetyLimit === undefined
        ? payload.config.durationTicks
        : options.safetyLimit;

    validateReplayLimits(targetTick, safetyLimit);

    const simulationConfig = {
        mapSize: payload.config.mapSize,
        tickRate: payload.config.tickRate,
        durationTicks: payload.config.durationTicks,
        seed: payload.seed,
    };
    const simulation = createSimulation(simulationConfig);
    const player = new ReplayPlayer(payload.commands);
    const collectedEvents = [];
    const snapshots = [];
    let executedTicks = 0;
    let state = simulation.getState();

    if (options.includeSnapshots === true) {
        // Playback needs the initial frame before the first command tick runs.
        snapshots.push(simulation.snapshot());
    }

    while (!state.finished
        && state.tick < targetTick
        && executedTicks < safetyLimit) {
        const commands = player.commandsForTick(state.tick);
        const stepResult = simulation.step(commands);

        state = stepResult.state;
        executedTicks = executedTicks + 1;

        if (options.includeEvents === true) {
            collectedEvents.push(...stepResult.events);
        }
        if (options.includeSnapshots === true) {
            snapshots.push(simulation.snapshot());
        }
    }

    const result = {
        state: state,
        executedTicks: executedTicks,
        stopReason: getStopReason(state, targetTick),
    };

    if (options.includeEvents === true) {
        result.events = collectedEvents;
    }
    if (options.includeSnapshots === true) {
        result.snapshots = snapshots;
    }

    return result;
};

export {
    REPLAY_STOP_REASONS,
    runReplay,
};
