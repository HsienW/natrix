import {mainGame, gameRuntime} from '../main/main.js';
import {mainView} from '../main/main-view.js';
import {gameStartState, gamePauseState, gameFinishState} from '../main/main-game-state.js';

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
        gameRuntime.start();
        mainGame.changeState(gameStartState);
    }

    operations.gamePause = function () {
        console.log('gamePause');
        gameRuntime.pause();
        mainGame.changeState(gamePauseState);
    }

    operations.gameFinish = function () {
        console.log('gameFinish');
        gameRuntime.stop();
        mainGame.changeState(gameFinishState);
    }

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
