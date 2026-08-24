const METRIC_SELECTORS = {
    runtimeMode: '[data-metric="runtime-mode"]',
    rendererMode: '[data-metric="renderer-mode"]',
    fps: '[data-metric="fps"]',
    frameTime: '[data-metric="frame-time"]',
    simulationTime: '[data-metric="simulation-time"]',
    renderTime: '[data-metric="render-time"]',
    delayedFrames: '[data-metric="delayed-frames"]',
    entityCount: '[data-metric="entity-count"]',
};

const formatTiming = function (timing) {
    return timing.p50.toFixed(2) + ' / ' + timing.p95.toFixed(2) + ' ms';
};

class PerformancePanel {
    constructor(elementId = 'performance-panel') {
        this.elementId = elementId;
        this.elements = null;
    }

    init() {
        const panel = document.getElementById(this.elementId);
        if (!panel) {
            throw new Error('PerformancePanel could not find #' + this.elementId + '.');
        }

        this.elements = {};
        for (const metricName of Object.keys(METRIC_SELECTORS)) {
            const element = panel.querySelector(METRIC_SELECTORS[metricName]);
            if (!element) {
                throw new Error('PerformancePanel requires the ' + metricName + ' value.');
            }
            this.elements[metricName] = element;
        }
    }

    render(metrics, {runtimeMode, rendererMode}) {
        if (!this.elements) {
            throw new Error('PerformancePanel must be initialized before rendering.');
        }

        this.elements.runtimeMode.textContent = runtimeMode;
        this.elements.rendererMode.textContent = rendererMode.toUpperCase();
        this.elements.fps.textContent = metrics.fps.toFixed(1);
        this.elements.frameTime.textContent = formatTiming(metrics.frameTimeMs);
        this.elements.simulationTime.textContent = formatTiming(metrics.simulationStepTimeMs);
        this.elements.renderTime.textContent = formatTiming(metrics.renderTimeMs);
        this.elements.delayedFrames.textContent = String(metrics.delayedFrames);
        this.elements.entityCount.textContent = String(metrics.entityCount);
    }

    destroy() {
        this.elements = null;
    }
}

export {
    PerformancePanel,
    formatTiming,
};
