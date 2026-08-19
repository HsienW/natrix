const {RuntimeStateMachine} = require('../../src/js/runtime/runtime-state-machine.js');
const {RUNTIME_STATES, RUNTIME_ACTIONS} = require('../../src/js/runtime/runtime-state.js');

describe('RuntimeStateMachine', () => {
    test('starts in IDLE state', () => {
        const machine = new RuntimeStateMachine();
        expect(machine.getState()).toBe(RUNTIME_STATES.IDLE);
    });

    test('START from IDLE transitions to RUNNING', () => {
        const machine = new RuntimeStateMachine();
        const result = machine.dispatch(RUNTIME_ACTIONS.START);

        expect(result.ok).toBe(true);
        expect(result.from).toBe(RUNTIME_STATES.IDLE);
        expect(result.to).toBe(RUNTIME_STATES.RUNNING);
        expect(result.action).toBe(RUNTIME_ACTIONS.START);
        expect(machine.getState()).toBe(RUNTIME_STATES.RUNNING);
    });

    test('PAUSE from RUNNING transitions to PAUSED', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        const result = machine.dispatch(RUNTIME_ACTIONS.PAUSE);

        expect(result.ok).toBe(true);
        expect(result.from).toBe(RUNTIME_STATES.RUNNING);
        expect(result.to).toBe(RUNTIME_STATES.PAUSED);
    });

    test('RESUME from PAUSED transitions to RUNNING', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        machine.dispatch(RUNTIME_ACTIONS.PAUSE);
        const result = machine.dispatch(RUNTIME_ACTIONS.RESUME);

        expect(result.ok).toBe(true);
        expect(result.from).toBe(RUNTIME_STATES.PAUSED);
        expect(result.to).toBe(RUNTIME_STATES.RUNNING);
    });

    test('FINISH from RUNNING transitions to FINISHED', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        const result = machine.dispatch(RUNTIME_ACTIONS.FINISH);

        expect(result.ok).toBe(true);
        expect(result.from).toBe(RUNTIME_STATES.RUNNING);
        expect(result.to).toBe(RUNTIME_STATES.FINISHED);
    });

    test('FINISH from PAUSED transitions to FINISHED', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        machine.dispatch(RUNTIME_ACTIONS.PAUSE);
        const result = machine.dispatch(RUNTIME_ACTIONS.FINISH);

        expect(result.ok).toBe(true);
        expect(result.from).toBe(RUNTIME_STATES.PAUSED);
        expect(result.to).toBe(RUNTIME_STATES.FINISHED);
    });

    test('RESET from FINISHED transitions to IDLE', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        machine.dispatch(RUNTIME_ACTIONS.FINISH);
        const result = machine.dispatch(RUNTIME_ACTIONS.RESET);

        expect(result.ok).toBe(true);
        expect(result.from).toBe(RUNTIME_STATES.FINISHED);
        expect(result.to).toBe(RUNTIME_STATES.IDLE);
    });

    test('invalid transition returns INVALID_RUNTIME_TRANSITION with no side effect', () => {
        const machine = new RuntimeStateMachine();
        const result = machine.dispatch(RUNTIME_ACTIONS.PAUSE);

        expect(result.ok).toBe(false);
        expect(result.code).toBe('INVALID_RUNTIME_TRANSITION');
        expect(result.action).toBe(RUNTIME_ACTIONS.PAUSE);
        expect(result.from).toBe(RUNTIME_STATES.IDLE);
        expect(result.to).toBe(RUNTIME_STATES.IDLE);
        expect(machine.getState()).toBe(RUNTIME_STATES.IDLE);
    });

    test('duplicate START while RUNNING returns invalid and performs no side effect', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        const result = machine.dispatch(RUNTIME_ACTIONS.START);

        expect(result.ok).toBe(false);
        expect(result.code).toBe('INVALID_RUNTIME_TRANSITION');
        expect(machine.getState()).toBe(RUNTIME_STATES.RUNNING);
    });

    test('repeated PAUSE calls are safe', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        machine.dispatch(RUNTIME_ACTIONS.PAUSE);
        const result = machine.dispatch(RUNTIME_ACTIONS.PAUSE);

        expect(result.ok).toBe(false);
        expect(machine.getState()).toBe(RUNTIME_STATES.PAUSED);
    });

    test('repeated RESUME calls are safe', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        const result = machine.dispatch(RUNTIME_ACTIONS.RESUME);

        expect(result.ok).toBe(false);
        expect(machine.getState()).toBe(RUNTIME_STATES.RUNNING);
    });

    test('repeated FINISH calls are safe', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        machine.dispatch(RUNTIME_ACTIONS.FINISH);
        const result = machine.dispatch(RUNTIME_ACTIONS.FINISH);

        expect(result.ok).toBe(false);
        expect(machine.getState()).toBe(RUNTIME_STATES.FINISHED);
    });

    test('RESET from non-FINISHED state is invalid', () => {
        const machine = new RuntimeStateMachine();
        const result = machine.dispatch(RUNTIME_ACTIONS.RESET);

        expect(result.ok).toBe(false);
        expect(result.code).toBe('INVALID_RUNTIME_TRANSITION');
    });

    test('START from FINISHED is invalid without explicit RESET', () => {
        const machine = new RuntimeStateMachine();
        machine.dispatch(RUNTIME_ACTIONS.START);
        machine.dispatch(RUNTIME_ACTIONS.FINISH);
        const result = machine.dispatch(RUNTIME_ACTIONS.START);

        expect(result.ok).toBe(false);
        expect(result.code).toBe('INVALID_RUNTIME_TRANSITION');
        expect(machine.getState()).toBe(RUNTIME_STATES.FINISHED);
    });

    test('getAvailableActions returns correct actions per state', () => {
        const machine = new RuntimeStateMachine();

        expect(machine.getAvailableActions()).toEqual(['START']);

        machine.dispatch('START');
        expect(machine.getAvailableActions()).toEqual(['PAUSE', 'FINISH']);

        machine.dispatch('PAUSE');
        expect(machine.getAvailableActions()).toEqual(['RESUME', 'FINISH']);

        machine.dispatch('FINISH');
        expect(machine.getAvailableActions()).toEqual(['RESET']);
    });

    test('full lifecycle cycle: IDLE → RUNNING → PAUSED → RUNNING → FINISHED → IDLE', () => {
        const machine = new RuntimeStateMachine();

        expect(machine.getState()).toBe('IDLE');

        machine.dispatch('START');
        expect(machine.getState()).toBe('RUNNING');

        machine.dispatch('PAUSE');
        expect(machine.getState()).toBe('PAUSED');

        machine.dispatch('RESUME');
        expect(machine.getState()).toBe('RUNNING');

        machine.dispatch('FINISH');
        expect(machine.getState()).toBe('FINISHED');

        machine.dispatch('RESET');
        expect(machine.getState()).toBe('IDLE');
    });
});
