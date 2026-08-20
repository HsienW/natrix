import {nextRandomValue} from '../random/seeded-rng.js';

const FOOD_TYPE_CONFIG = {
    'general-expand': {bodyGrowth: 1, style: 'general-expand-food'},
    'mega-expand': {bodyGrowth: 2, style: 'mega-expand-food'},
};

const relocateFood = function (foodItem, rngState, mapSize) {
    const xResult = nextRandomValue(rngState);
    const yResult = nextRandomValue(xResult.nextState);

    return {
        food: {
            ...foodItem,
            position: {
                x: Math.floor(xResult.value * mapSize) + 1,
                y: Math.floor(yResult.value * mapSize) + 1,
            },
        },
        nextState: yResult.nextState,
    };
};

const resolveScoring = function (state) {
    const events = [];
    const scores = {...state.scores};
    let foodUpdated = false;
    let rngState = state.rngState;
    const mapSize = state.config.mapSize;

    const newFood = state.food.map(function (foodItem) {
        const eatingSnakes = state.snakes.filter(function (snake) {
            return snake.alive
                && snake.body.length > 0
                && snake.body[0].x === foodItem.position.x
                && snake.body[0].y === foodItem.position.y;
        });

        if (eatingSnakes.length === 0) {
            return foodItem;
        }

        foodUpdated = true;

        eatingSnakes.forEach(function (snake) {
            scores[snake.team] = (scores[snake.team] || 0) + foodItem.bodyGrowth;
            events.push({
                type: 'FOOD_EATEN',
                foodId: foodItem.id,
                playerId: snake.id,
                team: snake.team,
                bodyGrowth: foodItem.bodyGrowth,
            });
        });

        const relocation = relocateFood(foodItem, rngState, mapSize);
        rngState = relocation.nextState;

        return relocation.food;
    });

    return {
        snakes: state.snakes.map(function (snake) {
            const eatenForSnake = events.filter(
                function (event) { return event.type === 'FOOD_EATEN' && event.playerId === snake.id; },
            );
            if (eatenForSnake.length === 0) {
                return snake;
            }
            const totalGrowth = eatenForSnake.reduce(function (sum, event) {
                return sum + event.bodyGrowth;
            }, 0);
            return {...snake, pendingGrowth: snake.pendingGrowth + totalGrowth};
        }),
        food: foodUpdated ? newFood : state.food,
        scores: scores,
        rngState: rngState,
        events: events,
    };
};

export {
    FOOD_TYPE_CONFIG,
    resolveScoring,
};
