import {mainView} from './main-view.js';

const mainGameCountdown = (function () {
    let durationMs = 0;
    let elapsedMs = 0;
    let displayedSeconds = null;
    let finished = false;
    const operations = {};

    operations.countdownInit = function (countdownFinishNumber) {
        durationMs = countdownFinishNumber * 1000;
        elapsedMs = 0;
        displayedSeconds = countdownFinishNumber;
        finished = false;
    };

    operations.advance = function (stepMs) {
        if (finished) {
            return false;
        }

        elapsedMs = Math.min(elapsedMs + stepMs, durationMs);
        const remainingSeconds = Math.ceil((durationMs - elapsedMs) / 1000);

        if (remainingSeconds !== displayedSeconds) {
            displayedSeconds = remainingSeconds;
            mainView.callAction('updateCountdownDom', displayedSeconds);
        }

        finished = elapsedMs >= durationMs;
        return finished;
    };

    const getData = function () {
        const action = Array.prototype.shift.call(arguments);
        return operations[action].apply(this, arguments);
    };

    const countdownAction = function () {
        const action = Array.prototype.shift.call(arguments);
        return operations[action].apply(this, arguments);
    };

    return {
        getData: getData,
        countdownAction: countdownAction,
    };
})();

export {
    mainGameCountdown,
};
