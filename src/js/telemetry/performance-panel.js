import {getCurrentTime, readClock} from './clock.js';

const DEFAULT_PANEL_UPDATE_INTERVAL_MS = 250;

const METRIC_SELECTORS = {
    runtimeMode: '[data-metric="runtime-mode"]',
    rendererMode: '[data-metric="renderer-mode"]',
    fps: '[data-metric="fps"]',
    simulationTickRate: '[data-metric="simulation-tick-rate"]',
    frameTime: '[data-metric="frame-time"]',
    simulationTime: '[data-metric="simulation-time"]',
    renderTime: '[data-metric="render-time"]',
    inputToStepTime: '[data-metric="input-to-step-time"]',
    delayedFrames: '[data-metric="delayed-frames"]',
    entityCount: '[data-metric="entity-count"]',
};

const formatNumber = function (value, decimalPlaces) {
    const safeValue = Number.isFinite(value) ? value : 0;
    return safeValue.toFixed(decimalPlaces);
};

const formatCount = function (value) {
    if (!Number.isFinite(value) || value < 0) {
        return '0';
    }

    return String(Math.floor(value));
};

const formatTiming = function (timing) {
    const safeTiming = timing && typeof timing === 'object' ? timing : {};
    return formatNumber(safeTiming.p50, 2)
        + ' / '
        + formatNumber(safeTiming.p95, 2)
        + ' ms';
};

class PerformancePanel {
    constructor(elementId = 'performance-panel', {
        updateIntervalMs = DEFAULT_PANEL_UPDATE_INTERVAL_MS,
        now = getCurrentTime,
    } = {}) {
        if (!Number.isFinite(updateIntervalMs) || updateIntervalMs < 0) {
            throw new RangeError('PerformancePanel updateIntervalMs must not be negative.');
        }
        if (typeof now !== 'function') {
            throw new TypeError('PerformancePanel now must be a function.');
        }

        this.elementId = elementId;
        this.updateIntervalMs = updateIntervalMs;
        this.now = now;
        this.elements = null;
        this.lastUpdateTime = null;
    }

    init() {
        this.elements = null;
        this.lastUpdateTime = null;

        if (typeof document === 'undefined') {
            return false;
        }

        const panel = document.getElementById(this.elementId);
        if (!panel) {
            return false;
        }

        const elements = {};
        for (const metricName of Object.keys(METRIC_SELECTORS)) {
            const element = panel.querySelector(METRIC_SELECTORS[metricName]);
            if (!element) {
                return false;
            }
            elements[metricName] = element;
        }

        this.elements = elements;
        return true;
    }

    render(metrics, {runtimeMode = '', rendererMode = ''} = {}) {
        if (!this.elements || !metrics || typeof metrics !== 'object') {
            return false;
        }

        const currentTime = readClock(this.now);
        if (currentTime !== null
            && this.lastUpdateTime !== null
            && currentTime >= this.lastUpdateTime
            && currentTime - this.lastUpdateTime < this.updateIntervalMs) {
            return false;
        }

        this.elements.runtimeMode.textContent = String(runtimeMode);
        this.elements.rendererMode.textContent = String(rendererMode).toUpperCase();
        this.elements.fps.textContent = formatNumber(metrics.fps, 1);
        this.elements.simulationTickRate.textContent = formatNumber(
            metrics.simulationTickRate,
            1,
        );
        this.elements.frameTime.textContent = formatTiming(metrics.frameTimeMs);
        this.elements.simulationTime.textContent = formatTiming(metrics.simulationStepTimeMs);
        this.elements.renderTime.textContent = formatTiming(metrics.renderTimeMs);
        this.elements.inputToStepTime.textContent = formatTiming(metrics.inputToStepTimeMs);
        this.elements.delayedFrames.textContent = formatCount(metrics.delayedFrames);
        this.elements.entityCount.textContent = formatCount(metrics.entityCount);

        this.lastUpdateTime = currentTime;
        return true;
    }

    destroy() {
        this.elements = null;
        this.lastUpdateTime = null;
    }
}

export {
    DEFAULT_PANEL_UPDATE_INTERVAL_MS,
    PerformancePanel,
    formatTiming,
};
