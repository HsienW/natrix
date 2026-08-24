const DEFAULT_SAMPLE_LIMIT = 300;
const DEFAULT_DELAYED_FRAME_MS = 50;

const createTimingSummary = function (samples) {
    if (samples.length === 0) {
        return {
            p50: 0,
            p95: 0,
        };
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
        p50: valueAtPercentile(0.5),
        p95: valueAtPercentile(0.95),
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
        this.simulationStepTimes = [];
        this.renderTimes = [];
        this.frameCount = 0;
        this.delayedFrames = 0;
        this.entityCount = 0;
        this.previousFrameTimestamp = null;
    }

    beginFrameSeries() {
        this.previousFrameTimestamp = null;
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
            this.addSample(this.frameTimes, frameTime);

            if (frameTime > this.delayedFrameMs) {
                this.delayedFrames += 1;
            }
        }

        this.previousFrameTimestamp = timestamp;
    }

    recordSimulationStep(durationMs) {
        this.addSample(this.simulationStepTimes, durationMs);
    }

    recordRender(durationMs) {
        this.addSample(this.renderTimes, durationMs);
    }

    recordEntityCount(entityCount) {
        if (Number.isInteger(entityCount) && entityCount >= 0) {
            this.entityCount = entityCount;
        }
    }

    calculateFps() {
        if (this.frameTimes.length === 0) {
            return 0;
        }

        const measuredTime = this.frameTimes.reduce(function (total, frameTime) {
            return total + frameTime;
        }, 0);

        if (measuredTime <= 0) {
            return 0;
        }

        return this.frameTimes.length * 1000 / measuredTime;
    }

    getSnapshot() {
        return {
            frameCount: this.frameCount,
            fps: this.calculateFps(),
            frameTimeMs: createTimingSummary(this.frameTimes),
            simulationStepTimeMs: createTimingSummary(this.simulationStepTimes),
            renderTimeMs: createTimingSummary(this.renderTimes),
            delayedFrames: this.delayedFrames,
            entityCount: this.entityCount,
        };
    }
}

export {
    DEFAULT_DELAYED_FRAME_MS,
    DEFAULT_SAMPLE_LIMIT,
    RuntimeMetrics,
    createTimingSummary,
};
