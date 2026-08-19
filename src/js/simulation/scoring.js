const FOOD_TYPE_CONFIG = {
    'general-expand': {bodyGrowth: 1, style: 'general-expand-food'},
    'mega-expand': {bodyGrowth: 2, style: 'mega-expand-food'},
};

const resolveScoring = function (state, environment) {
    const events = [];
    let scores = {...state.scores};
    let foodUpdated = false;
    const newFood = state.food.map((foodItem) => {
        const eatingSnakes = state.snakes.filter((snake) => {
            return snake.alive
                && snake.body.length > 0
                && snake.body[0].x === foodItem.position.x
                && snake.body[0].y === foodItem.position.y;
        });

        if (eatingSnakes.length === 0) {
            return foodItem;
        }

        foodUpdated = true;

        eatingSnakes.forEach((snake) => {
            scores[snake.team] = (scores[snake.team] || 0) + foodItem.bodyGrowth;
            events.push({
                type: 'FOOD_EATEN',
                foodId: foodItem.id,
                playerId: snake.id,
                team: snake.team,
                bodyGrowth: foodItem.bodyGrowth,
            });
        });

        return {
            ...foodItem,
            position: {
                x: Math.floor(environment.random() * state.config.mapSize) + 1,
                y: Math.floor(environment.random() * state.config.mapSize) + 1,
            },
        };
    });

    return {
        snakes: state.snakes.map((snake) => {
            const eatenForSnake = events.filter(
                (event) => event.type === 'FOOD_EATEN' && event.playerId === snake.id,
            );
            if (eatenForSnake.length === 0) {
                return snake;
            }
            const totalGrowth = eatenForSnake.reduce((sum, event) => sum + event.bodyGrowth, 0);
            return {...snake, pendingGrowth: snake.pendingGrowth + totalGrowth};
        }),
        food: foodUpdated ? newFood : state.food,
        scores,
        events,
    };
};

export {
    FOOD_TYPE_CONFIG,
    resolveScoring,
};
