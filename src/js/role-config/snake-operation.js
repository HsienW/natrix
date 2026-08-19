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

export {
    DIRECTIONS,
    getDirectionVector,
}
