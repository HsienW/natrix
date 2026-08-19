/** State Pattern **/

import {gameFinishState} from './main-game-state.js';
import {mainView} from './main-view.js';
import {keyboardInput} from '../input/keyboard-input.js';
import {inputBuffer} from '../input/input-buffer.js';
import {GameRuntime} from '../runtime/game-runtime.js';
import '../../style/reset.css';
import '../../style/main.css';
import '../../style/role.css';
import '../../style/team.css';

const Main = function () {
    this.startButton = null;
    this.pauseButton = null;
    this.finishButton = null;
    // 設定初始狀態
    this.currentState = gameFinishState;
}

Main.prototype.changeState = function (newState) {
    this.currentState = newState;
}

Main.prototype.initMainGameView = function () {
    mainView.callAction('initControlButtonsDom');
    mainView.callAction('initCountdownDom');
    mainView.callAction('initTeamScoreDom');
    mainView.callAction('bindControlButtonEvent');
}

const mainGame = new Main();

const renderFromSnapshot = function (snapshot) {
    const gameMap = document.getElementById('game-map');
    if (!gameMap) {
        return;
    }

    gameMap.innerHTML = '';

    snapshot.food.forEach((foodItem) => {
        const el = document.createElement('div');
        el.style.gridRowStart = foodItem.position.y;
        el.style.gridColumnStart = foodItem.position.x;
        el.classList.add(foodItem.style);
        gameMap.appendChild(el);
    });

    snapshot.snakes.forEach((snake) => {
        if (!snake.alive) {
            return;
        }
        snake.body.forEach((segment) => {
            const el = document.createElement('div');
            el.style.gridRowStart = segment.y;
            el.style.gridColumnStart = segment.x;
            el.classList.add(snake.style);
            gameMap.appendChild(el);
        });
    });

    const countdownEl = document.querySelector('.game-countdown');
    if (countdownEl) {
        countdownEl.innerHTML = '<div>' + snapshot.remainingSeconds + '</div>';
    }

    const aTeamEl = document.querySelector('.a-team');
    if (aTeamEl) {
        aTeamEl.innerHTML = '<div>' + snapshot.score.blue + '</div>';
    }

    const bTeamEl = document.querySelector('.b-team');
    if (bTeamEl) {
        bTeamEl.innerHTML = '<div>' + snapshot.score.red + '</div>';
    }
};

const gameRuntime = new GameRuntime({
    config: {mapSize: 41, tickRate: 10, durationTicks: 600},
    environment: {random: Math.random},
    inputBuffer: inputBuffer,
    renderCallback: renderFromSnapshot,
});

mainGame.initMainGameView();
keyboardInput.start();

export {
    mainGame,
    gameRuntime,
};
