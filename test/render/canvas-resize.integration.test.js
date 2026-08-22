const {CanvasRenderer} = require('../../src/js/render/canvas-renderer.js');
const {DOMRenderer} = require('../../src/js/render/dom-renderer.js');
const {RendererHost} = require('../../src/js/render/renderer-host.js');

describe('Canvas resize lifecycle', () => {
    test('renderer swaps do not leave active resize observers behind', () => {
        document.body.innerHTML = `
            <div id="game-world">
                <div id="game-map"></div>
                <canvas id="game-canvas"></canvas>
            </div>
        `;
        const gameWorld = document.getElementById('game-world');
        const canvas = document.getElementById('game-canvas');
        const context = {
            setTransform: jest.fn(),
            scale: jest.fn(),
            clearRect: jest.fn(),
        };
        const observers = [];
        const ResizeObserver = jest.fn(function () {
            const observer = {
                observe: jest.fn(),
                disconnect: jest.fn(),
            };
            observers.push(observer);
            return observer;
        });
        let displaySize = 0;
        gameWorld.getBoundingClientRect = jest.fn(() => ({
            width: displaySize,
            height: displaySize,
        }));
        canvas.getContext = jest.fn(() => context);

        const canvasRenderer = new CanvasRenderer('game-canvas', {
            getPixelRatio: () => 2,
            ResizeObserver: ResizeObserver,
        });
        const domRenderer = new DOMRenderer('game-map');
        const host = new RendererHost(canvasRenderer);

        host.init({mapSize: 41});
        host.setRenderer(domRenderer);
        displaySize = 320;
        host.setRenderer(canvasRenderer);

        expect(canvas.width).toBe(640);
        expect(canvas.height).toBe(640);

        host.destroy();

        expect(observers).toHaveLength(2);
        expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
        expect(observers[1].disconnect).toHaveBeenCalledTimes(1);
    });
});
