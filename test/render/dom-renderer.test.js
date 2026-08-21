const {DOMRenderer} = require('../../src/js/render/dom-renderer.js');

const createSnapshot = function () {
    return {
        food: [
            {
                id: 'food-0',
                position: {x: 5, y: 6},
                style: 'general-expand-food',
            },
        ],
        snakes: [
            {
                id: 'a-snake',
                alive: true,
                body: [{x: 2, y: 3}, {x: 1, y: 3}],
                style: 'a-snake-body',
            },
            {
                id: 'b-snake',
                alive: false,
                body: [{x: 9, y: 9}],
                style: 'b-snake-body',
            },
        ],
    };
}

describe('DOMRenderer', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="game-map"></div>';
    });

    test('renders food and living Snake nodes with legacy classes and grid positions', () => {
        const renderer = new DOMRenderer('game-map');
        renderer.init({mapSize: 41});

        renderer.render(createSnapshot(), {alpha: 0});

        const foodElement = document.querySelector('.general-expand-food');
        const snakeElements = document.querySelectorAll('.a-snake-body');

        expect(foodElement.style.gridColumnStart).toBe('5');
        expect(foodElement.style.gridRowStart).toBe('6');
        expect(snakeElements).toHaveLength(2);
        expect(snakeElements[0].style.gridColumnStart).toBe('2');
        expect(snakeElements[0].style.gridRowStart).toBe('3');
        expect(document.querySelectorAll('.b-snake-body')).toHaveLength(0);
    });

    test('replaces stale world nodes when rendering the next snapshot', () => {
        const renderer = new DOMRenderer('game-map');
        renderer.init({mapSize: 41});
        renderer.render(createSnapshot(), {alpha: 0});

        renderer.render({food: [], snakes: []}, {alpha: 0});

        expect(document.getElementById('game-map').children).toHaveLength(0);
    });

    test('fails clearly when the game map is missing', () => {
        document.body.innerHTML = '';
        const renderer = new DOMRenderer('game-map');

        expect(() => renderer.init({mapSize: 41})).toThrow('DOMRenderer could not find #game-map.');
    });

    test('destroy clears world nodes and remains safe when called again', () => {
        const renderer = new DOMRenderer('game-map');
        renderer.init({mapSize: 41});
        renderer.render(createSnapshot(), {alpha: 0});

        renderer.destroy();

        expect(document.getElementById('game-map').children).toHaveLength(0);
        expect(() => renderer.destroy()).not.toThrow();
    });
});
