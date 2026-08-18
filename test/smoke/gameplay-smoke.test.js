const gameMarkup = `
    <div>
        <div class="game-control-area area-margin-bottom">
            <div class="team-scoreboard a-team"></div>
            <div class="game-countdown"></div>
            <div class="team-scoreboard b-team"></div>
        </div>
        <div id="game-map"></div>
        <div class="game-control-area area-margin-top">
            <div class="team"></div>
            <div class="control-button">
                <div class="button start-button">Start</div>
                <div class="button pause-button">Pause</div>
                <div class="button finish-button">Finish</div>
            </div>
            <div class="team"></div>
        </div>
    </div>
`;

describe('legacy gameplay smoke', () => {
    test('buffers input while moving, pausing, resuming, and restarting a match', () => {
        jest.resetModules();
        document.body.innerHTML = gameMarkup;

        const scheduledFrames = new Map();
        const cancelledFrames = new Set();
        let nextFrameId = 1;

        jest.spyOn(Math, 'random').mockReturnValue(0);
        global.confirm = jest.fn(() => true);
        global.requestAnimationFrame = jest.fn((callback) => {
            const frameId = nextFrameId++;
            scheduledFrames.set(frameId, callback);
            return frameId;
        });
        global.cancelAnimationFrame = jest.fn((frameId) => {
            cancelledFrames.add(frameId);
            scheduledFrames.delete(frameId);
        });
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        const runFrame = (frameId, timestamp) => {
            const callback = scheduledFrames.get(frameId);
            expect(callback).toEqual(expect.any(Function));
            scheduledFrames.delete(frameId);
            callback(timestamp);
        };

        const {mainGame} = require('../../src/js/main/main.js');
        const {gameStartState, gamePauseState, gameFinishState} = require('../../src/js/main/main-game-state.js');
        const {roleItemMediator} = require('../../src/js/mediator/role-item-mediator.js');

        expect(document.querySelector('.game-countdown').textContent).toBe('60');
        expect(document.querySelector('.a-team').textContent).toBe('0');
        expect(document.querySelector('.b-team').textContent).toBe('0');

        document.querySelector('.start-button').click();
        expect(mainGame.currentState).toBe(gameStartState);

        const snakes = roleItemMediator.getData('getAllSnake');
        window.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowRight'}));
        window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyD'}));
        expect(snakes['a-team'][0].getSnakeDirection()).toEqual({x: 0, y: 0});
        expect(snakes['b-team'][0].getSnakeDirection()).toEqual({x: 0, y: 0});

        runFrame(1, 102);
        runFrame(2, 0);

        expect(snakes['a-team'][0].getSnakeDirection()).toEqual({x: 1, y: 0});
        expect(snakes['b-team'][0].getSnakeDirection()).toEqual({x: 1, y: 0});
        expect(snakes['a-team'][0].getSnakeHeadPosition()).toEqual({x: 2, y: 1});
        expect(snakes['b-team'][0].getSnakeHeadPosition()).toEqual({x: 2, y: 1});
        expect(document.querySelector('.a-team').textContent).toBe('1');
        expect(document.querySelector('.b-team').textContent).toBe('1');
        expect(document.querySelectorAll('.a-snake-body')).toHaveLength(2);
        expect(document.querySelectorAll('.b-snake-body')).toHaveLength(2);
        expect(document.querySelectorAll('.general-expand-food')).toHaveLength(1);

        document.querySelector('.pause-button').click();
        expect(mainGame.currentState).toBe(gamePauseState);
        expect(cancelledFrames).toEqual(new Set([3, 4]));

        window.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowDown'}));
        window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyS'}));
        expect(snakes['a-team'][0].getSnakeHeadPosition()).toEqual({x: 2, y: 1});
        expect(snakes['b-team'][0].getSnakeHeadPosition()).toEqual({x: 2, y: 1});

        document.querySelector('.start-button').click();
        expect(mainGame.currentState).toBe(gameStartState);
        expect(global.requestAnimationFrame).toHaveBeenCalledTimes(6);
        runFrame(5, 202);
        expect(snakes['a-team'][0].getSnakeHeadPosition()).toEqual({x: 2, y: 2});
        expect(snakes['b-team'][0].getSnakeHeadPosition()).toEqual({x: 2, y: 2});

        document.querySelector('.pause-button').click();
        document.querySelector('.finish-button').click();
        expect(mainGame.currentState).toBe(gameFinishState);

        document.querySelector('.start-button').click();
        const keydownRegistrations = addEventListenerSpy.mock.calls.filter(([eventName]) => {
            return eventName === 'keydown';
        });
        expect(keydownRegistrations).toHaveLength(1);
    });
});
