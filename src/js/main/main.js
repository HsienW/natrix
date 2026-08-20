/** Application Bootstrap **/

import {mainView} from './main-view.js';
import {keyboardInput} from '../input/keyboard-input.js';
import {inputBuffer} from '../input/input-buffer.js';
import {GameRuntime} from '../runtime/game-runtime.js';
import {RUNTIME_ACTIONS, RUNTIME_STATES} from '../runtime/runtime-state.js';
import {noticeConfirm} from '../common/notice.js';
import '../../style/reset.css';
import '../../style/main.css';
import '../../style/role.css';
import '../../style/team.css';

const Main = function () {
    this.startButton = null;
    this.pauseButton = null;
    this.finishButton = null;
}

Main.prototype.initMainGameView = function () {
    mainView.callAction('initControlButtonsDom');
    mainView.callAction('initCountdownDom');
    mainView.callAction('initTeamScoreDom');
}

const mainGame = new Main();

const renderFromSnapshot = function (snapshot) {
    const gameMap = document.getElementById('game-map');
    if (!gameMap) {
        return;
    }

    gameMap.innerHTML = '';

    snapshot.food.forEach((foodItem) => {
        const foodElement = document.createElement('div');
        foodElement.style.gridRowStart = foodItem.position.y;
        foodElement.style.gridColumnStart = foodItem.position.x;
        foodElement.classList.add(foodItem.style);
        gameMap.appendChild(foodElement);
    });

    snapshot.snakes.forEach((snake) => {
        if (!snake.alive) {
            return;
        }
        snake.body.forEach((segment) => {
            const snakeElement = document.createElement('div');
            snakeElement.style.gridRowStart = segment.y;
            snakeElement.style.gridColumnStart = segment.x;
            snakeElement.classList.add(snake.style);
            gameMap.appendChild(snakeElement);
        });
    });

    const countdownDom = document.querySelector('.game-countdown');
    if (countdownDom) {
        countdownDom.innerHTML = '<div>' + snapshot.remainingSeconds + '</div>';
    }

    const aTeamScoreDom = document.querySelector('.a-team');
    if (aTeamScoreDom) {
        aTeamScoreDom.innerHTML = '<div>' + snapshot.score.blue + '</div>';
    }

    const bTeamScoreDom = document.querySelector('.b-team');
    if (bTeamScoreDom) {
        bTeamScoreDom.innerHTML = '<div>' + snapshot.score.red + '</div>';
    }
};

const handleGameEvent = function (event) {
    if (event.type !== 'MATCH_FINISHED') {
        return;
    }

    const winnerName = event.winner || 'No one';
    noticeConfirm(winnerName + ' is winner!');
};

const gameRuntime = new GameRuntime({
    config: {mapSize: 41, tickRate: 10, durationTicks: 600, seed: 0},
    inputBuffer: inputBuffer,
    renderCallback: renderFromSnapshot,
    eventCallback: handleGameEvent,
});

mainGame.initMainGameView();

mainGame.startButton.onclick = function () {
    if (gameRuntime.getLifecycleState() === RUNTIME_STATES.PAUSED) {
        gameRuntime.dispatch(RUNTIME_ACTIONS.RESUME);
        return;
    }

    gameRuntime.dispatch(RUNTIME_ACTIONS.START);
};

mainGame.pauseButton.onclick = function () {
    gameRuntime.dispatch(RUNTIME_ACTIONS.PAUSE);
};

mainGame.finishButton.onclick = function () {
    gameRuntime.dispatch(RUNTIME_ACTIONS.FINISH);
};

keyboardInput.start();

export {
    mainGame,
    gameRuntime,
};
