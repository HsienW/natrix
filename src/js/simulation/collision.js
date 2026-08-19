const isOutsideMap = function (position, mapSize) {
    return position.x < 1 || position.x > mapSize || position.y < 1 || position.y > mapSize;
};

const isSelfCollision = function (head, body) {
    for (let i = 1; i < body.length; i++) {
        if (head.x === body[i].x && head.y === body[i].y) {
            return true;
        }
    }
    return false;
};

const checkDeaths = function (snakes, mapSize) {
    const events = [];

    const updated = snakes.map((snake) => {
        if (!snake.alive) {
            return snake;
        }

        const head = snake.body[0];
        const dead = isOutsideMap(head, mapSize) || isSelfCollision(head, snake.body);

        if (!dead) {
            return snake;
        }

        events.push({
            type: 'SNAKE_DIED',
            playerId: snake.id,
            team: snake.team,
            cause: isOutsideMap(head, mapSize) ? 'wall' : 'self',
        });

        return {...snake, alive: false};
    });

    return {snakes: updated, events};
};

export {
    checkDeaths,
    isOutsideMap,
    isSelfCollision,
};
