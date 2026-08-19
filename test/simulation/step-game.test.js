const {stepGame} = require('../../src/js/simulation/step-game.js');
const {createInitialGameState} = require('../../src/js/simulation/create-initial-state.js');

const makeRandom = function (values) {
    let index = 0;
    return () => {
        if (index >= values.length) {
            return 0;
        }
        return values[index++];
    };
};

const createTestState = function (overrides) {
    const base = {
        version: 1,
        tick: 0,
        config: {mapSize: 41, tickRate: 10, durationTicks: 600},
        remainingTicks: 600,
        snakes: [
            {
                id: 'a-snake',
                team: 'a-team',
                alive: true,
                direction: {x: 0, y: 0},
                body: [{x: 5, y: 5}],
                pendingGrowth: 0,
                style: 'a-snake-body',
            },
            {
                id: 'b-snake',
                team: 'b-team',
                alive: true,
                direction: {x: 0, y: 0},
                body: [{x: 20, y: 20}],
                pendingGrowth: 0,
                style: 'b-snake-body',
            },
        ],
        food: [
            {
                id: 'food-0',
                type: 'general-expand',
                position: {x: 10, y: 10},
                bodyGrowth: 1,
                style: 'general-expand-food',
            },
        ],
        scores: {'a-team': 0, 'b-team': 0},
        finished: false,
        winner: null,
        finishReason: null,
        rngState: null,
    };

    if (!overrides) {
        return base;
    }

    return {...base, ...overrides};
};

const testEnvironment = {random: makeRandom([0.5, 0.5])};

