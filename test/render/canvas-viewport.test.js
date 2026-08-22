const {CanvasViewport} = require('../../src/js/render/canvas-viewport.js');

const createElement = function (width, height) {
    return {
        getBoundingClientRect: jest.fn(() => ({
            width: width,
            height: height,
        })),
    };
};

describe('CanvasViewport', () => {
    test('reports CSS dimensions and the current DPR', () => {
        const element = createElement(640, 480);
        const onResize = jest.fn();
        const viewport = new CanvasViewport(element, onResize, {
            getPixelRatio: () => 2,
            ResizeObserver: null,
            window: null,
        });

        viewport.start();

        expect(onResize).toHaveBeenCalledWith({
            cssWidth: 640,
            cssHeight: 480,
            pixelRatio: 2,
        });
    });

    test('observes the container and disconnects exactly once', () => {
        const element = createElement(320, 320);
        const observer = {
            observe: jest.fn(),
            disconnect: jest.fn(),
        };
        const ResizeObserver = jest.fn(() => observer);
        const viewport = new CanvasViewport(element, jest.fn(), {
            ResizeObserver: ResizeObserver,
            window: null,
        });

        viewport.start();
        viewport.destroy();
        viewport.destroy();

        expect(observer.observe).toHaveBeenCalledWith(element);
        expect(observer.disconnect).toHaveBeenCalledTimes(1);
    });

    test('uses one window resize listener when ResizeObserver is unavailable', () => {
        const element = createElement(320, 320);
        const windowObject = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        };
        const viewport = new CanvasViewport(element, jest.fn(), {
            ResizeObserver: null,
            window: windowObject,
        });

        viewport.start();
        viewport.start();
        viewport.destroy();
        viewport.destroy();

        expect(windowObject.addEventListener).toHaveBeenCalledTimes(1);
        expect(windowObject.addEventListener).toHaveBeenCalledWith('resize', viewport.handleResize);
        expect(windowObject.removeEventListener).toHaveBeenCalledTimes(1);
        expect(windowObject.removeEventListener).toHaveBeenCalledWith('resize', viewport.handleResize);
    });

    test('reports a changed DPR even when the CSS size stays the same', () => {
        const element = createElement(320, 320);
        const onResize = jest.fn();
        let pixelRatio = 1;
        const viewport = new CanvasViewport(element, onResize, {
            getPixelRatio: () => pixelRatio,
            ResizeObserver: null,
            window: null,
        });

        viewport.start();
        pixelRatio = 2;
        viewport.refresh();

        expect(onResize).toHaveBeenLastCalledWith({
            cssWidth: 320,
            cssHeight: 320,
            pixelRatio: 2,
        });
    });
});
