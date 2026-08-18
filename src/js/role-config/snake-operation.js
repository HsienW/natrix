/** Strategy Pattern **/

const DIRECTIONS = Object.freeze({
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
});

const DIRECTION_VECTORS = Object.freeze({
    [DIRECTIONS.UP]: Object.freeze({x: 0, y: -1}),
    [DIRECTIONS.DOWN]: Object.freeze({x: 0, y: 1}),
    [DIRECTIONS.LEFT]: Object.freeze({x: -1, y: 0}),
    [DIRECTIONS.RIGHT]: Object.freeze({x: 1, y: 0}),
});

const getDirectionVector = function (direction) {
    const vector = DIRECTION_VECTORS[direction];
    return vector ? {...vector} : null;
};

const BaseOperation = function () {
}

BaseOperation.prototype.doUp = function (direction) {
    // if (direction.y !== 0) return;
    return getDirectionVector(DIRECTIONS.UP);
};

BaseOperation.prototype.doDown = function (direction) {
    // if (direction.y !== 0) return;
    return getDirectionVector(DIRECTIONS.DOWN);
};

BaseOperation.prototype.doLeft = function (direction) {
    // if (direction.x !== 0) return;
    return getDirectionVector(DIRECTIONS.LEFT);
};

BaseOperation.prototype.doRight = function (direction) {
    // if (direction.x !== 0) return;
    return getDirectionVector(DIRECTIONS.RIGHT);
};

const baseOperation = new BaseOperation();

const aSnakeOperation = {
    ArrowUp: function (direction) {
        return baseOperation.doUp(direction);
    },
    ArrowDown: function (direction) {
        return baseOperation.doDown(direction);
    },
    ArrowLeft: function (direction) {
        return baseOperation.doLeft(direction);
    },
    ArrowRight: function (direction) {
        return baseOperation.doRight(direction);
    }
}

const bSnakeOperation = {
    KeyW: function (direction) {
        return baseOperation.doUp(direction);
    },
    KeyS: function (direction) {
        return baseOperation.doDown(direction);
    },
    KeyA: function (direction) {
        return baseOperation.doLeft(direction);
    },
    KeyD: function (direction) {
        return baseOperation.doRight(direction);
    }
}

export {
    DIRECTIONS,
    aSnakeOperation,
    bSnakeOperation,
    getDirectionVector,
}
