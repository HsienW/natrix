import {RUNTIME_STATES, RUNTIME_ACTIONS, TRANSITION_TABLE} from './runtime-state.js';

class RuntimeStateMachine {
    constructor() {
        this.currentState = RUNTIME_STATES.IDLE;
    }

    dispatch(action) {
        const transitions = TRANSITION_TABLE[this.currentState];
        const nextState = transitions && transitions[action];

        if (!nextState) {
            return {
                ok: false,
                code: 'INVALID_RUNTIME_TRANSITION',
                action: action,
                from: this.currentState,
                to: this.currentState,
            };
        }

        const previousState = this.currentState;
        this.currentState = nextState;

        return {
            ok: true,
            action: action,
            from: previousState,
            to: nextState,
        };
    }

    getState() {
        return this.currentState;
    }

    getAvailableActions() {
        const transitions = TRANSITION_TABLE[this.currentState];
        return transitions ? Object.keys(transitions) : [];
    }

    reset() {
        this.currentState = RUNTIME_STATES.IDLE;
    }
}

export {
    RuntimeStateMachine,
};
