/** @jest-environment node */

const {createInitialGameState} = require('../../src/js/simulation/create-initial-state.js');
const {
    canonicalizeValue,
    createCanonicalState,
} = require('../../src/js/state/canonical-state.js');
const {createStateHash} = require('../../src/js/state/state-hash.js');

describe('state hash', () => {
    test('canonicalization ignores object insertion order', () => {
        const firstValue = {
            winner: null,
            score: {red: 2, blue: 1},
            tick: 4,
        };
        const secondValue = {
            tick: 4,
            score: {blue: 1, red: 2},
            winner: null,
        };

        expect(canonicalizeValue(firstValue)).toEqual(canonicalizeValue(secondValue));
        expect(JSON.stringify(canonicalizeValue(firstValue)))
            .toBe(JSON.stringify(canonicalizeValue(secondValue)));
    });

    test('canonicalization preserves array order', () => {
        const firstValue = canonicalizeValue({commands: ['LEFT', 'UP']});
        const secondValue = canonicalizeValue({commands: ['UP', 'LEFT']});

        expect(firstValue).not.toEqual(secondValue);
    });

    test('meaningful state changes produce a different hash', () => {
        const state = createInitialGameState({seed: 7});
        const changedState = {...state, tick: state.tick + 1};

        expect(createStateHash(changedState)).not.toBe(createStateHash(state));
    });

    test('non-authoritative render and UI metadata does not affect the hash', () => {
        const state = createInitialGameState({seed: 7});
        const stateWithMetadata = {
            ...state,
            renderer: 'canvas',
            interpolationAlpha: 0.5,
            frameTimestamp: 1200,
            metrics: {frames: 60},
            uiStatus: 'running',
            snakes: state.snakes.map((snake) => ({...snake, style: 'changed-style'})),
            food: state.food.map((foodItem) => ({...foodItem, style: 'changed-style'})),
        };

        expect(createStateHash(stateWithMetadata)).toBe(createStateHash(state));
    });

    test('canonical state contains gameplay data without rendering styles', () => {
        const state = createInitialGameState({seed: 7});
        const canonicalState = createCanonicalState(state);

        expect(canonicalState.config.seed).toBe(7);
        expect(canonicalState.rngState).toBe(state.rngState);
        expect(canonicalState.snakes[0].pendingGrowth).toBe(0);
        expect(canonicalState.snakes[0].style).toBeUndefined();
        expect(canonicalState.food[0].bodyGrowth).toBeDefined();
        expect(canonicalState.food[0].style).toBeUndefined();
    });
});
