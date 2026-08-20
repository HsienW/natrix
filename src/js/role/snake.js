import {snakeDeadRuleChecker} from '../checker/checker.js';
import {roleItemMediator} from '../mediator/role-item-mediator.js';
import {map} from './map.js';
import {snakeTypeInfo} from '../role-config/snake-type.js';
import {getDirectionVector} from '../role-config/snake-operation.js';

const Snake = function (
    snakeSpeed,
    snakeTeam,
    playerId,
    initBodyPosition,
    direction,
    snakeStyleName,
) {
    this.newSnakeBody = 0;
    this.snakeDead = false;
    this.snakeSpeed = snakeSpeed;
    this.snakeTeam = snakeTeam;
    this.playerId = playerId;
    this.snakeName = playerId;
    this.snakeBody = initBodyPosition;
    this.snakeDirection = direction;
    this.snakeStyleName = snakeStyleName;
}

Snake.prototype.getSnakeHeadPosition = function () {
    return this.snakeBody[0];
}

Snake.prototype.getSnakeBody = function () {
    return this.snakeBody;
}

Snake.prototype.getSnakeDirection = function () {
    return this.snakeDirection;
}

Snake.prototype.getSnakeDead = function () {
    return this.snakeDead;
}

Snake.prototype.getSnakeTeam = function () {
    return this.snakeTeam;
}

Snake.prototype.getPlayerId = function () {
    return this.playerId;
}

Snake.prototype.changeDirection = function (direction) {
    const nextDirection = getDirectionVector(direction);

    if (!nextDirection) {
        return false;
    }

    this.snakeDirection = nextDirection;
    return true;
}

Snake.prototype.checkSnakeItemDead = function () {
    const snakeHeadPosition = this.getSnakeHeadPosition();
    const snakeBody = this.getSnakeBody();

    if (snakeDeadRuleChecker(snakeHeadPosition, snakeBody) === 'dead' && !this.snakeDead) {
        this.snakeDead = true;
        this.clearSnakeBody();
    }
}

Snake.prototype.expandSnakeBody = function (bodyGrowth) {
    this.newSnakeBody += bodyGrowth;
}

Snake.prototype.clearSnakeBody = function () {
    this.snakeBody.length = 0;
}

Snake.prototype.addSnakeBody = function () {
    // 每次迴圈都從目前的尾端複製一節身體
    for (let bodyIndex = 0; bodyIndex < this.newSnakeBody; bodyIndex++) {
        const tailPosition = this.snakeBody[this.snakeBody.length - 1];
        this.snakeBody.push({...tailPosition});
    }

    this.newSnakeBody = 0;
}

Snake.prototype.updateSnakeItemPosition = function () {
    if (this.snakeDead) {
        return;
    }

    this.addSnakeBody();
    const currentDirection = this.getSnakeDirection();

    // 從尾端往前複製，避免前段座標在複製前被覆蓋
    for (let bodyIndex = this.snakeBody.length - 2; bodyIndex >= 0; bodyIndex--) {
        this.snakeBody[bodyIndex + 1] = {...this.snakeBody[bodyIndex]};
    }

    // 完成身體位移後，再依目前方向移動蛇頭
    this.snakeBody[0].x += currentDirection.x;
    this.snakeBody[0].y += currentDirection.y;
}

Snake.prototype.renderSnakeItem = function () {
    if (this.snakeDead) {
        return;
    }

    this.snakeBody.forEach((bodyItem) => {
        const snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = bodyItem.y;
        snakeElement.style.gridColumnStart = bodyItem.x;
        snakeElement.classList.add(this.snakeStyleName);
        map.gameMap.appendChild(snakeElement);
    })
}

const snakeFactory = function (
    snakeSpeed,
    snakeTeam,
    playerId,
    initBodyPosition,
    direction,
    snakeStyleName,
) {
    const snake = new Snake(
        snakeSpeed,
        snakeTeam,
        playerId,
        initBodyPosition,
        direction,
        snakeStyleName,
    );

    roleItemMediator.callAction('addSnake', snake);
}

const snakeTypeKeys = Object.keys(snakeTypeInfo);

const initSnakes = function () {
    for (let snakeIndex = 0; snakeIndex < snakeTypeKeys.length; snakeIndex++) {
        const snakeConfig = snakeTypeInfo[snakeTypeKeys[snakeIndex]]();

        snakeFactory(
            snakeConfig.snakeSpeed,
            snakeConfig.snakeTeam,
            snakeConfig.playerId,
            snakeConfig.initBodyPosition,
            snakeConfig.direction,
            snakeConfig.snakeStyleName,
        );
    }
}

export {
    initSnakes
}
