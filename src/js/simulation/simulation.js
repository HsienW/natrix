import {createInitialGameState} from './create-initial-state.js';
import {stepGame} from './step-game.js';
import {createSnapshot} from '../state/snapshot.js';

const createSimulation = function (config) {
    let currentState = createInitialGameState(config);

    return {
        step(commands) {
            const result = stepGame(currentState, commands);
            currentState = result.state;
            return result;
        },
        snapshot() {
            return createSnapshot(currentState);
        },
        getState() {
            return currentState;
        },
        reset(newConfig) {
            currentState = createInitialGameState(newConfig || config);
        },
    };
};

export {
    createSimulation,
};
