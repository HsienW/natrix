import {
    calculateElapsedTime,
    getCurrentTime,
    readClock,
} from './clock.js';

const SIMULATION_METHODS = [
    'step',
    'snapshot',
    'getState',
    'reset',
];

class MeasuredSimulation {
    constructor(simulation, metrics, now = getCurrentTime) {
        for (const methodName of SIMULATION_METHODS) {
            if (!simulation || typeof simulation[methodName] !== 'function') {
                throw new TypeError('MeasuredSimulation requires simulation.' + methodName + '().');
            }
        }
        if (!metrics || typeof metrics.recordSimulationStep !== 'function') {
            throw new TypeError('MeasuredSimulation requires runtime metrics.');
        }
        if (typeof now !== 'function') {
            throw new TypeError('MeasuredSimulation now must be a function.');
        }

        this.simulation = simulation;
        this.metrics = metrics;
        this.now = now;
    }

    step(commands) {
        const startedAt = readClock(this.now);

        try {
            return this.simulation.step(commands);
        } finally {
            const finishedAt = readClock(this.now);
            const durationMs = calculateElapsedTime(startedAt, finishedAt);

            if (durationMs !== null) {
                try {
                    this.metrics.recordSimulationStep(durationMs, finishedAt);
                } catch (error) {
                    // Telemetry must not replace a simulation error or stop the game loop.
                }
            }
        }
    }

    snapshot() {
        return this.simulation.snapshot();
    }

    getState() {
        return this.simulation.getState();
    }

    reset(config) {
        return this.simulation.reset(config);
    }
}

export {
    MeasuredSimulation,
};
