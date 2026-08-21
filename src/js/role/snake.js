import {snakeDeadRuleChecker} from '../checker/checker.js';
import {roleItemMediator} from '../mediator/role-item-mediator.js';
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
    // 增加的身體長度等於拿到的分數
    this.newSnakeBody += bodyGrowth;
}

Snake.prototype.clearSnakeBody = function () {
    this.snakeBody.length = 0;
}

Snake.prototype.addSnakeBody = function () {
    // 每次迴圈都會把目前蛇尾位置 push 進 snakeBody
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
    // 取得蛇目前方向的 x y 座標
    const currentDirection = this.getSnakeDirection();

    // 因為蛇頭會往前移一格, 所以身體也要跟著移一格
    // 從尾端往前複製，避免前段座標在複製前被覆蓋
    for (let bodyIndex = this.snakeBody.length - 2; bodyIndex >= 0; bodyIndex--) {
        // 將本來的 bodyIndex 位子的身體賦予給 bodyIndex+1, 達成往前移一格
        this.snakeBody[bodyIndex + 1] = {...this.snakeBody[bodyIndex]};
    }

    // 將新方向的 x y 座標賦予給蛇頭
    this.snakeBody[0].x += currentDirection.x;
    this.snakeBody[0].y += currentDirection.y;
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
