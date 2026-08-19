import {FixedTimestepLoop} from './fixed-timestep-loop.js';
import {createSimulation} from '../simulation/simulation.js';
import {InputBuffer} from '../input/input-buffer.js';
import {RuntimeStateMachine} from './runtime-state-machine.js';
import {RUNTIME_STATES, RUNTIME_ACTIONS} from './runtime-state.js';

const DEFAULT_RENDER = function () {};

class GameRuntime {
    constructor({
        config,
        environment,
        inputBuffer,
        renderCallback = DEFAULT_RENDER,
        stepMs,
        maxFrameDeltaMs,
        requestFrame,
        cancelFrame,
    }) {
        if (!config) {
            throw new TypeError('GameRuntime requires a config.');
        }
        if (!environment || typeof environment.random !== 'function') {
            throw new TypeError('GameRuntime requires an environment with a random function.');
        }
        if (!inputBuffer || typeof inputBuffer.drain !== 'function') {
            throw new TypeError('GameRuntime requires an input buffer.');
        }

        this.config = config;
        this.environment = environment;
        this.inputBuffer = inputBuffer;
        this.renderCallback = renderCallback;
        this.eventLog = [];
        this.currentAlpha = 0;
        this.lifecycleListeners = [];

        this.simulation = createSimulation(config, environment);
        this.currentSnapshot = this.simulation.snapshot();

        this.machine = new RuntimeStateMachine();

        const loopOptions = {
            update: (stepMsValue) => this.handleUpdate(stepMsValue),
            render: (alpha) => this.handleRender(alpha),
        };
        if (stepMs !== undefined) {
            loopOptions.stepMs = stepMs;
        }
        if (maxFrameDeltaMs !== undefined) {
            loopOptions.maxFrameDeltaMs = maxFrameDeltaMs;
        }
        if (requestFrame !== undefined) {
            loopOptions.requestFrame = requestFrame;
        }
        if (cancelFrame !== undefined) {
            loopOptions.cancelFrame = cancelFrame;
        }

        this.loop = new FixedTimestepLoop(loopOptions);
    }

    dispatch(action) {
        if (action === RUNTIME_ACTIONS.START
            && this.machine.getState() === RUNTIME_STATES.FINISHED) {
            this.reset();
        }

        const result = this.machine.dispatch(action);
        if (!result.ok) {
            return result;
        }

        this.executeAction(action);
        this.notifyLifecycleListeners(result);

        return result;
    }

    executeAction(action) {
        switch (action) {
        case RUNTIME_ACTIONS.START:
            this.loop.start();
            break;
        case RUNTIME_ACTIONS.PAUSE:
            this.loop.pause();
            break;
        case RUNTIME_ACTIONS.RESUME:
            this.loop.start();
            break;
        case RUNTIME_ACTIONS.FINISH:
            this.loop.stop();
            break;
        case RUNTIME_ACTIONS.RESET:
            this.reset();
            break;
        }
    }

    onLifecycleChange(listener) {
        this.lifecycleListeners.push(listener);
    }

    notifyLifecycleListeners(transitionResult) {
        for (const listener of this.lifecycleListeners) {
            listener(transitionResult);
        }
    }

    getLifecycleState() {
        return this.machine.getState();
    }

    start() {
        if (this.loop.isRunning()) {
            return;
        }
        if (this.simulation.getState().finished) {
            return;
        }
        this.loop.start();
    }

    pause() {
        this.loop.pause();
    }

    stop() {
        this.loop.stop();
    }

    reset() {
        this.loop.stop();
        this.inputBuffer.clear();
        this.simulation.reset(this.config, this.environment);
        this.machine.reset();
        this.eventLog = [];
        this.currentAlpha = 0;
        this.currentSnapshot = this.simulation.snapshot();
    }

    isRunning() {
        return this.loop.isRunning();
    }

    getSnapshot() {
        return this.currentSnapshot;
    }

    getState() {
        return this.simulation.getState();
    }

    getEventLog() {
        return this.eventLog.slice();
    }

    handleUpdate() {
        const commands = this.inputBuffer.drain();
        const result = this.simulation.step(commands);
        this.eventLog.push(...result.events);
    }

    handleRender(alpha) {
        this.currentAlpha = alpha;
        this.currentSnapshot = this.simulation.snapshot();
        this.renderCallback(this.currentSnapshot, alpha);
    }
}

export {
    GameRuntime,
};
