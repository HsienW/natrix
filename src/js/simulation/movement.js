const moveHead = function (head, direction) {
    return {x: head.x + direction.x, y: head.y + direction.y};
};

const applyGrowth = function (body, pendingGrowth) {
    if (pendingGrowth <= 0 || body.length === 0) {
        return {body: body, added: 0};
    }

    const tail = body[body.length - 1];
    const newSegments = [];
    for (let i = 0; i < pendingGrowth; i++) {
        newSegments.push({x: tail.x, y: tail.y});
    }

    return {
        body: body.concat(newSegments),
        added: pendingGrowth,
    };
};

const moveSnake = function (snake) {
    if (!snake.alive) {
        return snake;
    }

    const growthResult = applyGrowth(snake.body, snake.pendingGrowth);
    const grownBody = growthResult.body;

    if (grownBody.length <= 1) {
        const newHead = moveHead(grownBody[0], snake.direction);
        return {
            ...snake,
            body: [newHead],
            pendingGrowth: 0,
        };
    }

    const newBody = [null];
    for (let i = grownBody.length - 2; i >= 0; i--) {
        newBody[i + 1] = {x: grownBody[i].x, y: grownBody[i].y};
    }

    newBody[0] = moveHead(grownBody[0], snake.direction);

    return {
        ...snake,
        body: newBody,
        pendingGrowth: 0,
    };
};

const moveAllSnakes = function (snakes) {
    return snakes.map((snake) => moveSnake(snake));
};

export {
    applyGrowth,
    moveHead,
    moveAllSnakes,
    moveSnake,
};
