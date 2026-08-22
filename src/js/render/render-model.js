import {createSnapshot} from '../state/snapshot.js';

const createRenderSnapshot = function (state) {
    return createSnapshot(state);
};

const clampInterpolationAlpha = function (alpha) {
    if (!Number.isFinite(alpha)) {
        return 0;
    }

    return Math.min(1, Math.max(0, alpha));
};

const copyPosition = function (position) {
    return {
        x: position.x,
        y: position.y,
    };
};

const copyFood = function (foodItem) {
    return {
        ...foodItem,
        position: copyPosition(foodItem.position),
    };
};

const copySnake = function (snake) {
    return {
        ...snake,
        body: snake.body.map((segment) => copyPosition(segment)),
    };
};

const copyRenderSnapshot = function (snapshot) {
    return {
        ...snapshot,
        snakes: snapshot.snakes.map((snake) => copySnake(snake)),
        food: snapshot.food.map((foodItem) => copyFood(foodItem)),
        score: {...snapshot.score},
    };
};

const createSnakeLookup = function (snakes) {
    const lookup = new Map();

    snakes.forEach((snake) => {
        lookup.set(snake.id, snake);
    });

    return lookup;
};

const interpolateNumber = function (previousValue, currentValue, alpha) {
    return previousValue + (currentValue - previousValue) * alpha;
};

const interpolatePosition = function (previousPosition, currentPosition, alpha) {
    return {
        x: interpolateNumber(previousPosition.x, currentPosition.x, alpha),
        y: interpolateNumber(previousPosition.y, currentPosition.y, alpha),
    };
};

const interpolateSnake = function (previousSnake, currentSnake, alpha) {
    if (!previousSnake || !previousSnake.alive || !currentSnake.alive) {
        return copySnake(currentSnake);
    }

    const body = currentSnake.body.map((currentSegment, index) => {
        const previousSegment = previousSnake.body[index];

        if (!previousSegment) {
            return copyPosition(currentSegment);
        }

        return interpolatePosition(previousSegment, currentSegment, alpha);
    });

    return {
        ...currentSnake,
        body: body,
    };
};

const createInterpolatedRenderSnapshot = function (previousSnapshot, currentSnapshot, alpha) {
    if (!currentSnapshot) {
        throw new TypeError('createInterpolatedRenderSnapshot requires a current snapshot.');
    }

    if (!previousSnapshot) {
        return copyRenderSnapshot(currentSnapshot);
    }

    const safeAlpha = clampInterpolationAlpha(alpha);
    const previousSnakes = createSnakeLookup(previousSnapshot.snakes);
    const interpolatedSnapshot = copyRenderSnapshot(currentSnapshot);

    interpolatedSnapshot.snakes = currentSnapshot.snakes.map((currentSnake) => {
        const previousSnake = previousSnakes.get(currentSnake.id);
        return interpolateSnake(previousSnake, currentSnake, safeAlpha);
    });

    return interpolatedSnapshot;
};

export {
    clampInterpolationAlpha,
    createInterpolatedRenderSnapshot,
    createRenderSnapshot,
};
