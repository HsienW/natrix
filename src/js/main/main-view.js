/** Mediator Pattern **/
import {mainGame} from './main.js';

// mainViewMediator 負責中介管理遊戲 control dom 相關的行為
// 例如: bind control dom 相關的操作等等...
const mainView = (function () {
    let controlButtonsDom = null;
    const operations = {};

    operations.initControlButtonsDom = function () {
        controlButtonsDom = document.getElementsByClassName('control-button')[0];
        mainGame.startButton = controlButtonsDom.querySelector('.start-button');
        mainGame.pauseButton = controlButtonsDom.querySelector('.pause-button');
        mainGame.finishButton = controlButtonsDom.querySelector('.finish-button');
    }

    operations.initRendererModeDom = function () {
        mainGame.rendererModeSelect = document.querySelector('.renderer-mode-select');
    }

    // 處理呼叫參數的介面
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
