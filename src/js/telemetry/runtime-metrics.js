const DEFAULT_SAMPLE_LIMIT = 300;
const DEFAULT_DELAYED_FRAME_MS = 50;
const MILLISECONDS_PER_SECOND = 1000;
const MEDIAN_PERCENTILE = 0.5;
const SLOW_PERCENTILE = 0.95;

const EMPTY_TIMING_SUMMARY = Object.freeze({
    p50: 0,
    p95: 0,
});

const createTimingSummary = function (samples) {
    if (!Array.isArray(samples) || samples.length === 0) {
        return {...EMPTY_TIMING_SUMMARY};
    }

    const sortedSamples = samples.slice().sort(function (first, second) {
        return first - second;
    });

    const valueAtPercentile = function (percentile) {
        const position = Math.ceil(sortedSamples.length * percentile);
        const index = Math.max(0, position - 1);
        return sortedSamples[index];
    };

    return {
        p50: valueAtPercentile(MEDIAN_PERCENTILE),
        p95: valueAtPercentile(SLOW_PERCENTILE),
    };
};

class RuntimeMetrics {
    constructor({
        sampleLimit = DEFAULT_SAMPLE_LIMIT,
        delayedFrameMs = DEFAULT_DELAYED_FRAME_MS,
    } = {}) {
        if (!Number.isInteger(sampleLimit) || sampleLimit <= 0) {
            throw new RangeError('RuntimeMetrics sampleLimit must be a positive integer.');
        }
        if (!Number.isFinite(delayedFrameMs) || delayedFrameMs <= 0) {
            throw new RangeError('RuntimeMetrics delayedFrameMs must be a positive number.');
        }

        this.sampleLimit = sampleLimit;
        this.delayedFrameMs = delayedFrameMs;
        this.reset();
    }

    reset() {
        this.frameTimes = [];
        this.simulationTickTimes = [];
        this.simulationStepTimes = [];
        this.renderTimes = [];
        this.inputToStepTimes = [];
        this.frameCount = 0;
        this.delayedFrames = 0;
        this.entityCount = 0;
        this.previousFrameTimestamp = null;
        this.previousSimulationTimestamp = null;
    }

    beginMeasurementSeries() {
        this.previousFrameTimestamp = null;
        this.previousSimulationTimestamp = null;
    }

    beginFrameSeries() {
        this.beginMeasurementSeries();
    }

    addSample(samples, durationMs) {
        if (!Number.isFinite(durationMs) || durationMs < 0) {
            return;
        }

        samples.push(durationMs);
        if (samples.length > this.sampleLimit) {
            samples.shift();
        }
    }

    recordFrame(timestamp) {
        this.frameCount += 1;

        if (!Number.isFinite(timestamp)) {
            return;
        }

        if (this.previousFrameTimestamp !== null) {
            const frameTime = timestamp - this.previousFrameTimestamp;
            if (frameTime < 0) {
                return;
            }

            this.addSample(this.frameTimes, frameTime);

            if (frameTime > this.delayedFrameMs) {
                this.delayedFrames += 1;
            }
        }

        this.previousFrameTimestamp = timestamp;
    }

    recordSimulationStep(durationMs, timestamp = null) {
        this.addSample(this.simulationStepTimes, durationMs);

        if (!Number.isFinite(timestamp)) {
            return;
        }

        if (this.previousSimulationTimestamp !== null) {
            const tickTime = timestamp - this.previousSimulationTimestamp;
            if (tickTime < 0) {
                return;
            }

            this.addSample(this.simulationTickTimes, tickTime);
        }

        this.previousSimulationTimestamp = timestamp;
    }

    recordRender(durationMs) {
        this.addSample(this.renderTimes, durationMs);
    }

    recordInputDelay(durationMs) {
        this.addSample(this.inputToStepTimes, durationMs);
    }

    recordEntityCount(entityCount) {
        if (Number.isInteger(entityCount) && entityCount >= 0) {
            this.entityCount = entityCount;
        }
    }

    calculateRate(intervals) {
        if (!Array.isArray(intervals) || intervals.length === 0) {
            return 0;
        }

        const measuredTime = intervals.reduce(function (total, interval) {
            return total + interval;
        }, 0);

        if (measuredTime <= 0) {
            return 0;
        }

        return intervals.length * MILLISECONDS_PER_SECOND / measuredTime;
    }

    calculateFps() {
        return this.calculateRate(this.frameTimes);
    }

    calculateSimulationTickRate() {
        return this.calculateRate(this.simulationTickTimes);
    }

    getSnapshot() {
        return {
            frameCount: this.frameCount,
            fps: this.calculateFps(),
            simulationTickRate: this.calculateSimulationTickRate(),
            frameTimeMs: createTimingSummary(this.frameTimes),
            simulationStepTimeMs: createTimingSummary(this.simulationStepTimes),
            renderTimeMs: createTimingSummary(this.renderTimes),
            inputToStepTimeMs: createTimingSummary(this.inputToStepTimes),
            delayedFrames: this.delayedFrames,
            entityCount: this.entityCount,
        };
    }
}

export {
    DEFAULT_DELAYED_FRAME_MS,
    DEFAULT_SAMPLE_LIMIT,
    MILLISECONDS_PER_SECOND,
    RuntimeMetrics,
    createTimingSummary,
};
