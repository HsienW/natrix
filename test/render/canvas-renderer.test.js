const {CanvasRenderer} = require('../../src/js/render/canvas-renderer.js');

const createContext = function () {
    return {
        setTransform: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        clearRect: jest.fn(),
        fillStyle: null,
        strokeStyle: null,
    };
};

const createSnapshot = function () {
    return {
        mapSize: 4,
        food: [
            {
                position: {x: 4, y: 1},
                style: 'mega-expand-food',
            },
        ],
        snakes: [
            {
                alive: true,
                body: [{x: 2, y: 3}],
                style: 'a-snake-body',
            },
            {
                alive: false,
                body: [{x: 1, y: 1}],
                style: 'b-snake-body',
            },
        ],
    };
};

const prepareCanvas = function (context, displaySize = 80) {
    document.body.innerHTML = '<canvas id="game-canvas"></canvas>';
    const canvas = document.getElementById('game-canvas');
    canvas.getContext = jest.fn(() => context);
    canvas.getBoundingClientRect = jest.fn(() => ({
        width: displaySize,
        height: displaySize,
    }));
    return canvas;
};

describe('CanvasRenderer', () => {
    test('draws the legacy background, food, and living Snake segments', () => {
        const context = createContext();
        prepareCanvas(context);
        const renderer = new CanvasRenderer('game-canvas', {
            getPixelRatio: () => 1,
        });

        renderer.init({mapSize: 4});
        renderer.render(createSnapshot(), {alpha: 0});

        expect(context.fillRect).toHaveBeenNthCalledWith(1, 0, 0, 80, 80);
        expect(context.fillRect).toHaveBeenNthCalledWith(2, 20, 40, 20, 20);
        expect(context.strokeRect).toHaveBeenCalledWith(20, 40, 20, 20);
        expect(context.arc).toHaveBeenCalledWith(70, 10, 10, 0, Math.PI * 2);
        expect(context.fillRect).toHaveBeenCalledTimes(2);
    });

    test('uses DPR for the backing store without changing the logical CSS size', () => {
        const context = createContext();
        const canvas = prepareCanvas(context, 120);
        const renderer = new CanvasRenderer('game-canvas', {
            getPixelRatio: () => 2,
        });

        renderer.init({mapSize: 4});

        expect(canvas.width).toBe(240);
        expect(canvas.height).toBe(240);
        expect(canvas.style.width).toBe('120px');
        expect(canvas.style.height).toBe('120px');
        expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    });

    test('does not mutate the render snapshot', () => {
        const context = createContext();
        prepareCanvas(context);
        const renderer = new CanvasRenderer('game-canvas', {
            getPixelRatio: () => 1,
        });
        const snapshot = createSnapshot();
        const originalSnapshot = JSON.parse(JSON.stringify(snapshot));

        renderer.init({mapSize: 4});
        renderer.render(snapshot, {alpha: 0.5});

        expect(snapshot).toEqual(originalSnapshot);
    });

    test('resizes from an explicit square viewport and resets the transform', () => {
        const context = createContext();
        const canvas = prepareCanvas(context);
        const renderer = new CanvasRenderer('game-canvas', {
            getPixelRatio: () => 2,
        });
        renderer.init({mapSize: 4});

        renderer.resize({width: 100, height: 60});

        expect(canvas.width).toBe(120);
        expect(canvas.height).toBe(120);
        expect(canvas.style.width).toBe('60px');
        expect(context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
    });

    test('destroy clears the Canvas and remains safe when called again', () => {
        const context = createContext();
        prepareCanvas(context);
        const renderer = new CanvasRenderer('game-canvas', {
            getPixelRatio: () => 1,
        });
        renderer.init({mapSize: 4});

        renderer.destroy();

        expect(context.clearRect).toHaveBeenCalledWith(0, 0, 80, 80);
        expect(() => renderer.destroy()).not.toThrow();
    });
});
