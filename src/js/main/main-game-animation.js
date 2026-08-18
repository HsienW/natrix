import {map} from '../role/map.js';
import {roleItemMediator} from '../mediator/role-item-mediator.js';
import {teamMediator} from '../mediator/team-mediator.js';

const mainGameAnimation = (function () {
    const operations = {};

    operations.updateRoleData = function () {
        roleItemMediator.callAction('updateAllFood');
        roleItemMediator.callAction('updateAllSnakePosition');
    };

    operations.renderRole = function () {
        map.renderMap();
        roleItemMediator.callAction('renderAllFood');
        roleItemMediator.callAction('renderAllSnake');
    };

    operations.checkRoleItemState = function () {
        roleItemMediator.callAction('checkAllSnakeDead');
    };

    operations.checkRoleTeamState = function () {
        teamMediator.callAction('checkTeamHalfwayWin');
    };

    operations.update = function () {
        operations.updateRoleData();
        operations.checkRoleItemState();
        operations.checkRoleTeamState();
    };

    operations.render = function () {
        operations.renderRole();
    };

    operations.isInit = function () {
        roleItemMediator.callAction('clearAllRole');
        roleItemMediator.callAction('initAllFood');
        roleItemMediator.callAction('initAllSnake');
        teamMediator.callAction('clearTeamScore');
        teamMediator.callAction('initTeamScore');
    };

    const animationAction = function (action) {
        return operations[action].apply(this, Array.prototype.slice.call(arguments, 1));
    };

    return {
        animationAction: animationAction,
    };
})();

export {
    mainGameAnimation,
};
