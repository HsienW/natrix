const {MeasuredSimulation} = require('../../src/js/telemetry/measured-simulation.js');

const createSimulation = function () {
    return {
        step: jest.fn(() => ({state: {tick: 1}, events: []})),
        snapshot: jest.fn(() => ({tick: 1})),
        getState: jest.fn(() => ({tick: 1})),
        reset: jest.fn(),
    };
};

describe('MeasuredSimulation', () => {
    test('measures step duration and returns the simulation result', () => {
        const simulation = createSimulation();
        const metrics = {recordSimulationStep: jest.fn()};
        const times = [10, 14];
        const measuredSimulation = new MeasuredSimulation(
            simulation,
            metrics,
            () => times.shift(),
        );
        const commands = [{type: 'TURN'}];

        const result = measuredSimulation.step(commands);

        expect(result).toEqual({state: {tick: 1}, events: []});
        expect(simulation.step).toHaveBeenCalledWith(commands);
        expect(metrics.recordSimulationStep).toHaveBeenCalledWith(4);
    });

    test('delegates non-measured simulation methods', () => {
        const simulation = createSimulation();
        const measuredSimulation = new MeasuredSimulation(
            simulation,
            {recordSimulationStep: jest.fn()},
        );

        expect(measuredSimulation.snapshot()).toEqual({tick: 1});
        expect(measuredSimulation.getState()).toEqual({tick: 1});
        measuredSimulation.reset({seed: 7});

        expect(simulation.reset).toHaveBeenCalledWith({seed: 7});
    });
});
