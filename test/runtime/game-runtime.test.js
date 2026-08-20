const {GameRuntime} = require('../../src/js/runtime/game-runtime.js');
const {InputBuffer} = require('../../src/js/input/input-buffer.js');

const defaultConfig = {mapSize: 41, tickRate: 10, durationTicks: 600, seed: 0};

const createRuntime = function (overrides = {}) {
    const buffer = overrides.inputBuffer || new InputBuffer();
    const renderCallback = overrides.renderCallback || jest.fn();
    const eventCallback = overrides.eventCallback || jest.fn();
    const frames = [];
    let nextId = 1;

    const requestFrame = jest.fn((cb) => {
        const id = nextId++;
        frames.push({id, cb});
        return id;
    });
    const cancelFrame = jest.fn((id) => {
        const idx = frames.findIndex((f) => f.id === id);
        if (idx >= 0) {
            frames.splice(idx, 1);
        }
    });

    const runtime = new GameRuntime({
        config: overrides.config || defaultConfig,
        inputBuffer: buffer,
        renderCallback,
        eventCallback,
        stepMs: overrides.stepMs || 100,
        maxFrameDeltaMs: overrides.maxFrameDeltaMs || 250,
        requestFrame,
        cancelFrame,
    });

    return {
        runtime,
        buffer,
        renderCallback,
        eventCallback,
        frames,
        requestFrame,
        cancelFrame,
    };
};

const startAndInit = function (runtime, frames) {
    runtime.start();
    expect(frames.length).toBeGreaterThan(0);
    const initEntry = frames.shift();
    initEntry.cb(0);
};

const runNextFrame = function (frames, timestamp) {
    expect(frames.length).toBeGreaterThan(0);
    const entry = frames.shift();
    entry.cb(timestamp);
};

