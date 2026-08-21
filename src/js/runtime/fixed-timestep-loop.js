const DEFAULT_STEP_MS = 100;
const DEFAULT_MAX_FRAME_DELTA_MS = 250;

const requestBrowserFrame = function (callback) {
    return requestAnimationFrame(callback);
};

const cancelBrowserFrame = function (frameId) {
    cancelAnimationFrame(frameId);
};

class FixedTimestepLoop {
    constructor({
        update,
        render,
        stepMs = DEFAULT_STEP_MS,
        maxFrameDeltaMs = DEFAULT_MAX_FRAME_DELTA_MS,
        requestFrame = requestBrowserFrame,
        cancelFrame = cancelBrowserFrame,
    }) {
        if (typeof update !== 'function' || typeof render !== 'function') {
            throw new TypeError('FixedTimestepLoop requires update and render callbacks.');
        }
        if (!Number.isFinite(stepMs) || stepMs <= 0) {
            throw new RangeError('stepMs must be a positive finite number.');
        }
        if (!Number.isFinite(maxFrameDeltaMs) || maxFrameDeltaMs < stepMs) {
            throw new RangeError('maxFrameDeltaMs must be finite and at least stepMs.');
        }

        this.update = update;
        this.render = render;
        this.stepMs = stepMs;
        this.maxFrameDeltaMs = maxFrameDeltaMs;
        this.requestFrame = requestFrame;
        this.cancelFrame = cancelFrame;
        this.accumulatorMs = 0;
        this.lastTimestamp = null;
        this.frameId = null;
        this.running = false;
        this.runFrame = this.runFrame.bind(this);
    }

    start() {
        if (this.running) {
            return;
        }

        this.running = true;
        this.lastTimestamp = null;
        this.scheduleNextFrame();
    }

    pause() {
        if (!this.running) {
            return;
        }

        this.running = false;
        this.lastTimestamp = null;
        this.cancelScheduledFrame();
    }

    stop() {
        this.running = false;
        this.lastTimestamp = null;
        this.accumulatorMs = 0;
        this.cancelScheduledFrame();
    }

    reset() {
        this.stop();
    }

    isRunning() {
        return this.running;
    }

    runFrame(timestamp) {
        this.frameId = null;

        if (!this.running) {
            return;
        }

        const currentTimestamp = Number.isFinite(timestamp) ? timestamp : 0;

        if (this.lastTimestamp === null) {
            this.lastTimestamp = currentTimestamp;
        } else {
            const elapsedMs = Math.max(0, currentTimestamp - this.lastTimestamp);
            this.lastTimestamp = currentTimestamp;
            this.accumulatorMs += Math.min(elapsedMs, this.maxFrameDeltaMs);
        }

        while (this.running && this.accumulatorMs >= this.stepMs) {
            this.accumulatorMs -= this.stepMs;
            this.update(this.stepMs);
        }

        this.render(this.accumulatorMs / this.stepMs, currentTimestamp);

        if (this.running) {
            this.scheduleNextFrame();
        }
    }

    scheduleNextFrame() {
        this.frameId = this.requestFrame(this.runFrame);
    }

    cancelScheduledFrame() {
        if (this.frameId === null) {
            return;
        }

        this.cancelFrame(this.frameId);
        this.frameId = null;
    }
}

export {
    DEFAULT_MAX_FRAME_DELTA_MS,
    DEFAULT_STEP_MS,
    FixedTimestepLoop,
};
