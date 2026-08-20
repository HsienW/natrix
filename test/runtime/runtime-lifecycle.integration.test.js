const {GameRuntime} = require('../../src/js/runtime/game-runtime.js');
const {InputBuffer} = require('../../src/js/input/input-buffer.js');

const defaultConfig = {mapSize: 41, tickRate: 10, durationTicks: 600, seed: 0};

const createRuntime = function () {
    const frames = [];
    let nextId = 1;

    const runtime = new GameRuntime({
        config: defaultConfig,
        inputBuffer: new InputBuffer(),
        renderCallback: () => {},
        stepMs: 100,
        maxFrameDeltaMs: 250,
        requestFrame: (cb) => {
            const id = nextId++;
            frames.push({id, cb});
            return id;
        },
        cancelFrame: (id) => {
            const idx = frames.findIndex((f) => f.id === id);
            if (idx >= 0) {
                frames.splice(idx, 1);
            }
        },
    });

    return {runtime, frames};
};

describe('runtime lifecycle integration', () => {
    test('every valid transition returns expected result and side effect', () => {
        const {runtime} = createRuntime();

        expect(runtime.getLifecycleState()).toBe('IDLE');

        const startResult = runtime.dispatch('START');
        expect(startResult.ok).toBe(true);
        expect(startResult.from).toBe('IDLE');
        expect(startResult.to).toBe('RUNNING');
        expect(runtime.isRunning()).toBe(true);

        const pauseResult = runtime.dispatch('PAUSE');
        expect(pauseResult.ok).toBe(true);
        expect(pauseResult.from).toBe('RUNNING');
        expect(pauseResult.to).toBe('PAUSED');
        expect(runtime.isRunning()).toBe(false);

        const resumeResult = runtime.dispatch('RESUME');
        expect(resumeResult.ok).toBe(true);
        expect(resumeResult.from).toBe('PAUSED');
        expect(resumeResult.to).toBe('RUNNING');
        expect(runtime.isRunning()).toBe(true);

        const finishResult = runtime.dispatch('FINISH');
        expect(finishResult.ok).toBe(true);
        expect(finishResult.from).toBe('RUNNING');
        expect(finishResult.to).toBe('FINISHED');
        expect(runtime.isRunning()).toBe(false);
    });

    test('every invalid transition returns INVALID_RUNTIME_TRANSITION with no side effect', () => {
        const {runtime} = createRuntime();

        const pauseFromIdle = runtime.dispatch('PAUSE');
        expect(pauseFromIdle.ok).toBe(false);
        expect(pauseFromIdle.code).toBe('INVALID_RUNTIME_TRANSITION');
        expect(runtime.isRunning()).toBe(false);

        runtime.dispatch('START');

        const startWhileRunning = runtime.dispatch('START');
        expect(startWhileRunning.ok).toBe(false);
        expect(startWhileRunning.code).toBe('INVALID_RUNTIME_TRANSITION');

        const resetFromRunning = runtime.dispatch('RESET');
        expect(resetFromRunning.ok).toBe(false);
        expect(resetFromRunning.code).toBe('INVALID_RUNTIME_TRANSITION');
    });

    test('duplicate START while RUNNING schedules no second rAF', () => {
        const {runtime, frames} = createRuntime();

        runtime.dispatch('START');
        const frameCountAfterStart = frames.length;

        runtime.dispatch('START');

        expect(frames.length).toBe(frameCountAfterStart);
    });

    test('repeated PAUSE, RESUME, FINISH, and RESET calls are safe', () => {
        const {runtime} = createRuntime();

        runtime.dispatch('START');

        expect(runtime.dispatch('PAUSE').ok).toBe(true);
        expect(runtime.dispatch('PAUSE').ok).toBe(false);

        expect(runtime.dispatch('RESUME').ok).toBe(true);
        expect(runtime.dispatch('RESUME').ok).toBe(false);

        expect(runtime.dispatch('FINISH').ok).toBe(true);
        expect(runtime.dispatch('FINISH').ok).toBe(false);

        expect(runtime.dispatch('RESET').ok).toBe(true);
        expect(runtime.dispatch('RESET').ok).toBe(false);

        expect(runtime.getLifecycleState()).toBe('IDLE');
    });

    test('paused elapsed wall time is not added on resume', () => {
        const {runtime, frames} = createRuntime();

        runtime.dispatch('START');
        const initFrame = frames.shift();
        initFrame.cb(0);

        const stepFrame = frames.shift();
        stepFrame.cb(100);
        expect(runtime.getState().tick).toBe(1);

        runtime.dispatch('PAUSE');

        runtime.dispatch('RESUME');
        const resumeInitFrame = frames.shift();
        resumeInitFrame.cb(50000);

        const resumeStepFrame = frames.shift();
        resumeStepFrame.cb(50100);

        expect(runtime.getState().tick).toBe(2);
    });

    test('reset clears input, simulation state, and lifecycle', () => {
        const {runtime, frames} = createRuntime();

        runtime.inputBuffer.push({type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'});
        runtime.dispatch('START');
        const initFrame = frames.shift();
        initFrame.cb(0);
        const stepFrame = frames.shift();
        stepFrame.cb(100);

        expect(runtime.getState().tick).toBe(1);

        runtime.dispatch('FINISH');
        runtime.dispatch('RESET');

        expect(runtime.getLifecycleState()).toBe('IDLE');
        expect(runtime.getState().tick).toBe(0);
        expect(runtime.inputBuffer.size()).toBe(0);
        expect(runtime.isRunning()).toBe(false);
    });

    test('START from FINISHED auto-resets and starts a new match', () => {
        const {runtime, frames} = createRuntime();

        runtime.dispatch('START');
        expect(runtime.getLifecycleState()).toBe('RUNNING');

        runtime.dispatch('FINISH');
        expect(runtime.getLifecycleState()).toBe('FINISHED');

        const result = runtime.dispatch('START');
        expect(result.ok).toBe(true);
        expect(result.from).toBe('IDLE');
        expect(result.to).toBe('RUNNING');
        expect(runtime.getLifecycleState()).toBe('RUNNING');
        expect(runtime.isRunning()).toBe(true);
        expect(runtime.getState().tick).toBe(0);
    });

    test('lifecycle listeners are notified on each successful transition', () => {
        const {runtime} = createRuntime();
        const events = [];

        runtime.onLifecycleChange((result) => {
            events.push({...result});
        });

        runtime.dispatch('START');
        runtime.dispatch('PAUSE');
        runtime.dispatch('RESUME');
        runtime.dispatch('FINISH');
        runtime.dispatch('RESET');

        expect(events).toHaveLength(5);
        expect(events[0]).toEqual({ok: true, action: 'START', from: 'IDLE', to: 'RUNNING'});
        expect(events[1]).toEqual({ok: true, action: 'PAUSE', from: 'RUNNING', to: 'PAUSED'});
        expect(events[2]).toEqual({ok: true, action: 'RESUME', from: 'PAUSED', to: 'RUNNING'});
        expect(events[3]).toEqual({ok: true, action: 'FINISH', from: 'RUNNING', to: 'FINISHED'});
        expect(events[4]).toEqual({ok: true, action: 'RESET', from: 'FINISHED', to: 'IDLE'});
    });

    test('START from FINISHED notifies RESET before START', () => {
        const {runtime} = createRuntime();
        const transitions = [];
        runtime.onLifecycleChange((result) => transitions.push(result));

        runtime.dispatch('START');
        runtime.dispatch('FINISH');
        transitions.length = 0;
        runtime.dispatch('START');

        expect(transitions).toEqual([
            {ok: true, action: 'RESET', from: 'FINISHED', to: 'IDLE'},
            {ok: true, action: 'START', from: 'IDLE', to: 'RUNNING'},
        ]);
    });

    test('lifecycle listeners are NOT notified on invalid transitions', () => {
        const {runtime} = createRuntime();
        const events = [];

        runtime.onLifecycleChange((result) => {
            events.push({...result});
        });

        runtime.dispatch('PAUSE');
        runtime.dispatch('FINISH');

        expect(events).toHaveLength(0);
    });
});
