/** Mediator Pattern **/

import {mainGame, gameRuntime} from '../main/main.js';
import {mainView} from '../main/main-view.js';
import {RUNTIME_ACTIONS, RUNTIME_STATES} from '../runtime/runtime-state.js';

// mainGameMediator 負責中介管理遊戲進行相關的行為
// 例如: 初始、進行、暫停、結束等等...
const mainGameMediator = (function () {
    const operations = {};

    operations.gameInit = function () {
        const lifecycleState = gameRuntime.getLifecycleState();
        if (lifecycleState === RUNTIME_STATES.RUNNING
            || lifecycleState === RUNTIME_STATES.PAUSED) {
            gameRuntime.dispatch(RUNTIME_ACTIONS.FINISH);
        }
        if (gameRuntime.getLifecycleState() === RUNTIME_STATES.FINISHED) {
            gameRuntime.dispatch(RUNTIME_ACTIONS.RESET);
        }
        mainView.callAction('initCountdownDom');
        mainView.callAction('initTeamScoreDom');
    }

    operations.gameStart = function () {
        if (gameRuntime.getLifecycleState() === RUNTIME_STATES.PAUSED) {
            gameRuntime.dispatch(RUNTIME_ACTIONS.RESUME);
            return;
        }
        gameRuntime.dispatch(RUNTIME_ACTIONS.START);
    }

    operations.gamePause = function () {
        gameRuntime.dispatch(RUNTIME_ACTIONS.PAUSE);
    }

    operations.gameFinish = function () {
        gameRuntime.dispatch(RUNTIME_ACTIONS.FINISH);
    }

    //處理呼叫參數的介面
    const callAction = function () {
        let action = Array.prototype.shift.call(arguments);
        operations[action].apply(this, arguments);
    }

    return {
        callAction: callAction
    };
})();

export {
    mainGameMediator
}
