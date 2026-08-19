import {applyCommands} from './apply-commands.js';
import {resolveScoring} from './scoring.js';
import {moveAllSnakes} from './movement.js';
import {checkDeaths} from './collision.js';
import {checkSurvivingTeam, checkTimeExpiry} from './finish-rules.js';

const stepGame = function (previousState, commands, environment) {
    if (previousState.finished) {
        return {state: previousState, events: []};
    }

    const events = [];
    let state = previousState;

    state = applyCommands(state, commands);

    const scoringResult = resolveScoring(state, environment);
    state = {
        ...state,
        snakes: scoringResult.snakes,
        food: scoringResult.food,
        scores: scoringResult.scores,
    };
    events.push(...scoringResult.events);

    state = {...state, snakes: moveAllSnakes(state.snakes)};

    const deathResult = checkDeaths(state.snakes, state.config.mapSize);
    state = {...state, snakes: deathResult.snakes};
    events.push(...deathResult.events);

    const survival = checkSurvivingTeam(state.snakes);
    if (survival) {
        state = {
            ...state,
            finished: true,
            winner: survival.winner,
            finishReason: survival.reason,
        };
        events.push({type: 'MATCH_FINISHED', winner: survival.winner, reason: survival.reason});
    }

    state = {...state, remainingTicks: state.remainingTicks - 1};

    if (!state.finished) {
        const timeResult = checkTimeExpiry(state);
        if (timeResult) {
            state = {
                ...state,
                finished: true,
                winner: timeResult.winner,
                finishReason: timeResult.reason,
            };
            events.push({
                type: 'MATCH_FINISHED',
                winner: timeResult.winner,
                reason: timeResult.reason,
            });
        }
    }

    state = {...state, tick: state.tick + 1};

    return {state, events};
};

export {
    stepGame,
};
