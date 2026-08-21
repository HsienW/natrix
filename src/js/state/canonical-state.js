const canonicalizeValue = function (value) {
    if (Array.isArray(value)) {
        return value.map((item) => canonicalizeValue(item));
    }

    if (value !== null && typeof value === 'object') {
        const canonicalObject = {};
        const keys = Object.keys(value).sort();

        for (const key of keys) {
            canonicalObject[key] = canonicalizeValue(value[key]);
        }

        return canonicalObject;
    }

    return value;
};

const createCanonicalSnake = function (snake) {
    return {
        id: snake.id,
        team: snake.team,
        alive: snake.alive,
        direction: {
            x: snake.direction.x,
            y: snake.direction.y,
        },
        body: snake.body.map((segment) => ({
            x: segment.x,
            y: segment.y,
        })),
        pendingGrowth: snake.pendingGrowth,
    };
};

const createCanonicalFood = function (foodItem) {
    return {
        id: foodItem.id,
        type: foodItem.type,
        position: {
            x: foodItem.position.x,
            y: foodItem.position.y,
        },
        bodyGrowth: foodItem.bodyGrowth,
    };
};

const createCanonicalState = function (state) {
    const authoritativeState = {
        version: state.version,
        tick: state.tick,
        config: {
            mapSize: state.config.mapSize,
            tickRate: state.config.tickRate,
            durationTicks: state.config.durationTicks,
            seed: state.config.seed,
        },
        remainingTicks: state.remainingTicks,
        snakes: state.snakes.map((snake) => createCanonicalSnake(snake)),
        food: state.food.map((foodItem) => createCanonicalFood(foodItem)),
        scores: {...state.scores},
        finished: state.finished,
        winner: state.winner,
        finishReason: state.finishReason,
        rngState: state.rngState,
    };

    return canonicalizeValue(authoritativeState);
};

const serializeCanonicalState = function (state) {
    return JSON.stringify(createCanonicalState(state));
};

export {
    canonicalizeValue,
    createCanonicalState,
    serializeCanonicalState,
};
