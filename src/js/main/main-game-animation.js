// import {after} from '../decorator/decorator.js';
import {map} from '../role/map.js';
import {roleItemMediator} from '../mediator/role-item-mediator.js';
import {teamMediator} from '../mediator/team-mediator.js';
import {inputBuffer} from '../input/input-buffer.js';

const mainGameAnimation = (function () {
    let activation = null;
    let snakeSpeed = 1;
    let lastRenderTime = 2;
    const operations = {};

    operations.consumeInputCommands = function () {
        const commands = inputBuffer.drain();
        roleItemMediator.callAction('applyInputCommands', commands);
    }

    operations.updateRoleData = function () {
        operations.consumeInputCommands();
        roleItemMediator.callAction('updateAllFood');
        roleItemMediator.callAction('updateAllSnakePosition');
    }

    operations.renderRole = function () {
        map.renderMap();
        roleItemMediator.callAction('renderAllFood');
        roleItemMediator.callAction('renderAllSnake');
    }

    // 檢查場上每個 role item 的狀態
    // 例如: 每隻蛇是否死亡
    operations.checkRoleItemState = function () {
        roleItemMediator.callAction('checkAllSnakeDead');
    }

    // 檢查場上每個 team 的狀態
    // 例如: 是否有 team 時間到之前就中途獲勝
    operations.checkRoleTeamState = function () {
        teamMediator.callAction('checkTeamHalfwayWin');
    }

    operations.doAnimation = function (currentTime) {
        operations.isStart();

        // 若要開啟 speed 食物, 要固定基本更新秒數 除以 1000(毫秒)
        const secondRender = (currentTime - lastRenderTime) / 100;

        // 若要開啟 speed 食物, 這邊不能擋
        if (secondRender < 1 / snakeSpeed) {
            return;
        }

        lastRenderTime = currentTime;
        operations.updateRoleData();
        operations.renderRole();
        operations.checkRoleItemState();
        operations.checkRoleTeamState();
        // after(operations.render, operations.checkData);
    }

    operations.isInit = function () {
        roleItemMediator.callAction('clearAllRole');
        roleItemMediator.callAction('initAllFood');
        roleItemMediator.callAction('initAllSnake');
        teamMediator.callAction('clearTeamScore');
        teamMediator.callAction('initTeamScore');
    }

    operations.isStart = function () {
        activation = requestAnimationFrame(operations.doAnimation);
    }

    operations.isPause = function () {
        cancelAnimationFrame(activation);
    }

    operations.isFinish = function () {
        cancelAnimationFrame(activation);
    }

    const animationAction = function (action) {
        return operations[action].apply(this);
    }

    return {
        animationAction: animationAction
    }

})()

export {
    mainGameAnimation,
}

