import {mapSize} from '../role/map.js';
import {checkValueIsEmpty, checkArrayIsEmpty, checkObjectIsEmpty} from './util.js';

const checkEqualPositions = (positionA, positionB) => {
    if (!checkValueIsEmpty(positionA) && !checkValueIsEmpty(positionB)) {
        return positionA.x === positionB.x && positionA.y === positionB.y
    }
    return null;
}

const checkPositionOutsideMap = (position) => {
    if (!checkValueIsEmpty(position)) {
        return (position.x < 1 || position.x > mapSize || position.y < 1 || position.y > mapSize);
    }
    return null;
}

// ignoreHead 用來忽略 bodyData 中拿到自己蛇頭的卡控
const checkPositionOnSnakeBody = (position, snakeBody) => {
    // 回傳撞到自己的蛇
    if (!checkArrayIsEmpty(snakeBody)) {
        return snakeBody.some((bodyItem, index) => {
            if (index === 0) return false
            return checkEqualPositions(position, bodyItem)
        })
    }
    return null;
}

const checkFoodOnSnakeBody = (food, allSnake) => {
    // 回傳吃到的蛇跟那顆食物
    let result = [];
    if (!checkObjectIsEmpty(allSnake)) {
        for (let snakeTeam in allSnake) {
            let snakes = allSnake[snakeTeam];
            snakes.forEach((snakeItem) => {
                let snakeItemHeadPosition = snakeItem.getSnakeHeadPosition();
                let foodPosition = food.getFoodPosition();
                if (checkEqualPositions(foodPosition, snakeItemHeadPosition)) {
                    result.push(snakeItem);
                }
            });
        }
        return result;
    }
    return null;
}

const checkOnlySurviveTeam = (allSnake) => {
    // 回傳剩下唯一有玩家存活的 Snake Team
    let result = [];
    if (!checkObjectIsEmpty(allSnake)) {
        for (let snakeTeam in allSnake) {
            let snakes = allSnake[snakeTeam];
            if (snakes.some(snakeItem => snakeItem.snakeDead === false)) {
                result.push(snakes);
            }
        }
        if (result.length === 1) {
            return result;
        }
        return false;
    }
    return null;
}


export {
    checkEqualPositions,
    checkPositionOutsideMap,
    checkPositionOnSnakeBody,
    checkFoodOnSnakeBody,
    checkOnlySurviveTeam
}
