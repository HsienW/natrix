/** Mediator Pattern **/

import {initFoods} from '../role/food.js';
import {initSnakes} from '../role/snake.js';
import {teamMediator} from './team-mediator.js';
import {COMMAND_TYPES} from '../input/command-map.js';

// roleItemMediator 負責中介管理單一角色相關的行為
// 例如: 食物、蛇的初始化、渲染、更新等等...

const roleItemMediator = (function () {
    let allFood = {};
    let allSnake = {};
    const operations = {};

    operations.addFood = function (food) {
        let foodType = food.foodType;
        allFood[foodType] = allFood[foodType] || [];
        allFood[foodType].push(food);
    };

    operations.addSnake = function (snake) {
        let snakeTeam = snake.snakeTeam;
        allSnake[snakeTeam] = allSnake[snakeTeam] || [];
        allSnake[snakeTeam].push(snake);
    };

    operations.getAllFood = function () {
        return allFood;
    };

    operations.getAllSnake = function () {
        return allSnake;
    };

    operations.clearAllRole = function () {
        allFood = {};
        allSnake = {};
    };

    operations.applyInputCommands = function (commands) {
        if (!Array.isArray(commands)) {
            return;
        }

        commands.forEach((command) => {
            if (command.type !== COMMAND_TYPES.CHANGE_DIRECTION) {
                return;
            }

            const snake = findSnakeByPlayerId(command.playerId);
            if (snake) {
                snake.changeDirection(command.direction);
            }
        });
    };

    operations.snakeEatFood = function (food, eatFoodSnakes) {
        let snakeAddBodyRate = food.getFoodBodyExpandRate();
        eatFoodSnakes.forEach((snake) => {
            snake['expandSnakeBody'](snakeAddBodyRate);
            // 增加的身體長度等於拿到的分數
            teamMediator.callAction('addTeamScore', snake, snakeAddBodyRate);
        });
    };

    operations.initAllFood = function () {
        initFoods();
    }

    operations.updateAllFood = function () {
        callRoleItemMethod(allFood, 'updateFoodItem');
    }

    operations.renderAllFood = function () {
        callRoleItemMethod(allFood, 'renderFoodItem');
    }

    operations.initAllSnake = function () {
        initSnakes();
        callRoleItemMethod(allSnake, 'initListenerOperation');
    }

    operations.checkAllSnakeDead = function () {
        callRoleItemMethod(allSnake, 'checkSnakeItemDead');
    }

    operations.updateAllSnakePosition = function () {
        callRoleItemMethod(allSnake, 'updateSnakeItemPosition');
    }

    operations.renderAllSnake = function () {
        callRoleItemMethod(allSnake, 'renderSnakeItem');
    }

    //處理某種角色, 全部的 item 需要一起呼叫的
    const findSnakeByPlayerId = function (playerId) {
        for (let team in allSnake) {
            const snake = allSnake[team].find((snakeItem) => {
                return snakeItem.getPlayerId() === playerId;
            });

            if (snake) {
                return snake;
            }
        }

        return null;
    }

    const callRoleItemMethod = function (role, methodName) {
        for (let key in role) {
            let items = role[key];
            items.forEach((item) => {
                item[methodName]();
            });
        }
    }

    //處理呼叫參數的介面
    const getData = function () {
        let action = Array.prototype.shift.call(arguments);
        return operations[action].apply(this);
    }

    const callAction = function () {
        let action = Array.prototype.shift.call(arguments);
        operations[action].apply(this, arguments);
    }

    return {
        getData: getData,
        callAction: callAction
    };
})();

export {
    roleItemMediator
}
