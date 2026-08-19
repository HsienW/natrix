import {GAME_STATE_VERSION, createEmptyScores} from '../state/game-state.js';
import {FOOD_TYPE_CONFIG} from './scoring.js';
import {createRng} from './rng.js';

const DEFAULT_CONFIG = {
    mapSize: 41,
    tickRate: 10,
    durationTicks: 600,
    seed: 0,
};

const SNAKE_DEFINITIONS = [
    {id: 'a-snake', team: 'a-team', style: 'a-snake-body'},
    {id: 'b-snake', team: 'b-team', style: 'b-snake-body'},
];

const FOOD_TYPE_KEYS = Object.keys(FOOD_TYPE_CONFIG);

const createInitialFood = function (rng, mapSize) {
    const foodCount = Math.floor(rng() * 4) + 1;
    const food = [];

    for (let i = 0; i < foodCount; i++) {
        const typeKey = FOOD_TYPE_KEYS[Math.floor(rng() * FOOD_TYPE_KEYS.length)];
        const config = FOOD_TYPE_CONFIG[typeKey];

        food.push({
            id: 'food-' + i,
            type: typeKey,
            position: {
                x: Math.floor(rng() * mapSize) + 1,
                y: Math.floor(rng() * mapSize) + 1,
            },
            bodyGrowth: config.bodyGrowth,
            style: config.style,
        });
    }

    return food;
};

const createInitialSnakes = function (rng, mapSize) {
    return SNAKE_DEFINITIONS.map((def) => ({
        id: def.id,
        team: def.team,
        alive: true,
        direction: {x: 0, y: 0},
        body: [{
            x: Math.floor(rng() * mapSize) + 1,
            y: Math.floor(rng() * mapSize) + 1,
        }],
        pendingGrowth: 0,
        style: def.style,
    }));
};

const createInitialGameState = function (config) {
    const mergedConfig = {...DEFAULT_CONFIG, ...config};
    const rng = createRng(mergedConfig.seed);

    const snakes = createInitialSnakes(rng, mergedConfig.mapSize);
    const food = createInitialFood(rng, mergedConfig.mapSize);

    return {
        version: GAME_STATE_VERSION,
        tick: 0,
        config: {
            mapSize: mergedConfig.mapSize,
            tickRate: mergedConfig.tickRate,
            durationTicks: mergedConfig.durationTicks,
            seed: mergedConfig.seed,
        },
        remainingTicks: mergedConfig.durationTicks,
        snakes: snakes,
        food: food,
        scores: createEmptyScores(),
        finished: false,
        winner: null,
        finishReason: null,
        rngState: (mergedConfig.seed + 0x6D2B79F5) | 0,
    };
};

export {
    DEFAULT_CONFIG,
    createInitialGameState,
};
