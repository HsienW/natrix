/** Mediator Pattern **/

import {mainGame} from '../main/main.js';
import {mainView} from '../main/main-view.js';
import {mainGameAnimation} from '../main/main-game-animation.js';
import {mainGameCountdown} from '../main/main-game-countdown.js';
import {gameStartState, gamePauseState, gameFinishState} from '../main/main-game-state.js';
import {teamMediator} from './team-mediator.js';
import {createMainGameRuntime} from '../runtime/main-game-runtime.js';

// mainGameMediator 負責中介管理遊戲進行相關的行為
// 例如: 初始、進行、暫停、結束等等...
const mainGameMediator = (function () {
    const operations = {};
    const runtime = createMainGameRuntime({
        update: function (stepMs) {
            mainGameAnimation.animationAction('update');

            if (mainGameCountdown.countdownAction('advance', stepMs)) {
                operations.gameFinish();
                teamMediator.callAction('compareTeamTotalScore');
            }
        },
        render: function () {
            mainGameAnimation.animationAction('render');
        },
    });

    operations.gameInit = function (countdownFinishNumber) {
        console.log('gameInit');
        runtime.reset();
        mainGameAnimation.animationAction('isInit');
        mainGameCountdown.countdownAction('countdownInit', countdownFinishNumber);
        mainView.callAction('initCountdownDom');
        mainView.callAction('initTeamScoreDom');
    }

    operations.gameStart = function () {
        console.log('gameStart');
        runtime.start();
        mainGame.changeState(gameStartState);
    }

    operations.gamePause = function () {
        console.log('gamePause');
        runtime.pause();
        mainGame.changeState(gamePauseState);
    }

    operations.gameFinish = function () {
        console.log('gameFinish');
        runtime.finish();
        mainGame.changeState(gameFinishState);
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