describe('stepGame', () => {
    test('advances exactly one tick per call', () => {
        const state = createTestState();
        const result = stepGame(state, [], testEnvironment);

        expect(result.state.tick).toBe(1);
        expect(result.state.remainingTicks).toBe(599);
    });

    test('does not mutate previous state', () => {
        const state = createTestState();
        const snapshot = JSON.parse(JSON.stringify(state));

        stepGame(state, [
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
        ], testEnvironment);

        expect(state).toEqual(snapshot);
    });

    test('does not mutate command objects', () => {
        const state = createTestState();
        const command = {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'};
        const commandSnapshot = {...command};

        stepGame(state, [command], testEnvironment);

        expect(command).toEqual(commandSnapshot);
    });

    test('applies direction commands in array order', () => {
        const state = createTestState();
        const commands = [
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'DOWN'},
        ];

        const result = stepGame(state, commands, testEnvironment);
        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');

        expect(aSnake.direction).toEqual({x: 0, y: 1});
        expect(aSnake.body[0]).toEqual({x: 5, y: 6});
    });

    test('ignores commands for unknown player IDs', () => {
        const state = createTestState();
        const commands = [
            {type: 'CHANGE_DIRECTION', playerId: 'unknown', direction: 'LEFT'},
        ];

        const result = stepGame(state, commands, testEnvironment);
        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');

        expect(aSnake.direction).toEqual({x: 0, y: 0});
    });

    test('ignores commands with unknown type', () => {
        const state = createTestState();
        const commands = [
            {type: 'UNKNOWN_ACTION', playerId: 'a-snake', direction: 'LEFT'},
        ];

        const result = stepGame(state, commands, testEnvironment);
        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');

        expect(aSnake.direction).toEqual({x: 0, y: 0});
    });

    test('moves snake in stationary direction when no command given', () => {
        const state = createTestState();
        const result = stepGame(state, [], testEnvironment);

        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');
        expect(aSnake.body[0]).toEqual({x: 5, y: 5});
    });

    test('moves snake head by direction vector', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: 1, y: 0},
                    body: [{x: 5, y: 5}],
                    pendingGrowth: 0,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 20, y: 20}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);
        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');

        expect(aSnake.body[0]).toEqual({x: 6, y: 5});
    });

    test('grows snake body when pending growth is set', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: 1, y: 0},
                    body: [{x: 5, y: 5}],
                    pendingGrowth: 2,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 20, y: 20}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);
        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');

        expect(aSnake.body).toHaveLength(3);
        expect(aSnake.body[0]).toEqual({x: 6, y: 5});
        expect(aSnake.body[1]).toEqual({x: 5, y: 5});
        expect(aSnake.body[2]).toEqual({x: 5, y: 5});
        expect(aSnake.pendingGrowth).toBe(0);
    });

    test('resolves food when snake head occupies food position', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 10, y: 10}],
                    pendingGrowth: 0,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 20, y: 20}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);

        expect(result.state.scores['a-team']).toBe(1);
        expect(result.events.some((e) => e.type === 'FOOD_EATEN' && e.playerId === 'a-snake')).toBe(true);

        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');
        expect(aSnake.body).toHaveLength(2);
        expect(aSnake.pendingGrowth).toBe(0);
    });

    test('awards food to both snakes when both heads occupy food position', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 10, y: 10}],
                    pendingGrowth: 0,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 10, y: 10}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);

        expect(result.state.scores['a-team']).toBe(1);
        expect(result.state.scores['b-team']).toBe(1);

        const foodEvents = result.events.filter((e) => e.type === 'FOOD_EATEN');
        expect(foodEvents).toHaveLength(2);
    });

    test('relocates food after it is eaten', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 10, y: 10}],
                    pendingGrowth: 0,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 20, y: 20}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);
        const food = result.state.food[0];

        expect(food.position).not.toEqual({x: 10, y: 10});
    });

    test('kills snake when head moves outside map', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: -1, y: 0},
                    body: [{x: 1, y: 5}],
                    pendingGrowth: 0,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 20, y: 20}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);
        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');

        expect(aSnake.alive).toBe(false);
        expect(result.events.some((e) => e.type === 'SNAKE_DIED' && e.playerId === 'a-snake')).toBe(true);
    });

    test('kills snake when head collides with own body', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: 0, y: 1},
                    body: [
                        {x: 5, y: 5},
                        {x: 5, y: 6},
                        {x: 4, y: 6},
                        {x: 4, y: 5},
                    ],
                    pendingGrowth: 0,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 20, y: 20}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);
        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');

        expect(aSnake.alive).toBe(false);
        expect(aSnake.body[0]).toEqual({x: 5, y: 6});
    });

    test('finishes immediately when only one team survives', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: -1, y: 0},
                    body: [{x: 1, y: 5}],
                    pendingGrowth: 0,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 20, y: 20}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);

        expect(result.state.finished).toBe(true);
        expect(result.state.winner).toBe('b-team');
        expect(result.state.finishReason).toBe('survival');
        expect(result.events.some((e) => e.type === 'MATCH_FINISHED')).toBe(true);
    });

    test('declares draw when both snakes die in the same tick', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: -1, y: 0},
                    body: [{x: 1, y: 5}],
                    pendingGrowth: 0,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 1, y: 0},
                    body: [{x: 41, y: 20}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);
        const deathEvents = result.events.filter((e) => e.type === 'SNAKE_DIED');

        expect(deathEvents).toHaveLength(2);
        expect(result.state.finished).toBe(false);
        expect(result.state.remainingTicks).toBe(599);
    });

    test('finishes by time expiry with higher score winner', () => {
        const state = createTestState({
            remainingTicks: 1,
            scores: {'a-team': 5, 'b-team': 3},
        });

        const result = stepGame(state, [], testEnvironment);

        expect(result.state.finished).toBe(true);
        expect(result.state.winner).toBe('a-team');
        expect(result.state.finishReason).toBe('time');
    });

    test('finishes by time expiry with draw on equal scores', () => {
        const state = createTestState({
            remainingTicks: 1,
            scores: {'a-team': 3, 'b-team': 3},
        });

        const result = stepGame(state, [], testEnvironment);

        expect(result.state.finished).toBe(true);
        expect(result.state.winner).toBeNull();
        expect(result.state.finishReason).toBe('draw');
    });

    test('does not advance when match is already finished', () => {
        const state = createTestState({
            finished: true,
            winner: 'a-team',
            finishReason: 'survival',
            remainingTicks: 100,
        });

        const result = stepGame(state, [
            {type: 'CHANGE_DIRECTION', playerId: 'a-snake', direction: 'RIGHT'},
        ], testEnvironment);

        expect(result.state).toBe(state);
        expect(result.events).toEqual([]);
    });

    test('decrements remainingTicks each step', () => {
        const state = createTestState({remainingTicks: 5});

        const result1 = stepGame(state, [], testEnvironment);
        expect(result1.state.remainingTicks).toBe(4);

        const result2 = stepGame(result1.state, [], testEnvironment);
        expect(result2.state.remainingTicks).toBe(3);
    });

    test('applies mega-expand food growth of 2 segments', () => {
        const state = createTestState({
            snakes: [
                {
                    id: 'a-snake',
                    team: 'a-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 10, y: 10}],
                    pendingGrowth: 0,
                    style: 'a-snake-body',
                },
                {
                    id: 'b-snake',
                    team: 'b-team',
                    alive: true,
                    direction: {x: 0, y: 0},
                    body: [{x: 20, y: 20}],
                    pendingGrowth: 0,
                    style: 'b-snake-body',
                },
            ],
            food: [
                {
                    id: 'food-0',
                    type: 'mega-expand',
                    position: {x: 10, y: 10},
                    bodyGrowth: 2,
                    style: 'mega-expand-food',
                },
            ],
        });

        const result = stepGame(state, [], testEnvironment);
        const aSnake = result.state.snakes.find((s) => s.id === 'a-snake');

        expect(aSnake.body).toHaveLength(3);
        expect(aSnake.pendingGrowth).toBe(0);
        expect(result.state.scores['a-team']).toBe(2);
    });
});
