/** @jest-environment node */

const {assertRenderer} = require('../../src/js/render/renderer.js');
const {NullRenderer} = require('../../src/js/render/null-renderer.js');
const {GameRuntime} = require('../../src/js/runtime/game-runtime.js');
const {InputBuffer} = require('../../src/js/input/input-buffer.js');

const createRenderer = function () {
    return {
        init: jest.fn(),
        render: jest.fn(),
        resize: jest.fn(),
        destroy: jest.fn(),
    };
};

describe('renderer contract', () => {
    test('accepts an object with all required renderer methods', () => {
        const renderer = createRenderer();

        expect(assertRenderer(renderer)).toBe(renderer);
    });

    test('rejects missing or incomplete renderer objects', () => {
        expect(() => assertRenderer(null)).toThrow(TypeError);
        expect(() => assertRenderer({
            init: jest.fn(),
            render: jest.fn(),
            resize: jest.fn(),
        })).toThrow(TypeError);
    });

    test('NullRenderer satisfies the contract without browser APIs', () => {
        const renderer = new NullRenderer();

        expect(assertRenderer(renderer)).toBe(renderer);
        expect(() => renderer.init({mapSize: 41})).not.toThrow();
        expect(() => renderer.render({tick: 0}, {alpha: 0})).not.toThrow();
        expect(() => renderer.resize({width: 640, height: 640})).not.toThrow();
        expect(() => renderer.destroy()).not.toThrow();
    });

    test('default NullRenderer keeps GameRuntime headless', () => {
        expect(typeof document).toBe('undefined');
        expect(typeof window).toBe('undefined');

        const runtime = new GameRuntime({
            config: {mapSize: 41, tickRate: 10, durationTicks: 20, seed: 7},
            inputBuffer: new InputBuffer(),
        });

        runtime.handleUpdate();
        runtime.handleRender(0.5, 100);

        expect(runtime.getState().tick).toBe(1);
        expect(runtime.getSnapshot().tick).toBe(1);
    });
});
