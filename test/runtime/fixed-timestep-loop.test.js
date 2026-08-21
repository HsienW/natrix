const {FixedTimestepLoop} = require('../../src/js/runtime/fixed-timestep-loop.js');

const createScheduler = function () {
    const frames = new Map();
    const cancelledFrames = [];
    let nextFrameId = 1;

    return {
        cancelledFrames,
        requestFrame: jest.fn((callback) => {
            const frameId = nextFrameId++;
            frames.set(frameId, callback);
            return frameId;
        }),
        cancelFrame: jest.fn((frameId) => {
            cancelledFrames.push(frameId);
            frames.delete(frameId);
        }),
        runNextFrame: function (timestamp) {
            const [frameId, callback] = frames.entries().next().value;
            frames.delete(frameId);
            callback(timestamp);
        },
    };
};

describe('FixedTimestepLoop', () => {
    test('runs simulation at fixed steps and renders once per browser frame', () => {
        const scheduler = createScheduler();
        const update = jest.fn();
        const render = jest.fn();
        const loop = new FixedTimestepLoop({
            update,
            render,
            stepMs: 100,
            requestFrame: scheduler.requestFrame,
            cancelFrame: scheduler.cancelFrame,
        });

        loop.start();
        scheduler.runNextFrame(1000);
        scheduler.runNextFrame(1250);

        expect(update).toHaveBeenCalledTimes(2);
        expect(update).toHaveBeenNthCalledWith(1, 100);
        expect(render).toHaveBeenNthCalledWith(1, 0, 1000);
        expect(render).toHaveBeenNthCalledWith(2, 0.5, 1250);
    });

    test('does not accumulate paused time and keeps the partial step on resume', () => {
        const scheduler = createScheduler();
        const update = jest.fn();
        const loop = new FixedTimestepLoop({
            update,
            render: jest.fn(),
            stepMs: 100,
            requestFrame: scheduler.requestFrame,
            cancelFrame: scheduler.cancelFrame,
        });

        loop.start();
        scheduler.runNextFrame(0);
        scheduler.runNextFrame(60);
        loop.pause();
        loop.start();
        scheduler.runNextFrame(10000);
        scheduler.runNextFrame(10040);

        expect(update).toHaveBeenCalledTimes(1);
        expect(scheduler.cancelledFrames).toEqual([3]);
    });

    test('caps catch-up work after a long frame', () => {
        const scheduler = createScheduler();
        const update = jest.fn();
        const loop = new FixedTimestepLoop({
            update,
            render: jest.fn(),
            stepMs: 100,
            maxFrameDeltaMs: 250,
            requestFrame: scheduler.requestFrame,
            cancelFrame: scheduler.cancelFrame,
        });

        loop.start();
        scheduler.runNextFrame(0);
        scheduler.runNextFrame(5000);

        expect(update).toHaveBeenCalledTimes(2);
    });

    test('can stop safely from inside a fixed update', () => {
        const scheduler = createScheduler();
        const render = jest.fn();
        let loop;
        const update = jest.fn(() => {
            loop.stop();
        });
        loop = new FixedTimestepLoop({
            update,
            render,
            stepMs: 100,
            requestFrame: scheduler.requestFrame,
            cancelFrame: scheduler.cancelFrame,
        });

        loop.start();
        scheduler.runNextFrame(0);
        scheduler.runNextFrame(250);

        expect(update).toHaveBeenCalledTimes(1);
        expect(render).toHaveBeenLastCalledWith(0, 250);
        expect(loop.isRunning()).toBe(false);
        expect(scheduler.requestFrame).toHaveBeenCalledTimes(2);
    });

    test('keeps lifecycle methods idempotent and stop clears accumulated time', () => {
        const scheduler = createScheduler();
        const update = jest.fn();
        const loop = new FixedTimestepLoop({
            update,
            render: jest.fn(),
            stepMs: 100,
            requestFrame: scheduler.requestFrame,
            cancelFrame: scheduler.cancelFrame,
        });

        loop.start();
        loop.start();
        expect(scheduler.requestFrame).toHaveBeenCalledTimes(1);

        scheduler.runNextFrame(0);
        scheduler.runNextFrame(60);
        loop.stop();
        loop.stop();
        loop.start();
        scheduler.runNextFrame(1000);
        scheduler.runNextFrame(1040);

        expect(update).not.toHaveBeenCalled();
    });
});
