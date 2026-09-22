const {
    PerformancePanel,
    formatTiming,
} = require('../../src/js/telemetry/performance-panel.js');

const createMarkup = function () {
    document.body.innerHTML = `
        <aside id="performance-panel">
            <span data-metric="runtime-mode"></span>
            <span data-metric="renderer-mode"></span>
            <span data-metric="fps"></span>
            <span data-metric="simulation-tick-rate"></span>
            <span data-metric="frame-time"></span>
            <span data-metric="simulation-time"></span>
            <span data-metric="render-time"></span>
            <span data-metric="input-to-step-time"></span>
            <span data-metric="delayed-frames"></span>
            <span data-metric="entity-count"></span>
        </aside>
    `;
};

describe('PerformancePanel', () => {
    test('formats timing values as p50 and p95 milliseconds', () => {
        expect(formatTiming({p50: 1.234, p95: 5.678})).toBe('1.23 / 5.68 ms');
    });

    test('renders a metrics snapshot into the panel', () => {
        createMarkup();
        const panel = new PerformancePanel('performance-panel', {updateIntervalMs: 0});
        panel.init();

        panel.render({
            fps: 59.94,
            simulationTickRate: 10,
            frameTimeMs: {p50: 16.1, p95: 18.4},
            simulationStepTimeMs: {p50: 0.4, p95: 0.8},
            renderTimeMs: {p50: 1.2, p95: 2.4},
            inputToStepTimeMs: {p50: 12, p95: 18},
            delayedFrames: 2,
            entityCount: 5,
        }, {
            runtimeMode: 'Main Thread',
            rendererMode: 'canvas',
        });

        expect(document.querySelector('[data-metric="runtime-mode"]').textContent)
            .toBe('Main Thread');
        expect(document.querySelector('[data-metric="renderer-mode"]').textContent)
            .toBe('CANVAS');
        expect(document.querySelector('[data-metric="fps"]').textContent).toBe('59.9');
        expect(document.querySelector('[data-metric="simulation-tick-rate"]').textContent)
            .toBe('10.0');
        expect(document.querySelector('[data-metric="render-time"]').textContent)
            .toBe('1.20 / 2.40 ms');
        expect(document.querySelector('[data-metric="input-to-step-time"]').textContent)
            .toBe('12.00 / 18.00 ms');
        expect(document.querySelector('[data-metric="entity-count"]').textContent).toBe('5');
    });

    test('disables itself when the markup is incomplete', () => {
        document.body.innerHTML = '<aside id="performance-panel"></aside>';
        const panel = new PerformancePanel();

        expect(panel.init()).toBe(false);
        expect(panel.render({})).toBe(false);
    });

    test('limits DOM updates without rejecting a reset clock', () => {
        createMarkup();
        const times = [100, 200, 50];
        const panel = new PerformancePanel('performance-panel', {
            updateIntervalMs: 250,
            now: () => times.shift(),
        });
        const metrics = {
            fps: 60,
            simulationTickRate: 10,
            delayedFrames: 0,
            entityCount: 3,
        };

        panel.init();

        expect(panel.render(metrics)).toBe(true);
        expect(panel.render(metrics)).toBe(false);
        expect(panel.render(metrics)).toBe(true);
    });
});
