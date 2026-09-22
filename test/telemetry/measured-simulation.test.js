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
        expect(metrics.recordSimulationStep).toHaveBeenCalledWith(4, 14);
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

    test('continues simulation when timing is unavailable', () => {
        const simulation = createSimulation();
        const metrics = {recordSimulationStep: jest.fn()};
        const measuredSimulation = new MeasuredSimulation(simulation, metrics, () => {
            throw new Error('clock unavailable');
        });

        expect(measuredSimulation.step([])).toEqual({state: {tick: 1}, events: []});
        expect(metrics.recordSimulationStep).not.toHaveBeenCalled();
    });

    test('preserves the simulation error when metrics also fail', () => {
        const simulation = createSimulation();
        const simulationError = new Error('simulation failed');
        simulation.step.mockImplementation(() => {
            throw simulationError;
        });
        const measuredSimulation = new MeasuredSimulation(simulation, {
            recordSimulationStep: function () {
                throw new Error('metrics failed');
            },
        }, () => 10);

        expect(() => measuredSimulation.step([])).toThrow(simulationError);
    });
});
