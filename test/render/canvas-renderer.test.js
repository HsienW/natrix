const {CanvasRenderer} = require('../../src/js/render/canvas-renderer.js');

const createContext = function () {
    return {
        setTransform: jest.fn(),
        scale: jest.fn(),
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
    document.body.innerHTML = `
        <div id="game-world">
            <canvas id="game-canvas"></canvas>
        </div>
    `;
    const gameWorld = document.getElementById('game-world');
    const canvas = document.getElementById('game-canvas');
    gameWorld.getBoundingClientRect = jest.fn(() => ({
        width: displaySize,
        height: displaySize,
    }));
    canvas.getContext = jest.fn(() => context);
    return canvas;
};

const createRenderer = function (pixelRatio) {
    return new CanvasRenderer('game-canvas', {
        getPixelRatio: () => pixelRatio,
        ResizeObserver: null,
        window: null,
    });
};

describe('CanvasRenderer', () => {
    test('draws the legacy background, food, and living Snake segments', () => {
        const context = createContext();
        prepareCanvas(context);
        const renderer = createRenderer(1);

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
        const renderer = createRenderer(2);

        renderer.init({mapSize: 4});

        expect(canvas.width).toBe(240);
        expect(canvas.height).toBe(240);
        expect(canvas.style.width).toBe('120px');
        expect(canvas.style.height).toBe('120px');
        expect(context.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
        expect(context.scale).toHaveBeenCalledWith(2, 2);
    });

    test('updates the backing store when DPR changes between renders', () => {
        const context = createContext();
        const canvas = prepareCanvas(context);
        let pixelRatio = 1;
        const renderer = new CanvasRenderer('game-canvas', {
            getPixelRatio: () => pixelRatio,
            ResizeObserver: null,
            window: null,
        });

        renderer.init({mapSize: 4});
        expect(canvas.width).toBe(80);

        pixelRatio = 2;
        renderer.render(createSnapshot());

        expect(canvas.width).toBe(160);
        expect(canvas.height).toBe(160);
        expect(context.scale).toHaveBeenLastCalledWith(2, 2);
    });

    test('does not mutate the render snapshot', () => {
        const context = createContext();
        prepareCanvas(context);
        const renderer = createRenderer(1);
        const snapshot = createSnapshot();
        const originalSnapshot = JSON.parse(JSON.stringify(snapshot));

        renderer.init({mapSize: 4});
        renderer.render(snapshot, {alpha: 0.5});

        expect(snapshot).toEqual(originalSnapshot);
    });

    test('resizes from an explicit square viewport and resets the transform', () => {
        const context = createContext();
        const canvas = prepareCanvas(context);
        const renderer = createRenderer(2);
        renderer.init({mapSize: 4});

        renderer.resize({cssWidth: 100, cssHeight: 60, pixelRatio: 2});

        expect(canvas.width).toBe(120);
        expect(canvas.height).toBe(120);
        expect(canvas.style.width).toBe('60px');
        expect(context.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, 0, 0);
        expect(context.scale).toHaveBeenLastCalledWith(2, 2);
    });

    test('does not reallocate the backing store when its dimensions stay the same', () => {
        const context = createContext();
        const canvas = prepareCanvas(context);
        let backingWidth = 0;
        let backingHeight = 0;
        const setWidth = jest.fn((width) => {
            backingWidth = width;
        });
        const setHeight = jest.fn((height) => {
            backingHeight = height;
        });
        Object.defineProperty(canvas, 'width', {
            configurable: true,
            get: () => backingWidth,
            set: setWidth,
        });
        Object.defineProperty(canvas, 'height', {
            configurable: true,
            get: () => backingHeight,
            set: setHeight,
        });
        const renderer = createRenderer(2);

        renderer.init({mapSize: 4});
        renderer.resize({cssWidth: 80, cssHeight: 80, pixelRatio: 2});

        expect(setWidth).toHaveBeenCalledTimes(1);
        expect(setHeight).toHaveBeenCalledTimes(1);
        expect(context.setTransform).toHaveBeenCalledTimes(2);
        expect(context.scale).toHaveBeenCalledTimes(2);
    });

    test('skips drawing at zero size and recovers after a later resize', () => {
        const context = createContext();
        prepareCanvas(context, 0);
        const renderer = createRenderer(1);

        renderer.init({mapSize: 4});
        renderer.render(createSnapshot());

        expect(context.fillRect).not.toHaveBeenCalled();

        renderer.resize({cssWidth: 80, cssHeight: 80, pixelRatio: 1});
        renderer.render(createSnapshot());

        expect(context.fillRect).toHaveBeenCalled();
    });

    test('destroy clears the Canvas and remains safe when called again', () => {
        const context = createContext();
        prepareCanvas(context);
        const renderer = createRenderer(1);
        renderer.init({mapSize: 4});

        renderer.destroy();

        expect(context.clearRect).toHaveBeenCalledWith(0, 0, 80, 80);
        expect(() => renderer.destroy()).not.toThrow();
    });
});
