const RNG_INCREMENT = 0x6D2B79F5;
const UINT32_RANGE = 4294967296;

const mix32 = function (value) {
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed = mixed ^ (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61));
    return (mixed ^ (mixed >>> 14)) >>> 0;
};

const advanceState = function (state) {
    return (state + RNG_INCREMENT) | 0;
};

const nextRandomValue = function (state) {
    const nextState = advanceState(state);
    const mixed = mix32(nextState);

    return {
        value: mixed / UINT32_RANGE,
        nextState: nextState,
    };
};

const createSeededRng = function (seed) {
    let state = seed | 0;

    const random = function () {
        const result = nextRandomValue(state);
        state = result.nextState;
        return result.value;
    };

    // State is exposed as plain data so a simulation can resume the same sequence.
    random.getState = function () {
        return state;
    };

    return random;
};

export {
    createSeededRng,
    nextRandomValue,
};
