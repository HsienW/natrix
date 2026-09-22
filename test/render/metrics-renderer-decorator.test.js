const {
    MetricsRendererDecorator,
    countRenderedEntities,
} = require('../../src/js/render/metrics-renderer-decorator.js');

const createRenderer = function () {
    return {
        init: jest.fn(),
        render: jest.fn(),
        resize: jest.fn(),
        destroy: jest.fn(),
    };
};

describe('MetricsRendererDecorator', () => {
    test('measures render duration and counts visible entities', () => {
        const renderer = createRenderer();
        const metrics = {
            recordRender: jest.fn(),
            recordEntityCount: jest.fn(),
        };
        const times = [20, 27];
        const decorator = new MetricsRendererDecorator(renderer, metrics, () => times.shift());
        const snapshot = {
            food: [{id: 'food-1'}],
            snakes: [
                {alive: true, body: [{x: 1, y: 1}, {x: 2, y: 1}]},
                {alive: false, body: [{x: 3, y: 1}]},
            ],
        };
        const meta = {alpha: 0.5};

        decorator.render(snapshot, meta);

        expect(renderer.render).toHaveBeenCalledWith(snapshot, meta);
        expect(metrics.recordRender).toHaveBeenCalledWith(7);
        expect(metrics.recordEntityCount).toHaveBeenCalledWith(3);
    });

    test('delegates renderer lifecycle methods', () => {
        const renderer = createRenderer();
        const decorator = new MetricsRendererDecorator(renderer, {
            recordRender: jest.fn(),
            recordEntityCount: jest.fn(),
        });
        const config = {mapSize: 41};
        const viewport = {width: 640, height: 640};

        decorator.init(config);
        decorator.resize(viewport);
        decorator.destroy();

        expect(renderer.init).toHaveBeenCalledWith(config);
        expect(renderer.resize).toHaveBeenCalledWith(viewport);
        expect(renderer.destroy).toHaveBeenCalledTimes(1);
    });

    test('counts empty and missing render collections safely', () => {
        expect(countRenderedEntities(null)).toBe(0);
        expect(countRenderedEntities({})).toBe(0);
        expect(countRenderedEntities({food: [], snakes: []})).toBe(0);
    });

    test('does not stop rendering when metrics fail', () => {
        const renderer = createRenderer();
        const decorator = new MetricsRendererDecorator(renderer, {
            recordRender: function () {
                throw new Error('metrics failed');
            },
            recordEntityCount: jest.fn(),
        }, () => 10);

        expect(() => decorator.render({}, {})).not.toThrow();
        expect(renderer.render).toHaveBeenCalledTimes(1);
    });

    test('preserves the renderer error when metrics also fail', () => {
        const renderer = createRenderer();
        const rendererError = new Error('renderer failed');
        renderer.render.mockImplementation(() => {
            throw rendererError;
        });
        const decorator = new MetricsRendererDecorator(renderer, {
            recordRender: function () {
                throw new Error('metrics failed');
            },
            recordEntityCount: jest.fn(),
        }, () => 10);

        expect(() => decorator.render({}, {})).toThrow(rendererError);
    });
});
