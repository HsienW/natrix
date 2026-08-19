const RNG_INCREMENT = 0x6D2B79F5;
const MAX_UINT32 = 4294967296;

const mix32 = function (value) {
    var mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed = mixed ^ (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61));
    return (mixed ^ (mixed >>> 14)) >>> 0;
};

const advanceState = function (state) {
    return (state + RNG_INCREMENT) | 0;
};

const mulberry32 = function (seed) {
    var state = seed | 0;

    return function () {
        state = advanceState(state);
        var mixed = mix32(state);
        return mixed / MAX_UINT32;
    };
};

const createRng = function (seed) {
    return mulberry32(seed);
};

const generateRandomValue = function (state) {
    var nextState = advanceState(state);
    var mixed = mix32(nextState);
    return {
        value: mixed / MAX_UINT32,
        nextState: nextState,
    };
};

const nextRngState = function (state) {
    return advanceState(state);
};

export {
    createRng,
    generateRandomValue,
    mulberry32,
    nextRngState,
};
