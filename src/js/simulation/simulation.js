import {createInitialGameState} from './create-initial-state.js';
import {stepGame} from './step-game.js';
import {createSnapshot} from '../state/snapshot.js';

const createSimulation = function (config, environment) {
    let currentState = createInitialGameState(config, environment);

    return {
        step(commands) {
            const result = stepGame(currentState, commands, environment);
            currentState = result.state;
            return result;
        },
        snapshot() {
            return createSnapshot(currentState);
        },
        getState() {
            return currentState;
        },
        reset(newConfig, newEnvironment) {
            currentState = createInitialGameState(
                newConfig || config,
                newEnvironment || environment,
            );
        },
    };
};

export {
    createSimulation,
};
