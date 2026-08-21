const {RendererHost} = require('../../src/js/render/renderer-host.js');

const createRenderer = function (name, calls) {
    return {
        init: jest.fn(() => calls.push(name + ':init')),
        render: jest.fn(() => calls.push(name + ':render')),
        resize: jest.fn(() => calls.push(name + ':resize')),
        destroy: jest.fn(() => calls.push(name + ':destroy')),
    };
};

describe('RendererHost', () => {
    test('initializes its renderer exactly once', () => {
        const calls = [];
        const renderer = createRenderer('renderer', calls);
        const host = new RendererHost(renderer);

        host.init({mapSize: 41});
        host.init({mapSize: 100});

        expect(renderer.init).toHaveBeenCalledTimes(1);
        expect(renderer.init).toHaveBeenCalledWith({mapSize: 41});
    });

    test('destroys the old renderer before initializing and rendering the replacement', () => {
        const calls = [];
        const firstRenderer = createRenderer('first', calls);
        const secondRenderer = createRenderer('second', calls);
        const host = new RendererHost(firstRenderer);

        host.init({mapSize: 41});
        host.render({tick: 0}, {alpha: 0});
        host.setRenderer(secondRenderer);
        host.render({tick: 1}, {alpha: 0.5});

        expect(calls).toEqual([
            'first:init',
            'first:render',
            'first:destroy',
            'second:init',
            'second:render',
        ]);
    });

    test('forwards resize and destroys the active renderer once', () => {
        const calls = [];
        const renderer = createRenderer('renderer', calls);
        const host = new RendererHost(renderer);
        const viewport = {width: 640, height: 640};

        host.init({mapSize: 41});
        host.resize(viewport);
        host.destroy();
        host.destroy();

        expect(renderer.resize).toHaveBeenCalledWith(viewport);
        expect(renderer.destroy).toHaveBeenCalledTimes(1);
    });
});
