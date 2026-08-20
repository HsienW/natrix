// A small linear congruential generator is sufficient for food placement.
// One million keeps state snapshots readable, while 41 and 17 let the
// generator visit every state in the range before the sequence repeats.
const RANDOM_STATE_RANGE = 1_000_000;
const RANDOM_STEP_MULTIPLIER = 41;
const RANDOM_STEP_INCREMENT = 17;

const normalizeState = function (state) {
    if (!Number.isFinite(state)) {
        return 0;
    }

    let normalizedState = Math.trunc(state) % RANDOM_STATE_RANGE;
    if (normalizedState < 0) {
        normalizedState = normalizedState + RANDOM_STATE_RANGE;
    }

    return normalizedState;
};

const nextRandomValue = function (state) {
    const currentState = normalizeState(state);
    const advancedState = currentState * RANDOM_STEP_MULTIPLIER
        + RANDOM_STEP_INCREMENT;
    const nextState = advancedState % RANDOM_STATE_RANGE;
    const randomValue = nextState / RANDOM_STATE_RANGE;

    return {
        value: randomValue,
        nextState: nextState,
    };
};

const createSeededRng = function (seed) {
    let state = normalizeState(seed);

    const operations = {
        next: function () {
            const result = nextRandomValue(state);
            state = result.nextState;
            return result.value;
        },
        getState: function () {
            return state;
        },
    };

    return operations;
};

export {
    createSeededRng,
    nextRandomValue,
};
