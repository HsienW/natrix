import {FixedTimestepLoop} from './fixed-timestep-loop.js';

const createMainGameRuntime = function ({
    update,
    render,
    stepMs,
    maxFrameDeltaMs,
    requestFrame,
    cancelFrame,
}) {
    const loop = new FixedTimestepLoop({
        update,
        render,
        stepMs,
        maxFrameDeltaMs,
        requestFrame,
        cancelFrame,
    });

    return {
        start: function () {
            loop.start();
        },
        pause: function () {
            loop.pause();
        },
        finish: function () {
            loop.stop();
        },
        reset: function () {
            loop.reset();
        },
        isRunning: function () {
            return loop.isRunning();
        },
    };
};

export {
    createMainGameRuntime,
};
