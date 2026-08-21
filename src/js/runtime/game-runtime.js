import {FixedTimestepLoop} from './fixed-timestep-loop.js';
import {createSimulation} from '../simulation/simulation.js';
import {RuntimeStateMachine} from './runtime-state-machine.js';
import {RUNTIME_STATES, RUNTIME_ACTIONS} from './runtime-state.js';
import {CommandRecorder} from '../replay/command-recorder.js';
import {createReplayPayload} from '../replay/replay-schema.js';
import {RendererHost} from '../render/renderer-host.js';
import {NullRenderer} from '../render/null-renderer.js';
import {createRenderSnapshot} from '../render/render-model.js';

const DEFAULT_EVENT_HANDLER = function () {};

class GameRuntime {
    constructor({
        config,
        inputBuffer,
        commandRecorder = new CommandRecorder(),
        renderer = new NullRenderer(),
        eventCallback = DEFAULT_EVENT_HANDLER,
        stepMs,
        maxFrameDeltaMs,
        requestFrame,
        cancelFrame,
    }) {
        if (!config) {
            throw new TypeError('GameRuntime requires a config.');
        }
        if (!inputBuffer || typeof inputBuffer.drain !== 'function') {
            throw new TypeError('GameRuntime requires an input buffer.');
        }
        if (!commandRecorder
            || typeof commandRecorder.record !== 'function'
            || typeof commandRecorder.entries !== 'function'
            || typeof commandRecorder.clear !== 'function') {
            throw new TypeError('GameRuntime requires a command recorder.');
        }
        if (typeof eventCallback !== 'function') {
            throw new TypeError('GameRuntime event callback must be a function.');
        }

        this.config = config;
        this.inputBuffer = inputBuffer;
        this.commandRecorder = commandRecorder;
        this.eventCallback = eventCallback;
        this.eventLog = [];
        this.currentAlpha = 0;
        this.lifecycleListeners = [];

        this.simulation = createSimulation(config);
        this.currentSnapshot = createRenderSnapshot(this.simulation.getState());

        this.rendererHost = new RendererHost(renderer);
        this.rendererHost.init(this.simulation.getState().config);

        this.machine = new RuntimeStateMachine();

        const loopOptions = {
            update: (stepMsValue) => this.handleUpdate(stepMsValue),
            render: (alpha, frameTimestamp) => this.handleRender(alpha, frameTimestamp),
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
            const resetResult = this.machine.dispatch(RUNTIME_ACTIONS.RESET);
            this.executeAction(RUNTIME_ACTIONS.RESET);
            this.notifyLifecycleListeners(resetResult);
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
            this.resetRuntime();
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
        if (this.machine.getState() === RUNTIME_STATES.PAUSED) {
            return this.dispatch(RUNTIME_ACTIONS.RESUME);
        }
        return this.dispatch(RUNTIME_ACTIONS.START);
    }

    pause() {
        return this.dispatch(RUNTIME_ACTIONS.PAUSE);
    }

    stop() {
        return this.dispatch(RUNTIME_ACTIONS.FINISH);
    }

    reset() {
        return this.dispatch(RUNTIME_ACTIONS.RESET);
    }

    resetRuntime() {
        this.loop.stop();
        this.inputBuffer.clear();
        this.commandRecorder.clear();
        this.simulation.reset(this.config);
        this.eventLog = [];
        this.currentAlpha = 0;
        this.currentSnapshot = createRenderSnapshot(this.simulation.getState());
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

    getCommandLog() {
        return this.commandRecorder.entries();
    }

    getReplayPayload() {
        const config = this.simulation.getState().config;

        return createReplayPayload({
            seed: config.seed,
            config: config,
            commands: this.commandRecorder.entries(),
        });
    }

    setRenderer(renderer) {
        this.rendererHost.setRenderer(renderer);
    }

    resizeRenderer(viewport) {
        this.rendererHost.resize(viewport);
    }

    destroy() {
        this.loop.stop();
        this.rendererHost.destroy();
    }

    handleUpdate() {
        const commands = this.inputBuffer.drain();
        const tick = this.simulation.getState().tick;
        this.commandRecorder.record(tick, commands);
        const result = this.simulation.step(commands);
        this.eventLog.push(...result.events);

        if (result.state.finished
            && this.machine.getState() === RUNTIME_STATES.RUNNING) {
            this.dispatch(RUNTIME_ACTIONS.FINISH);
        }

        for (const event of result.events) {
            this.eventCallback(event);
        }
    }

    handleRender(alpha, frameTimestamp = null) {
        this.currentAlpha = alpha;
        this.currentSnapshot = createRenderSnapshot(this.simulation.getState());
        this.rendererHost.render(this.currentSnapshot, {
            alpha: alpha,
            frameTimestamp: frameTimestamp,
        });
    }
}

export {
    GameRuntime,
};
