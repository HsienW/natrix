/** Mediator Pattern **/
import {mainGame} from './main.js';
import {mainGameTimeType} from '../main-config/main-game-time.js';

// mainView 負責管理遊戲 DOM 的顯示操作。
const mainView = (function () {
    let controlButtonsDom = null;
    let countdownDom = null;
    let aTeamScoreDom = null;
    let bTeamScoreDom = null;
    const operations = {};

    operations.initControlButtonsDom = function () {
        controlButtonsDom = document.getElementsByClassName('control-button')[0];
        mainGame.startButton = controlButtonsDom.querySelector('.start-button');
        mainGame.pauseButton = controlButtonsDom.querySelector('.pause-button');
        mainGame.finishButton = controlButtonsDom.querySelector('.finish-button');
    }

    operations.initCountdownDom = function () {
        countdownDom = document.getElementsByClassName('game-countdown')[0];
        countdownDom.innerHTML = '<div>' + mainGameTimeType.short() + '</div>';
    }

    operations.initTeamScoreDom = function () {
        aTeamScoreDom = document.getElementsByClassName('a-team')[0];
        bTeamScoreDom = document.getElementsByClassName('b-team')[0];
        aTeamScoreDom.innerHTML = '<div>0</div>';
        bTeamScoreDom.innerHTML = '<div>0</div>';
    }

    operations.updateCountdownDom = function (value) {
        countdownDom.innerHTML = '<div>' + value + '</div>';
    }

    operations.updateATeamScoreDom = function (value) {
        aTeamScoreDom.innerHTML = '<div>' + value + '</div>';
    }

    operations.updateBTeamScoreDom = function (value) {
        bTeamScoreDom.innerHTML = '<div>' + value + '</div>';
    }

    // 提供 mediator 共用的 action dispatch 介面。
    const callAction = function () {
        const action = Array.prototype.shift.call(arguments);
        operations[action].apply(this, arguments);
    }

    return {
        callAction: callAction,
    };
})();

export {
    mainView,
}
