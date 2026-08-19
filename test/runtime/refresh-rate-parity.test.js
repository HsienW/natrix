const {GameRuntime} = require('../../src/js/runtime/game-runtime.js');
const {InputBuffer} = require('../../src/js/input/input-buffer.js');

const config = {mapSize: 41, tickRate: 10, durationTicks: 600};

const runSequence = function (frameDeltas) {
    const buffer = new InputBuffer();
    const randomFn = () => 0;
    let timestamp = 0;
    let pendingCallback = null;

    const runtime = new GameRuntime({
        config,
        environment: {random: randomFn},
        inputBuffer: buffer,
        renderCallback: () => {},
        stepMs: 100,
        maxFrameDeltaMs: 250,
        requestFrame: (cb) => {
            pendingCallback = cb;
            return 1;
        },
        cancelFrame: () => {},
    });

    runtime.start();

    for (const delta of frameDeltas) {
        timestamp += delta;
        if (pendingCallback) {
            const cb = pendingCallback;
            pendingCallback = null;
            cb(timestamp);
        }
    }

    return runtime.getState();
};

describe('refresh rate parity', () => {
    test('60 Hz, 120 Hz, and 144 Hz produce the same tick count and state over equal duration', () => {
        const totalMs = 2000;

        const buildFrames = function (intervalMs, totalMs) {
            const frames = [0]; // init frame
            let accumulated = 0;
            while (accumulated < totalMs) {
                const remaining = totalMs - accumulated;
                const delta = Math.min(intervalMs, remaining);
                frames.push(delta);
                accumulated += delta;
            }
            return frames;
        };

        const frames60 = buildFrames(1000 / 60, totalMs);
        const frames120 = buildFrames(1000 / 120, totalMs);
        const frames144 = buildFrames(1000 / 144, totalMs);

        const state60 = runSequence(frames60);
        const state120 = runSequence(frames120);
        const state144 = runSequence(frames144);

        expect(state60.tick).toBe(state120.tick);
        expect(state120.tick).toBe(state144.tick);

        expect(state60.snakes).toEqual(state120.snakes);
        expect(state120.snakes).toEqual(state144.snakes);

        expect(state60.food).toEqual(state120.food);
        expect(state60.scores).toEqual(state120.scores);
        expect(state60.remainingTicks).toBe(state120.remainingTicks);
    });

    test('long elapsed time is clamped and does not cause unbounded catch-up', () => {
        const state = runSequence([0, 10000]);

        const maxCatchUpSteps = Math.ceil(250 / 100);
        expect(state.tick).toBeLessThanOrEqual(maxCatchUpSteps);
        expect(state.tick).toBeGreaterThan(0);
    });
});
