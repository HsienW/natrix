const GameHud = function () {
    this.countdownDom = null;
    this.aTeamScoreDom = null;
    this.bTeamScoreDom = null;
    this.statusDom = null;
}

GameHud.prototype.findRequiredElement = function (selector, description) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error('GameHud could not find the ' + description + ' element.');
    }

    return element;
}

GameHud.prototype.updateValue = function (element, value) {
    element.innerHTML = '<div>' + value + '</div>';
}

GameHud.prototype.init = function (config) {
    if (typeof document === 'undefined') {
        throw new Error('GameHud requires a browser document.');
    }

    this.countdownDom = this.findRequiredElement('.game-countdown', 'countdown');
    this.aTeamScoreDom = this.findRequiredElement('.a-team', 'A team score');
    this.bTeamScoreDom = this.findRequiredElement('.b-team', 'B team score');
    this.statusDom = document.querySelector('.game-status');

    const remainingSeconds = Math.ceil(config.durationTicks / config.tickRate);
    this.updateValue(this.countdownDom, remainingSeconds);
    this.updateValue(this.aTeamScoreDom, 0);
    this.updateValue(this.bTeamScoreDom, 0);
}

GameHud.prototype.renderStatus = function (snapshot) {
    if (!this.statusDom) {
        return;
    }

    if (!snapshot.finished) {
        this.statusDom.textContent = '';
        return;
    }

    const winnerName = snapshot.winner || 'No one';
    this.statusDom.textContent = winnerName + ' is winner!';
}

GameHud.prototype.render = function (snapshot) {
    if (!this.countdownDom || !this.aTeamScoreDom || !this.bTeamScoreDom) {
        throw new Error('GameHud must be initialized before rendering.');
    }

    this.updateValue(this.countdownDom, snapshot.remainingSeconds);
    this.updateValue(this.aTeamScoreDom, snapshot.score.blue);
    this.updateValue(this.bTeamScoreDom, snapshot.score.red);
    this.renderStatus(snapshot);
}

GameHud.prototype.resize = function () {}

GameHud.prototype.destroy = function () {
    this.countdownDom = null;
    this.aTeamScoreDom = null;
    this.bTeamScoreDom = null;
    this.statusDom = null;
}

export {
    GameHud,
}
