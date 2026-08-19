const {createInitialGameState, DEFAULT_CONFIG} = require('../../src/js/simulation/create-initial-state.js');
const {GAME_STATE_VERSION} = require('../../src/js/state/game-state.js');

const makeRandom = function (values) {
    let index = 0;
    return () => {
        if (index >= values.length) {
            return 0;
        }
        return values[index++];
    };
};

describe('createInitialGameState', () => {
    test('creates state with correct version, tick, and config', () => {
        const state = createInitialGameState({}, {random: makeRandom([0, 0, 0, 0, 0])});

        expect(state.version).toBe(GAME_STATE_VERSION);
        expect(state.tick).toBe(0);
        expect(state.config.mapSize).toBe(DEFAULT_CONFIG.mapSize);
        expect(state.config.tickRate).toBe(DEFAULT_CONFIG.tickRate);
        expect(state.config.durationTicks).toBe(DEFAULT_CONFIG.durationTicks);
        expect(state.remainingTicks).toBe(DEFAULT_CONFIG.durationTicks);
    });

    test('merges caller config over defaults', () => {
        const state = createInitialGameState(
            {mapSize: 21, tickRate: 20, durationTicks: 300},
            {random: makeRandom([0, 0, 0, 0, 0])},
        );

        expect(state.config.mapSize).toBe(21);
        expect(state.config.tickRate).toBe(20);
        expect(state.config.durationTicks).toBe(300);
        expect(state.remainingTicks).toBe(300);
    });

    test('creates two snakes for a-team and b-team with stationary direction', () => {
        const state = createInitialGameState({}, {random: makeRandom([0, 0, 0, 0, 0])});

        expect(state.snakes).toHaveLength(2);

        const blue = state.snakes.find((s) => s.id === 'a-snake');
        const red = state.snakes.find((s) => s.id === 'b-snake');

        expect(blue).toBeDefined();
        expect(blue.team).toBe('a-team');
        expect(blue.alive).toBe(true);
        expect(blue.direction).toEqual({x: 0, y: 0});
        expect(blue.body).toEqual([{x: 1, y: 1}]);
        expect(blue.pendingGrowth).toBe(0);
        expect(blue.style).toBe('a-snake-body');

        expect(red).toBeDefined();
        expect(red.team).toBe('b-team');
        expect(red.alive).toBe(true);
        expect(red.direction).toEqual({x: 0, y: 0});
        expect(red.body).toEqual([{x: 41, y: 41}]);
        expect(red.pendingGrowth).toBe(0);
        expect(red.style).toBe('b-snake-body');
    });

    test('creates food with count between 1 and 4', () => {
        const zeroState = createInitialGameState({}, {random: makeRandom([0, 0, 0, 0, 0])});
        expect(zeroState.food.length).toBeGreaterThanOrEqual(1);
        expect(zeroState.food.length).toBeLessThanOrEqual(4);

        const maxState = createInitialGameState({}, {random: makeRandom([0.99, 0, 0, 0, 0])});
        expect(maxState.food.length).toBe(4);
    });

    test('assigns food types from general-expand and mega-expand', () => {
        const state = createInitialGameState({}, {
            random: makeRandom([
                0,    // food count → 1
                0,    // food type index → 0 (general-expand)
                0, 0, // food position
            ]),
        });

        expect(state.food).toHaveLength(1);
        expect(state.food[0].type).toBe('general-expand');
        expect(state.food[0].bodyGrowth).toBe(1);
        expect(state.food[0].style).toBe('general-expand-food');
    });

    test('creates food with mega-expand type when selected', () => {
        const state = createInitialGameState({}, {
            random: makeRandom([
                0,    // food count → 1
                0.5,  // food type index → floor(0.5 * 2) = 1 (mega-expand)
                0, 0, // food position
            ]),
        });

        expect(state.food[0].type).toBe('mega-expand');
        expect(state.food[0].bodyGrowth).toBe(2);
        expect(state.food[0].style).toBe('mega-expand-food');
    });

    test('creates food positions within map bounds', () => {
        const state = createInitialGameState({}, {
            random: makeRandom([
                0,       // food count → 1
                0,       // food type → general-expand
                0.5, 0.5 // position → floor(0.5 * 41) + 1 = 21
            ]),
        });

        expect(state.food[0].position).toEqual({x: 21, y: 21});
    });

    test('initializes scores to zero for both teams', () => {
        const state = createInitialGameState({}, {random: makeRandom([0, 0, 0, 0, 0])});

        expect(state.scores).toEqual({'a-team': 0, 'b-team': 0});
    });

    test('starts as not finished with no winner', () => {
        const state = createInitialGameState({}, {random: makeRandom([0, 0, 0, 0, 0])});

        expect(state.finished).toBe(false);
        expect(state.winner).toBeNull();
        expect(state.finishReason).toBeNull();
        expect(state.rngState).toBeNull();
    });

    test('contains only plain data with no DOM, class instances, or functions', () => {
        const state = createInitialGameState({}, {random: makeRandom([0, 0, 0, 0, 0])});
        const json = JSON.parse(JSON.stringify(state));

        expect(json.version).toBe(state.version);
        expect(json.snakes).toEqual(state.snakes);
        expect(json.food).toEqual(state.food);
        expect(json.scores).toEqual(state.scores);
    });
});
