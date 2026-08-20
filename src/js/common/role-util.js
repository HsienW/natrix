import {mapSize} from '../role/map.js';
import {checkValueIsEmpty, checkArrayIsEmpty, checkObjectIsEmpty} from './util.js';

const checkEqualPositions = (positionA, positionB) => {
    if (checkValueIsEmpty(positionA) || checkValueIsEmpty(positionB)) {
        return null;
    }

    return positionA.x === positionB.x && positionA.y === positionB.y;
}

const checkPositionOutsideMap = (position) => {
    if (checkValueIsEmpty(position)) {
        return null;
    }

    return position.x < 1
        || position.x > mapSize
        || position.y < 1
        || position.y > mapSize;
}

const checkPositionOnSnakeBody = (position, snakeBody) => {
    if (checkArrayIsEmpty(snakeBody)) {
        return null;
    }

    return snakeBody.some((bodyItem, index) => {
        if (index === 0) {
            return false;
        }

        return checkEqualPositions(position, bodyItem);
    });
}

const checkFoodOnSnakeBody = (food, allSnake) => {
    if (checkObjectIsEmpty(allSnake)) {
        return null;
    }

    const matchingSnakes = [];
    const foodPosition = food.getFoodPosition();

    for (const snakeTeam in allSnake) {
        const snakes = allSnake[snakeTeam];

        snakes.forEach((snakeItem) => {
            const snakeHeadPosition = snakeItem.getSnakeHeadPosition();

            if (checkEqualPositions(foodPosition, snakeHeadPosition)) {
                matchingSnakes.push(snakeItem);
            }
        });
    }

    return matchingSnakes;
}

const checkOnlySurviveTeam = (allSnake) => {
    if (checkObjectIsEmpty(allSnake)) {
        return null;
    }

    const survivingTeams = [];

    for (const snakeTeam in allSnake) {
        const snakes = allSnake[snakeTeam];
        const hasSurvivingSnake = snakes.some((snakeItem) => {
            return snakeItem.snakeDead === false;
        });

        if (hasSurvivingSnake) {
            survivingTeams.push(snakes);
        }
    }

    if (survivingTeams.length === 1) {
        return survivingTeams;
    }

    return false;
}

export {
    checkEqualPositions,
    checkPositionOutsideMap,
    checkPositionOnSnakeBody,
    checkFoodOnSnakeBody,
    checkOnlySurviveTeam
}
