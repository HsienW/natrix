const createSnapshot = function (state) {
    return {
        tick: state.tick,
        mapSize: state.config.mapSize,
        remainingSeconds: Math.max(0, Math.ceil(state.remainingTicks / state.config.tickRate)),
        snakes: state.snakes.map((snake) => ({
            id: snake.id,
            team: snake.team,
            alive: snake.alive,
            body: snake.body.map((segment) => ({x: segment.x, y: segment.y})),
            style: snake.style,
        })),
        food: state.food.map((foodItem) => ({
            id: foodItem.id,
            type: foodItem.type,
            position: {x: foodItem.position.x, y: foodItem.position.y},
            style: foodItem.style,
        })),
        score: {
            blue: state.scores['a-team'],
            red: state.scores['b-team'],
        },
        finished: state.finished,
        winner: state.winner,
    };
};

export {
    createSnapshot,
};
