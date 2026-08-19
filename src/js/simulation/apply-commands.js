import {getDirectionVector} from '../role-config/snake-operation.js';

const applyCommands = function (state, commands) {
    if (!Array.isArray(commands) || commands.length === 0) {
        return state;
    }

    const snakes = state.snakes.map((snake) => {
        let direction = snake.direction;

        for (const command of commands) {
            if (command.playerId !== snake.id) {
                continue;
            }
            if (command.type !== 'CHANGE_DIRECTION') {
                continue;
            }

            const vector = getDirectionVector(command.direction);
            if (vector) {
                direction = vector;
            }
        }

        if (direction === snake.direction) {
            return snake;
        }

        return {...snake, direction: {...direction}};
    });

    return {...state, snakes};
};

export {
    applyCommands,
};
