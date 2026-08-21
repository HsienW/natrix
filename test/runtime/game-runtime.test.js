const {GameRuntime} = require('../../src/js/runtime/game-runtime.js');
const {InputBuffer} = require('../../src/js/input/input-buffer.js');

const defaultConfig = {mapSize: 41, tickRate: 10, durationTicks: 600, seed: 0};

const createRenderer = function () {
    return {
        init: jest.fn(),
        render: jest.fn(),
        resize: jest.fn(),
        destroy: jest.fn(),
    };
};

const createRuntime = function (overrides = {}) {
    const buffer = overrides.inputBuffer || new InputBuffer();
    const renderer = overrides.renderer || createRenderer();
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
        renderer,
        eventCallback,
        stepMs: overrides.stepMs || 100,
        maxFrameDeltaMs: overrides.maxFrameDeltaMs || 250,
        requestFrame,
        cancelFrame,
    });

    return {
        runtime,
        buffer,
        renderer,
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
        const {runtime, renderer} = createRuntime();
        const snapshot = runtime.getSnapshot();

        expect(snapshot.tick).toBe(0);
        expect(snapshot.mapSize).toBe(41);
        expect(snapshot.snakes).toHaveLength(2);
        expect(snapshot.finished).toBe(false);
        expect(renderer.init).toHaveBeenCalledTimes(1);
        expect(renderer.init).toHaveBeenCalledWith(defaultConfig);
    });

    test('initializes renderer with normalized simulation config', () => {
        const renderer = createRenderer();

        createRuntime({
            config: {seed: 7},
            renderer: renderer,
        });

        expect(renderer.init).toHaveBeenCalledWith({
            mapSize: 41,
            tickRate: 10,
            durationTicks: 600,
            seed: 7,
        });
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
        expect(runtime.getCommandLog()).toEqual([]);
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

    test('records commands with the tick that is about to run', () => {
        const {runtime, buffer} = createRuntime();

        buffer.push({type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'});
        buffer.push({type: 'CHANGE_DIRECTION', playerId: 'b-snake', direction: 'LEFT'});
        runtime.handleUpdate();

        buffer.push({type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'DOWN'});
        runtime.handleUpdate();

        expect(runtime.getCommandLog()).toEqual([
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT', tick: 0},
            {type: 'CHANGE_DIRECTION', playerId: 'b-snake', direction: 'LEFT', tick: 0},
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'DOWN', tick: 1},
        ]);
    });

    test('records commands even when simulation rejects their values', () => {
        const {runtime, buffer} = createRuntime();

        buffer.push({
            type: 'CHANGE_DIRECTION',
            playerId: 'missing-snake',
            direction: 'SIDEWAYS',
        });
        runtime.handleUpdate();

        expect(runtime.getCommandLog()).toEqual([{
            type: 'CHANGE_DIRECTION',
            playerId: 'missing-snake',
            direction: 'SIDEWAYS',
            tick: 0,
        }]);
    });

    test('creates a replay payload from authoritative config and recorded commands', () => {
        const {runtime, buffer} = createRuntime();

        buffer.push({type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'});
        runtime.handleUpdate();

        const payload = runtime.getReplayPayload();

        expect(payload).toEqual({
            version: 1,
            seed: 0,
            config: {mapSize: 41, tickRate: 10, durationTicks: 600},
            commands: [
                {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT', tick: 0},
            ],
        });
    });

    test('render and pause do not create command entries', () => {
        const {runtime} = createRuntime();

        runtime.handleRender(0.5);
        runtime.start();
        runtime.pause();

        expect(runtime.getCommandLog()).toEqual([]);
    });

    test('handleRender passes snapshot and frame metadata to the renderer', () => {
        const {runtime, renderer} = createRuntime();

        runtime.handleRender(0.5, 1200);

        expect(renderer.render).toHaveBeenCalledWith(expect.any(Object), {
            alpha: 0.5,
            frameTimestamp: 1200,
        });
        const snapshot = renderer.render.mock.calls[0][0];
        expect(snapshot.tick).toBe(0);
        expect(snapshot.mapSize).toBe(41);
    });

    test('swaps renderer through the runtime host', () => {
        const {runtime, renderer} = createRuntime();
        const nextRenderer = createRenderer();

        runtime.setRenderer(nextRenderer);
        runtime.handleRender(0.25, 100);

        expect(renderer.destroy).toHaveBeenCalledTimes(1);
        expect(nextRenderer.init).toHaveBeenCalledWith(defaultConfig);
        expect(nextRenderer.render).toHaveBeenCalledWith(expect.any(Object), {
            alpha: 0.25,
            frameTimestamp: 100,
        });
    });

    test('forwards resize and destroys renderer resources once', () => {
        const {runtime, renderer} = createRuntime();
        const viewport = {width: 640, height: 640};

        runtime.resizeRenderer(viewport);
        runtime.destroy();
        runtime.destroy();

        expect(renderer.resize).toHaveBeenCalledWith(viewport);
        expect(renderer.destroy).toHaveBeenCalledTimes(1);
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

    test('renderer receives snapshot and metadata after simulation step', () => {
        const {runtime, renderer, frames} = createRuntime();

        startAndInit(runtime, frames);
        runNextFrame(frames, 150);

        expect(renderer.render).toHaveBeenCalled();
        const lastCall = renderer.render.mock.calls[renderer.render.mock.calls.length - 1];
        const snapshot = lastCall[0];
        const meta = lastCall[1];

        expect(snapshot).toBeDefined();
        expect(snapshot.tick).toBe(1);
        expect(typeof meta.alpha).toBe('number');
        expect(meta.alpha).toBeGreaterThanOrEqual(0);
        expect(meta.alpha).toBeLessThan(1);
        expect(meta.frameTimestamp).toBe(150);
    });

    test('multiple fixed steps may run before one render', () => {
        const {runtime, renderer} = createRuntime({stepMs: 100});

        runtime.handleUpdate();
        runtime.handleUpdate();
        runtime.handleRender(0.5);

        const state = runtime.getState();
        expect(state.tick).toBe(2);
        expect(renderer.render).toHaveBeenCalledTimes(1);
    });

    test('render may run with zero simulation steps', () => {
        const {runtime, frames, renderer} = createRuntime();

        startAndInit(runtime, frames);
        renderer.render.mockClear();
        runNextFrame(frames, 50);

        const state = runtime.getState();
        expect(state.tick).toBe(0);
        expect(renderer.render).toHaveBeenCalledTimes(1);
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
