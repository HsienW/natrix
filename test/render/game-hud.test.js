const {GameHud} = require('../../src/js/render/game-hud.js');

const hudMarkup = `
    <div class="a-team"></div>
    <div class="game-countdown"></div>
    <div class="b-team"></div>
    <div class="game-status"></div>
`;

describe('GameHud', () => {
    beforeEach(() => {
        document.body.innerHTML = hudMarkup;
    });

    test('initializes countdown and team scores from runtime config', () => {
        const gameHud = new GameHud();

        gameHud.init({durationTicks: 600, tickRate: 10});

        expect(document.querySelector('.game-countdown').textContent).toBe('60');
        expect(document.querySelector('.a-team').textContent).toBe('0');
        expect(document.querySelector('.b-team').textContent).toBe('0');
    });

    test('updates score, countdown, and winner status from a snapshot', () => {
        const gameHud = new GameHud();
        gameHud.init({durationTicks: 600, tickRate: 10});

        gameHud.render({
            remainingSeconds: 42,
            score: {blue: 3, red: 2},
            finished: true,
            winner: 'a-team',
        });

        expect(document.querySelector('.game-countdown').textContent).toBe('42');
        expect(document.querySelector('.a-team').textContent).toBe('3');
        expect(document.querySelector('.b-team').textContent).toBe('2');
        expect(document.querySelector('.game-status').textContent).toBe('a-team is winner!');
    });

    test('keeps the optional status element empty while the match is active', () => {
        const gameHud = new GameHud();
        gameHud.init({durationTicks: 600, tickRate: 10});

        gameHud.render({
            remainingSeconds: 59,
            score: {blue: 0, red: 0},
            finished: false,
            winner: null,
        });

        expect(document.querySelector('.game-status').textContent).toBe('');
    });

    test('fails clearly when a required HUD element is missing', () => {
        document.querySelector('.game-countdown').remove();
        const gameHud = new GameHud();

        expect(() => gameHud.init({durationTicks: 600, tickRate: 10}))
            .toThrow('GameHud could not find the countdown element.');
    });

    test('destroy releases DOM references and remains safe when called again', () => {
        const gameHud = new GameHud();
        gameHud.init({durationTicks: 600, tickRate: 10});

        gameHud.destroy();

        expect(() => gameHud.destroy()).not.toThrow();
        expect(() => gameHud.render({})).toThrow('GameHud must be initialized before rendering.');
    });
});
