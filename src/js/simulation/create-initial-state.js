import {GAME_STATE_VERSION, createEmptyScores} from '../state/game-state.js';
import {FOOD_TYPE_CONFIG} from './scoring.js';

const DEFAULT_CONFIG = {
    mapSize: 41,
    tickRate: 10,
    durationTicks: 600,
};

const SNAKE_DEFINITIONS = [
    {id: 'a-snake', team: 'a-team', style: 'a-snake-body'},
    {id: 'b-snake', team: 'b-team', style: 'b-snake-body'},
];

const FOOD_TYPE_KEYS = Object.keys(FOOD_TYPE_CONFIG);

const createInitialFood = function (randomFn, mapSize) {
    const foodCount = Math.floor(randomFn() * 4) + 1;
    const food = [];

    for (let i = 0; i < foodCount; i++) {
        const typeKey = FOOD_TYPE_KEYS[Math.floor(randomFn() * FOOD_TYPE_KEYS.length)];
        const config = FOOD_TYPE_CONFIG[typeKey];

        food.push({
            id: 'food-' + i,
            type: typeKey,
            position: {
                x: Math.floor(randomFn() * mapSize) + 1,
                y: Math.floor(randomFn() * mapSize) + 1,
            },
            bodyGrowth: config.bodyGrowth,
            style: config.style,
        });
    }

    return food;
};

const createInitialSnakes = function (randomFn, mapSize) {
    return SNAKE_DEFINITIONS.map((def) => ({
        id: def.id,
        team: def.team,
        alive: true,
        direction: {x: 0, y: 0},
        body: [{
            x: Math.floor(randomFn() * mapSize) + 1,
            y: Math.floor(randomFn() * mapSize) + 1,
        }],
        pendingGrowth: 0,
        style: def.style,
    }));
};

const createInitialGameState = function (config, environment) {
    const mergedConfig = {...DEFAULT_CONFIG, ...config};
    const randomFn = environment.random;

    return {
        version: GAME_STATE_VERSION,
        tick: 0,
        config: {
            mapSize: mergedConfig.mapSize,
            tickRate: mergedConfig.tickRate,
            durationTicks: mergedConfig.durationTicks,
        },
        remainingTicks: mergedConfig.durationTicks,
        snakes: createInitialSnakes(randomFn, mergedConfig.mapSize),
        food: createInitialFood(randomFn, mergedConfig.mapSize),
        scores: createEmptyScores(),
        finished: false,
        winner: null,
        finishReason: null,
        rngState: null,
    };
};

export {
    DEFAULT_CONFIG,
    createInitialGameState,
};
