import {GAME_STATE_VERSION, createEmptyScores} from '../state/game-state.js';
import {FOOD_TYPE_CONFIG} from './scoring.js';
import {createSeededRng} from '../random/seeded-rng.js';

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

const createInitialFood = function (randomGenerator, mapSize) {
    const foodCount = Math.floor(randomGenerator.next() * 4) + 1;
    const food = [];

    for (let i = 0; i < foodCount; i++) {
        const randomTypeIndex = Math.floor(
            randomGenerator.next() * FOOD_TYPE_KEYS.length,
        );
        const typeKey = FOOD_TYPE_KEYS[randomTypeIndex];
        const config = FOOD_TYPE_CONFIG[typeKey];

        food.push({
            id: 'food-' + i,
            type: typeKey,
            position: {
                x: Math.floor(randomGenerator.next() * mapSize) + 1,
                y: Math.floor(randomGenerator.next() * mapSize) + 1,
            },
            bodyGrowth: config.bodyGrowth,
            style: config.style,
        });
    }

    return food;
};

const createInitialSnakes = function (randomGenerator, mapSize) {
    return SNAKE_DEFINITIONS.map((def) => ({
        id: def.id,
        team: def.team,
        alive: true,
        direction: {x: 0, y: 0},
        body: [{
            x: Math.floor(randomGenerator.next() * mapSize) + 1,
            y: Math.floor(randomGenerator.next() * mapSize) + 1,
        }],
        pendingGrowth: 0,
        style: def.style,
    }));
};

const createInitialGameState = function (config) {
    const mergedConfig = {...DEFAULT_CONFIG, ...config};
    const randomGenerator = createSeededRng(mergedConfig.seed);

    const snakes = createInitialSnakes(randomGenerator, mergedConfig.mapSize);
    const food = createInitialFood(randomGenerator, mergedConfig.mapSize);

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
        rngState: randomGenerator.getState(),
    };
};

export {
    DEFAULT_CONFIG,
    createInitialGameState,
};
