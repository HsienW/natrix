/** Application Bootstrap **/

import {mainView} from './main-view.js';
import {keyboardInput} from '../input/keyboard-input.js';
import {inputBuffer} from '../input/input-buffer.js';
import {GameRuntime} from '../runtime/game-runtime.js';
import {RUNTIME_ACTIONS, RUNTIME_STATES} from '../runtime/runtime-state.js';
import {createWorldRenderer} from '../render/renderer-factory.js';
import {updateRendererModeInUrl} from '../render/renderer-mode.js';
import {RendererHost} from '../render/renderer-host.js';
import {GameHud} from '../render/game-hud.js';
import {noticeConfirm} from '../common/notice.js';
import '../../style/reset.css';
import '../../style/main.css';
import '../../style/role.css';
import '../../style/team.css';

const Main = function () {
    this.startButton = null;
    this.pauseButton = null;
    this.finishButton = null;
    this.rendererModeSelect = null;
}

Main.prototype.initMainGameView = function () {
    mainView.callAction('initControlButtonsDom');
    mainView.callAction('initRendererModeDom');
}

const mainGame = new Main();
const rendererSelection = createWorldRenderer({
    search: window.location.search,
});
const worldRendererHost = new RendererHost(rendererSelection.renderer);
const gameHud = new GameHud();

const browserRenderer = {
    init: function (config) {
        worldRendererHost.init(config);
        gameHud.init(config);
    },
    render: function (snapshot, meta) {
        worldRendererHost.render(snapshot, meta);
        gameHud.render(snapshot);
    },
    resize: function (viewport) {
        worldRendererHost.resize(viewport);
        gameHud.resize(viewport);
    },
    destroy: function () {
        worldRendererHost.destroy();
        gameHud.destroy();
    },
};

const handleGameEvent = function (event) {
    if (event.type !== 'MATCH_FINISHED') {
        return;
    }

    const winnerName = event.winner || 'No one';
    noticeConfirm(winnerName + ' is winner!');
};

/** State Pattern **/
// 設定初始狀態
const gameRuntime = new GameRuntime({
    config: {mapSize: 41, tickRate: 10, durationTicks: 600, seed: 0},
    inputBuffer: inputBuffer,
    renderer: browserRenderer,
    eventCallback: handleGameEvent,
});

mainGame.initMainGameView();
mainGame.rendererModeSelect.value = rendererSelection.mode;

let currentRendererMode = rendererSelection.mode;

const changeRendererMode = function (requestedMode) {
    const nextSelection = createWorldRenderer({
        mode: requestedMode,
    });

    if (nextSelection.mode === currentRendererMode) {
        mainGame.rendererModeSelect.value = currentRendererMode;
        return;
    }

    worldRendererHost.setRenderer(nextSelection.renderer);
    worldRendererHost.render(gameRuntime.getSnapshot(), {
        alpha: 0,
        frameTimestamp: null,
    });

    currentRendererMode = nextSelection.mode;
    mainGame.rendererModeSelect.value = currentRendererMode;
    updateRendererModeInUrl(window, currentRendererMode);
};

// 綁定每個狀態之下的 click event
// 將初始化取得的 main 實例的參照, 保存在 mainGame 常數中,
// 以防 onclick event 發生時 this 指向被修改成 button dom
// 將每個 button 點擊後對應要做的事, 委託出去給 GameRuntime 的 lifecycle handler
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

mainGame.rendererModeSelect.onchange = function () {
    changeRendererMode(this.value);
};

keyboardInput.start();

export {
    mainGame,
    gameRuntime,
};
