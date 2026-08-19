import {snakeDeadRuleChecker} from '../checker/checker.js';
import {roleItemMediator} from '../mediator/role-item-mediator.js';
import {map} from './map.js';
import {snakeTypeInfo} from '../role-config/snake-type.js';
import {getDirectionVector} from '../role-config/snake-operation.js';

const Snake = function (snakeSpeed, snakeTeam, playerId, initBodyPosition, direction, snakeStyleName) {
    this.newSnakeBody = 0;
    // this.snakeWin = false;
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

// 增加的身體長度等於拿到的分數
// Snake.prototype.getSnakeScore = function () {
//     if (this.snakeBody.length <= 0) {
//         return 0;
//     }
//     return this.snakeBody.length - 1;
// }

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

// Snake.prototype.snakeTeamWin = function () {
//     this.snakeWin = true;
// }
//
// Snake.prototype.snakeTeamLose = function () {
//     this.snakeWin = false;
// }

Snake.prototype.checkSnakeItemDead = function () {
    let snakeHeadPosition = this.getSnakeHeadPosition();
    let snakeBody = this.getSnakeBody();
    if (snakeDeadRuleChecker(snakeHeadPosition, snakeBody) === 'dead' && !this.snakeDead) {
        this.snakeDead = true;
        this.clearSnakeBody();
        // roleMediator.callRoleMediatorAction('snakeDead', this);
    }
}

Snake.prototype.expandSnakeBody = function (addRate) {
    this.newSnakeBody += addRate;
}

// Snake.prototype.updateSnakeSpeed = function (speed) {
//     this.snakeSpeed += speed;
// }

Snake.prototype.clearSnakeBody = function () {
    this.snakeBody.length = 0;
}

Snake.prototype.addSnakeBody = function () {
    // 每次迴圈都會把 addRate 中最後一個 push 進 snakeBody
    for (let i = 0; i < this.newSnakeBody; i++) {
        this.snakeBody.push({...this.snakeBody[this.snakeBody.length - 1]});
    }
    this.newSnakeBody = 0;
}

Snake.prototype.updateSnakeItemPosition = function () {
    if (!this.snakeDead) {
        this.addSnakeBody();
        // 取得蛇頭位子的 x y 座標
        const currentDirection = this.getSnakeDirection();

        // 因為蛇頭會往前移一格, 所以身體也要跟著移一格
        for (let i = this.snakeBody.length - 2; i >= 0; i--) {
            // 將本來的 i 位子的身體賦予給 i+1, 達成往前移一格
            // 若以蛇頭來當例子, 相當於從 [0] 變成 [-1], 以此類推 (蛇頭不列入計算)
            this.snakeBody[i + 1] = {...this.snakeBody[i]};
        }

        // 將新方向的 x y 座標賦予給蛇頭
        this.snakeBody[0].x += currentDirection.x;
        this.snakeBody[0].y += currentDirection.y;
    }
}

Snake.prototype.renderSnakeItem = function () {
    if (!this.snakeDead) {
        this.snakeBody.forEach((bodyItem) => {
            const snakeElement = document.createElement('div');
            snakeElement.style.gridRowStart = bodyItem.y;
            snakeElement.style.gridColumnStart = bodyItem.x;
            snakeElement.classList.add(this.snakeStyleName);
            map.gameMap.appendChild(snakeElement);
        })
    }
}

const snakeFactory = function (snakeSpeed, snakeTeam, playerId, initBodyPosition, direction, snakeStyleName) {
    let newSnake = new Snake(snakeSpeed, snakeTeam, playerId, initBodyPosition, direction, snakeStyleName);
    roleItemMediator.callAction('addSnake', newSnake);
}

const initSnakeAmount = Object.keys(snakeTypeInfo);

const initSnakes = function () {
    for (let i = 0; i < initSnakeAmount.length; i++) {
        const initSnake = snakeTypeInfo[i]();
        snakeFactory(
            initSnake.snakeSpeed,
            initSnake.snakeTeam,
            initSnake.playerId,
            initSnake.initBodyPosition,
            initSnake.direction,
            initSnake.snakeStyleName,
        );
    }
}

export {
    initSnakes
}
