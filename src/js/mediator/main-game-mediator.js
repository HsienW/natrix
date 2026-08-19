/** Mediator Pattern **/

import {mainGame, gameRuntime} from '../main/main.js';
import {mainView} from '../main/main-view.js';

// mainGameMediator 負責中介管理遊戲進行相關的行為
// 例如: 初始、進行、暫停、結束等等...
const mainGameMediator = (function () {
    const operations = {};

    operations.gameInit = function () {
        console.log('gameInit');
        gameRuntime.reset();
        mainView.callAction('initCountdownDom');
        mainView.callAction('initTeamScoreDom');
    }

    operations.gameStart = function () {
        console.log('gameStart');
        gameRuntime.dispatch('START');
    }

    operations.gamePause = function () {
        console.log('gamePause');
        gameRuntime.dispatch('PAUSE');
    }

    operations.gameFinish = function () {
        console.log('gameFinish');
        gameRuntime.dispatch('FINISH');
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
