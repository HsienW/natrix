const {createInitialGameState, DEFAULT_CONFIG} = require('../../src/js/simulation/create-initial-state.js');
const {GAME_STATE_VERSION} = require('../../src/js/state/game-state.js');

describe('createInitialGameState', () => {
    test('creates state with correct version, tick, and config', () => {
        const state = createInitialGameState({seed: 0});

        expect(state.version).toBe(GAME_STATE_VERSION);
        expect(state.tick).toBe(0);
        expect(state.config.mapSize).toBe(DEFAULT_CONFIG.mapSize);
        expect(state.config.tickRate).toBe(DEFAULT_CONFIG.tickRate);
        expect(state.config.durationTicks).toBe(DEFAULT_CONFIG.durationTicks);
        expect(state.remainingTicks).toBe(DEFAULT_CONFIG.durationTicks);
    });

    test('merges caller config over defaults', () => {
        const state = createInitialGameState(
            {mapSize: 21, tickRate: 20, durationTicks: 300, seed: 0},
        );

        expect(state.config.mapSize).toBe(21);
        expect(state.config.tickRate).toBe(20);
        expect(state.config.durationTicks).toBe(300);
        expect(state.remainingTicks).toBe(300);
    });

    test('creates two snakes for a-team and b-team with stationary direction', () => {
        const state = createInitialGameState({seed: 0});

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
        expect(red.body).toEqual([{x: 2, y: 9}]);
        expect(red.pendingGrowth).toBe(0);
        expect(red.style).toBe('b-snake-body');
    });

    test('creates food with count between 1 and 4', () => {
        for (let seed = 0; seed < 20; seed++) {
            const state = createInitialGameState({seed});
            expect(state.food.length).toBeGreaterThanOrEqual(1);
            expect(state.food.length).toBeLessThanOrEqual(4);
        }
    });

    test('assigns food types from general-expand and mega-expand', () => {
        const state = createInitialGameState({seed: 0});

        expect(state.food.length).toBeGreaterThanOrEqual(1);
        for (const foodItem of state.food) {
            expect(['general-expand', 'mega-expand']).toContain(foodItem.type);
            expect(typeof foodItem.bodyGrowth).toBe('number');
            expect(typeof foodItem.style).toBe('string');
        }
    });

    test('creates food with mega-expand type when selected', () => {
        const state = createInitialGameState({seed: 0});
        const megaFoods = state.food.filter((f) => f.type === 'mega-expand');

        expect(megaFoods.length).toBeGreaterThanOrEqual(1);
        expect(megaFoods[0].bodyGrowth).toBe(2);
        expect(megaFoods[0].style).toBe('mega-expand-food');
    });

    test('creates the known food fixture for seed zero', () => {
        const state = createInitialGameState({seed: 0});

        expect(state.food).toEqual([
            {
                id: 'food-0',
                type: 'mega-expand',
                position: {x: 24, y: 10},
                bodyGrowth: 2,
                style: 'mega-expand-food',
            },
        ]);
    });

    test('creates food positions within map bounds', () => {
        const state = createInitialGameState({seed: 0});

        for (const foodItem of state.food) {
            expect(foodItem.position.x).toBeGreaterThanOrEqual(1);
            expect(foodItem.position.x).toBeLessThanOrEqual(state.config.mapSize);
            expect(foodItem.position.y).toBeGreaterThanOrEqual(1);
            expect(foodItem.position.y).toBeLessThanOrEqual(state.config.mapSize);
        }
    });

    test('initializes scores to zero for both teams', () => {
        const state = createInitialGameState({seed: 0});

        expect(state.scores).toEqual({'a-team': 0, 'b-team': 0});
    });

    test('starts as not finished with no winner', () => {
        const state = createInitialGameState({seed: 0});

        expect(state.finished).toBe(false);
        expect(state.winner).toBeNull();
        expect(state.finishReason).toBeNull();
        expect(state.rngState).toBe(222376);
    });

    test('contains only plain data with no DOM, class instances, or functions', () => {
        const state = createInitialGameState({seed: 0});
        const json = JSON.parse(JSON.stringify(state));

        expect(json.version).toBe(state.version);
        expect(json.snakes).toEqual(state.snakes);
        expect(json.food).toEqual(state.food);
        expect(json.scores).toEqual(state.scores);
    });
});
