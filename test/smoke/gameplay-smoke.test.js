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

const takeNextFrame = function (scheduledFrames) {
    const frameIds = Array.from(scheduledFrames.keys());
    expect(frameIds.length).toBeGreaterThan(0);

    const frameId = frameIds[0];
    const callback = scheduledFrames.get(frameId);
    scheduledFrames.delete(frameId);

    return {
        frameId: frameId,
        callback: callback,
    };
};

describe('gameplay smoke', () => {
    test('buffers input while moving, pausing, resuming, and restarting a match', () => {
        jest.resetModules();
        document.body.innerHTML = gameMarkup;

        const scheduledFrames = new Map();
        const cancelledFrames = new Set();
        let nextFrameId = 1;

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

        const {gameRuntime} = require('../../src/js/main/main.js');

        expect(document.querySelector('.game-countdown').textContent).toBe('60');
        expect(document.querySelector('.a-team').textContent).toBe('0');
        expect(document.querySelector('.b-team').textContent).toBe('0');
        expect(gameRuntime.getLifecycleState()).toBe('IDLE');

        document.querySelector('.start-button').click();
        expect(gameRuntime.getLifecycleState()).toBe('RUNNING');
        expect(gameRuntime.isRunning()).toBe(true);

        window.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowRight'}));
        window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyD'}));

        const stateBeforeStep = gameRuntime.getState();
        const aSnakeBefore = stateBeforeStep.snakes.find((snake) => snake.id === 'a-snake');
        const bSnakeBefore = stateBeforeStep.snakes.find((snake) => snake.id === 'b-snake');
        expect(aSnakeBefore.direction).toEqual({x: 0, y: 0});
        expect(bSnakeBefore.direction).toEqual({x: 0, y: 0});

        const initFrame = takeNextFrame(scheduledFrames);
        initFrame.callback(0);

        const stepFrame = takeNextFrame(scheduledFrames);
        stepFrame.callback(102);

        const stateAfterStep = gameRuntime.getState();
        const aSnakeAfter = stateAfterStep.snakes.find((snake) => snake.id === 'a-snake');
        const bSnakeAfter = stateAfterStep.snakes.find((snake) => snake.id === 'b-snake');
        expect(aSnakeAfter.direction).toEqual({x: 1, y: 0});
        expect(bSnakeAfter.direction).toEqual({x: 1, y: 0});
        expect(aSnakeAfter.body[0]).toEqual({x: 2, y: 1});
        expect(bSnakeAfter.body[0]).toEqual({x: 3, y: 9});
        expect(document.querySelector('.a-team').textContent).toBe('0');
        expect(document.querySelector('.b-team').textContent).toBe('0');
        expect(document.querySelectorAll('.a-snake-body')).toHaveLength(1);
        expect(document.querySelectorAll('.b-snake-body')).toHaveLength(1);
        expect(document.querySelectorAll('.mega-expand-food')).toHaveLength(1);
        expect(document.querySelectorAll('.general-expand-food')).toHaveLength(0);

        document.querySelector('.pause-button').click();
        expect(gameRuntime.getLifecycleState()).toBe('PAUSED');
        expect(gameRuntime.isRunning()).toBe(false);

        window.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowDown'}));
        window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyS'}));
        const stateWhilePaused = gameRuntime.getState();
        const aSnakePaused = stateWhilePaused.snakes.find((snake) => snake.id === 'a-snake');
        expect(aSnakePaused.body[0]).toEqual({x: 2, y: 1});

        document.querySelector('.start-button').click();
        expect(gameRuntime.getLifecycleState()).toBe('RUNNING');
        expect(gameRuntime.isRunning()).toBe(true);

        const resumeInitFrame = takeNextFrame(scheduledFrames);
        resumeInitFrame.callback(150);

        const resumeStepFrame = takeNextFrame(scheduledFrames);
        resumeStepFrame.callback(252);

        const stateAfterResume = gameRuntime.getState();
        const aSnakeResumed = stateAfterResume.snakes.find((snake) => snake.id === 'a-snake');
        expect(aSnakeResumed.body[0]).toEqual({x: 2, y: 2});

        document.querySelector('.pause-button').click();
        document.querySelector('.finish-button').click();
        expect(gameRuntime.getLifecycleState()).toBe('FINISHED');

        document.querySelector('.start-button').click();
        expect(gameRuntime.getLifecycleState()).toBe('RUNNING');

        const keydownRegistrations = addEventListenerSpy.mock.calls.filter(([eventName]) => {
            return eventName === 'keydown';
        });
        expect(keydownRegistrations).toHaveLength(1);
    });
});