describe('GameRuntime', () => {
    test('creates with initial snapshot at tick 0', () => {
        const {runtime} = createRuntime();
        const snapshot = runtime.getSnapshot();

        expect(snapshot.tick).toBe(0);
        expect(snapshot.mapSize).toBe(41);
        expect(snapshot.snakes).toHaveLength(2);
        expect(snapshot.finished).toBe(false);
    });

    test('start schedules one rAF frame', () => {
        const {runtime, frames, requestFrame} = createRuntime();

        runtime.start();

        expect(runtime.isRunning()).toBe(true);
        expect(frames).toHaveLength(1);
        expect(requestFrame).toHaveBeenCalledTimes(1);
    });

    test('start is idempotent while running', () => {
        const {runtime, requestFrame} = createRuntime();

        runtime.start();
        runtime.start();

        expect(requestFrame).toHaveBeenCalledTimes(1);
    });

    test('start from finished resets and starts a new match', () => {
        const {runtime, frames, requestFrame} = createRuntime();

        runtime.start();
        const state = runtime.getState();
        Object.assign(state, {finished: true, winner: 'a-team', finishReason: 'survival'});

        runtime.stop();
        requestFrame.mockClear();
        frames.length = 0;

        runtime.start();

        expect(runtime.isRunning()).toBe(true);
        expect(runtime.getLifecycleState()).toBe('RUNNING');
        expect(runtime.getState().finished).toBe(false);
        expect(requestFrame).toHaveBeenCalledTimes(1);
    });

    test('pause stops the loop and cancels the pending frame', () => {
        const {runtime, frames, cancelFrame} = createRuntime();

        runtime.start();
        expect(frames).toHaveLength(1);
        const pendingId = frames[0].id;

        runtime.pause();

        expect(runtime.isRunning()).toBe(false);
        expect(cancelFrame).toHaveBeenCalledWith(pendingId);
    });

    test('stop clears accumulator and cancels frame', () => {
        const {runtime, frames} = createRuntime();

        runtime.start();
        runtime.stop();

        expect(runtime.isRunning()).toBe(false);
        expect(frames).toHaveLength(0);
    });

    test('reset clears input, simulation, and event log', () => {
        const {runtime, buffer, frames} = createRuntime();

        buffer.push({type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'});
        startAndInit(runtime, frames);
        runNextFrame(frames, 200);

        runtime.stop();
        runtime.reset();

        expect(buffer.size()).toBe(0);
        expect(runtime.getState().tick).toBe(0);
        expect(runtime.getEventLog()).toEqual([]);
        expect(runtime.getSnapshot().tick).toBe(0);
        expect(runtime.isRunning()).toBe(false);
    });

    test('handleUpdate drains input and steps simulation', () => {
        const {runtime, buffer} = createRuntime();

        buffer.push({type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'});

        runtime.handleUpdate();

        expect(buffer.size()).toBe(0);
        expect(runtime.getState().tick).toBe(1);

        const aSnake = runtime.getState().snakes.find((s) => s.id === 'a-snake');
        expect(aSnake.direction).toEqual({x: 1, y: 0});
    });

    test('handleRender calls render callback with snapshot and alpha', () => {
        const {runtime, renderCallback} = createRuntime();

        runtime.handleRender(0.5);

        expect(renderCallback).toHaveBeenCalledWith(expect.any(Object), 0.5);
        const snapshot = renderCallback.mock.calls[0][0];
        expect(snapshot.tick).toBe(0);
        expect(snapshot.mapSize).toBe(41);
    });

    test('drains input commands once per simulation step, not per render frame', () => {
        const {runtime, buffer, frames} = createRuntime();

        buffer.push({type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'});
        startAndInit(runtime, frames);
        runNextFrame(frames, 102);

        expect(buffer.size()).toBe(0);

        const aSnake = runtime.getState().snakes.find((s) => s.id === 'a-snake');
        expect(aSnake.direction).toEqual({x: 1, y: 0});
    });

    test('render callback receives snapshot and alpha after simulation step', () => {
        const {runtime, renderCallback, frames} = createRuntime();

        startAndInit(runtime, frames);
        runNextFrame(frames, 150);

        expect(renderCallback).toHaveBeenCalled();
        const lastCall = renderCallback.mock.calls[renderCallback.mock.calls.length - 1];
        const snapshot = lastCall[0];
        const alpha = lastCall[1];

        expect(snapshot).toBeDefined();
        expect(snapshot.tick).toBe(1);
        expect(typeof alpha).toBe('number');
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThan(1);
    });

    test('multiple fixed steps may run before one render', () => {
        const {runtime, renderCallback} = createRuntime({stepMs: 100});

        runtime.handleUpdate();
        runtime.handleUpdate();
        runtime.handleRender(0.5);

        const state = runtime.getState();
        expect(state.tick).toBe(2);
        expect(renderCallback).toHaveBeenCalledTimes(1);
    });

    test('render may run with zero simulation steps', () => {
        const {runtime, frames, renderCallback} = createRuntime();

        startAndInit(runtime, frames);
        renderCallback.mockClear();
        runNextFrame(frames, 50);

        const state = runtime.getState();
        expect(state.tick).toBe(0);
        expect(renderCallback).toHaveBeenCalledTimes(1);
    });

    test('event log collects domain events from simulation steps', () => {
        const {runtime, buffer} = createRuntime();

        // Place snake directly on food so a FOOD_EATEN event fires
        const state = runtime.getState();
        state.snakes[0].body[0] = {x: state.food[0].position.x, y: state.food[0].position.y};

        buffer.push({type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'});
        runtime.handleUpdate();

        const events = runtime.getEventLog();
        expect(events.some((e) => e.type === 'FOOD_EATEN')).toBe(true);
    });

    test('getEventLog returns a defensive copy', () => {
        const {runtime} = createRuntime();
        const logA = runtime.getEventLog();
        const logB = runtime.getEventLog();

        expect(logA).not.toBe(logB);
        expect(logA).toEqual(logB);
    });

    test('stops the loop and forwards events when the match finishes', () => {
        const eventCallback = jest.fn();
        const {runtime, frames} = createRuntime({
            config: {...defaultConfig, durationTicks: 1},
            eventCallback,
        });

        startAndInit(runtime, frames);
        runNextFrame(frames, 100);

        expect(runtime.getLifecycleState()).toBe('FINISHED');
        expect(runtime.isRunning()).toBe(false);
        expect(frames).toHaveLength(0);
        expect(eventCallback).toHaveBeenCalledWith(expect.objectContaining({
            type: 'MATCH_FINISHED',
            reason: 'draw',
        }));
    });

    test('throws when config is missing', () => {
        expect(() => new GameRuntime({
            inputBuffer: new InputBuffer(),
        })).toThrow(TypeError);
    });

    test('throws when inputBuffer is missing', () => {
        expect(() => new GameRuntime({
            config: defaultConfig,
        })).toThrow(TypeError);
    });
});
