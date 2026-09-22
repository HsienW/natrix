const {
    RuntimeMetrics,
    createTimingSummary,
} = require('../../src/js/telemetry/runtime-metrics.js');

describe('RuntimeMetrics', () => {
    test('calculates nearest-rank p50 and p95 summaries', () => {
        expect(createTimingSummary([100, 2, 4, 1, 3])).toEqual({
            p50: 3,
            p95: 100,
        });
        expect(createTimingSummary([])).toEqual({p50: 0, p95: 0});
    });

    test('reports rolling frame timing, FPS, and delayed frames', () => {
        const metrics = new RuntimeMetrics({sampleLimit: 3, delayedFrameMs: 25});

        metrics.recordFrame(0);
        metrics.recordFrame(10);
        metrics.recordFrame(30);
        metrics.recordFrame(60);
        metrics.recordFrame(100);

        const snapshot = metrics.getSnapshot();

        expect(snapshot.frameCount).toBe(5);
        expect(snapshot.fps).toBeCloseTo(33.33, 2);
        expect(snapshot.frameTimeMs).toEqual({p50: 30, p95: 40});
        expect(snapshot.delayedFrames).toBe(2);
    });

    test('keeps simulation, render, and entity metrics separate', () => {
        const metrics = new RuntimeMetrics();

        metrics.recordSimulationStep(2, 100);
        metrics.recordSimulationStep(6, 200);
        metrics.recordRender(4);
        metrics.recordRender(12);
        metrics.recordInputDelay(8);
        metrics.recordInputDelay(16);
        metrics.recordEntityCount(7);

        expect(metrics.getSnapshot()).toEqual(expect.objectContaining({
            simulationTickRate: 10,
            simulationStepTimeMs: {p50: 2, p95: 6},
            renderTimeMs: {p50: 4, p95: 12},
            inputToStepTimeMs: {p50: 8, p95: 16},
            entityCount: 7,
        }));
    });

    test('starts a new frame series without counting a paused interval', () => {
        const metrics = new RuntimeMetrics({delayedFrameMs: 50});

        metrics.recordFrame(100);
        metrics.recordFrame(120);
        metrics.recordSimulationStep(2, 100);
        metrics.recordSimulationStep(2, 200);
        metrics.beginMeasurementSeries();
        metrics.recordFrame(1000);
        metrics.recordFrame(1020);
        metrics.recordSimulationStep(2, 1000);
        metrics.recordSimulationStep(2, 1100);

        expect(metrics.getSnapshot().frameTimeMs).toEqual({p50: 20, p95: 20});
        expect(metrics.getSnapshot().delayedFrames).toBe(0);
        expect(metrics.getSnapshot().simulationTickRate).toBe(10);
    });

    test('reset clears collected values', () => {
        const metrics = new RuntimeMetrics();

        metrics.recordFrame(0);
        metrics.recordFrame(20);
        metrics.recordSimulationStep(3);
        metrics.recordRender(5);
        metrics.recordEntityCount(4);
        metrics.reset();

        expect(metrics.getSnapshot()).toEqual({
            frameCount: 0,
            fps: 0,
            simulationTickRate: 0,
            frameTimeMs: {p50: 0, p95: 0},
            simulationStepTimeMs: {p50: 0, p95: 0},
            renderTimeMs: {p50: 0, p95: 0},
            inputToStepTimeMs: {p50: 0, p95: 0},
            delayedFrames: 0,
            entityCount: 0,
        });
    });

    test('ignores invalid and backwards timing samples', () => {
        const metrics = new RuntimeMetrics();

        metrics.recordSimulationStep(2, 100);
        metrics.recordSimulationStep(2, 90);
        metrics.recordInputDelay(-1);
        metrics.recordInputDelay(Number.NaN);

        expect(metrics.getSnapshot()).toEqual(expect.objectContaining({
            simulationTickRate: 0,
            inputToStepTimeMs: {p50: 0, p95: 0},
        }));
    });

    test('validates collection settings', () => {
        expect(() => new RuntimeMetrics({sampleLimit: 0})).toThrow(RangeError);
        expect(() => new RuntimeMetrics({delayedFrameMs: 0})).toThrow(RangeError);
    });
});
