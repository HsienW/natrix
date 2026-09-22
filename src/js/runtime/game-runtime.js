import {FixedTimestepLoop} from './fixed-timestep-loop.js';
import {createSimulation} from '../simulation/simulation.js';
import {RuntimeStateMachine} from './runtime-state-machine.js';
import {RUNTIME_STATES, RUNTIME_ACTIONS} from './runtime-state.js';
import {CommandRecorder} from '../replay/command-recorder.js';
import {createReplayPayload} from '../replay/replay-schema.js';
import {RendererHost} from '../render/renderer-host.js';
import {NullRenderer} from '../render/null-renderer.js';
import {
    createInterpolatedRenderSnapshot,
    createRenderSnapshot,
} from '../render/render-model.js';
import {MetricsRendererDecorator} from '../render/metrics-renderer-decorator.js';
import {
    calculateElapsedTime,
    getCurrentTime,
    readClock,
} from '../telemetry/clock.js';
import {MeasuredSimulation} from '../telemetry/measured-simulation.js';
import {RuntimeMetrics} from '../telemetry/runtime-metrics.js';

const DEFAULT_EVENT_HANDLER = function () {};
const DEFAULT_METRICS_HANDLER = function () {};
const DEFAULT_METRICS_PUBLISH_INTERVAL_MS = 250;

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
        metrics = new RuntimeMetrics(),
        metricsCallback = DEFAULT_METRICS_HANDLER,
        metricsPublishIntervalMs = DEFAULT_METRICS_PUBLISH_INTERVAL_MS,
        now = getCurrentTime,
    }) {
        if (!config) {
            throw new TypeError('GameRuntime requires a config.');
        }
        if (!inputBuffer
            || typeof inputBuffer.drain !== 'function'
            || typeof inputBuffer.clear !== 'function') {
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
        if (!metrics
            || typeof metrics.getSnapshot !== 'function'
            || typeof metrics.recordFrame !== 'function'
            || typeof metrics.reset !== 'function') {
            throw new TypeError('GameRuntime requires runtime metrics.');
        }
        if (typeof metricsCallback !== 'function') {
            throw new TypeError('GameRuntime metrics callback must be a function.');
        }
        if (!Number.isFinite(metricsPublishIntervalMs) || metricsPublishIntervalMs < 0) {
            throw new RangeError('GameRuntime metrics publish interval must not be negative.');
        }
        if (typeof now !== 'function') {
            throw new TypeError('GameRuntime now must be a function.');
        }

        this.config = config;
        this.inputBuffer = inputBuffer;
        this.commandRecorder = commandRecorder;
        this.eventCallback = eventCallback;
        this.metrics = metrics;
        this.metricsCallback = metricsCallback;
        this.metricsPublishIntervalMs = metricsPublishIntervalMs;
        this.lastMetricsPublishTimestamp = null;
        this.now = now;
        this.eventLog = [];
        this.currentAlpha = 0;
        this.lifecycleListeners = [];

        this.simulation = new MeasuredSimulation(createSimulation(config), this.metrics, this.now);
        this.currentSnapshot = createRenderSnapshot(this.simulation.getState());
        this.previousSnapshot = this.currentSnapshot;

        this.rendererHost = new RendererHost(this.createMeasuredRenderer(renderer));
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
            this.beginMetricsSeries();
            this.loop.start();
            break;
        case RUNTIME_ACTIONS.PAUSE:
            this.loop.pause();
            break;
        case RUNTIME_ACTIONS.RESUME:
            this.beginMetricsSeries();
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
        this.runMetricsAction(() => this.metrics.reset());
        this.lastMetricsPublishTimestamp = null;
        this.eventLog = [];
        this.currentAlpha = 0;
        this.currentSnapshot = createRenderSnapshot(this.simulation.getState());
        this.previousSnapshot = this.currentSnapshot;
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

    getMetrics() {
        return this.metrics.getSnapshot();
    }

    runMetricsAction(action) {
        try {
            action();
            return true;
        } catch (error) {
            return false;
        }
    }

    beginMetricsSeries() {
        this.lastMetricsPublishTimestamp = null;
        this.runMetricsAction(() => {
            if (typeof this.metrics.beginMeasurementSeries === 'function') {
                this.metrics.beginMeasurementSeries();
                return;
            }

            if (typeof this.metrics.beginFrameSeries === 'function') {
                this.metrics.beginFrameSeries();
            }
        });
    }

    drainInputEntries() {
        if (typeof this.inputBuffer.drainEntries === 'function') {
            return this.inputBuffer.drainEntries();
        }

        return this.inputBuffer.drain().map(function (command) {
            return {
                command: command,
                receivedAt: null,
            };
        });
    }

    recordInputDelays(inputEntries) {
        if (inputEntries.length === 0
            || typeof this.metrics.recordInputDelay !== 'function') {
            return;
        }

        const stepStartedAt = readClock(this.now);
        if (stepStartedAt === null) {
            return;
        }

        for (const inputEntry of inputEntries) {
            const delayMs = calculateElapsedTime(inputEntry.receivedAt, stepStartedAt);
            if (delayMs === null) {
                continue;
            }

            this.runMetricsAction(() => this.metrics.recordInputDelay(delayMs));
        }
    }

    notifyMetrics(frameTimestamp) {
        if (this.metricsCallback === DEFAULT_METRICS_HANDLER) {
            return false;
        }

        const publishTimestamp = Number.isFinite(frameTimestamp)
            ? frameTimestamp
            : readClock(this.now);
        if (publishTimestamp !== null
            && this.lastMetricsPublishTimestamp !== null
            && publishTimestamp >= this.lastMetricsPublishTimestamp
            && publishTimestamp - this.lastMetricsPublishTimestamp
                < this.metricsPublishIntervalMs) {
            return false;
        }

        this.lastMetricsPublishTimestamp = publishTimestamp;
        this.runMetricsAction(() => {
            this.metricsCallback(this.getMetrics());
        });
        return true;
    }

    createMeasuredRenderer(renderer) {
        return new MetricsRendererDecorator(renderer, this.metrics, this.now);
    }

    setRenderer(renderer) {
        this.rendererHost.setRenderer(this.createMeasuredRenderer(renderer));
    }

    resizeRenderer(viewport) {
        this.rendererHost.resize(viewport);
    }

    destroy() {
        this.loop.stop();
        this.rendererHost.destroy();
    }

    handleUpdate() {
        const inputEntries = this.drainInputEntries();
        const commands = inputEntries.map(function (inputEntry) {
            return inputEntry.command;
        });
        this.recordInputDelays(inputEntries);
        const tick = this.simulation.getState().tick;
        this.commandRecorder.record(tick, commands);

        this.previousSnapshot = this.currentSnapshot;
        const result = this.simulation.step(commands);
        this.currentSnapshot = createRenderSnapshot(result.state);
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
        this.runMetricsAction(() => this.metrics.recordFrame(frameTimestamp));
        const interpolatedSnapshot = createInterpolatedRenderSnapshot(
            this.previousSnapshot,
            this.currentSnapshot,
            alpha,
        );

        this.rendererHost.render(this.currentSnapshot, {
            alpha: alpha,
            frameTimestamp: frameTimestamp,
            previousSnapshot: this.previousSnapshot,
            currentSnapshot: this.currentSnapshot,
            interpolatedSnapshot: interpolatedSnapshot,
        });
        this.notifyMetrics(frameTimestamp);
    }
}

export {
    DEFAULT_METRICS_PUBLISH_INTERVAL_MS,
    GameRuntime,
};
