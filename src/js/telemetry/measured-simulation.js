import {getCurrentTime} from './clock.js';

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
        const startedAt = this.now();

        try {
            return this.simulation.step(commands);
        } finally {
            const finishedAt = this.now();
            this.metrics.recordSimulationStep(finishedAt - startedAt);
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
