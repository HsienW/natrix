/**
 * @typedef {Object} Renderer
 * @property {function(Object): void} init
 * @property {function(Object, Object): void} render
 * @property {function(Object): void} resize
 * @property {function(): void} destroy
 */

const RENDERER_METHODS = [
    'init',
    'render',
    'resize',
    'destroy',
];

const assertRenderer = function (renderer) {
    if (!renderer || typeof renderer !== 'object' || Array.isArray(renderer)) {
        throw new TypeError('Renderer must be an object.');
    }

    for (const methodName of RENDERER_METHODS) {
        if (typeof renderer[methodName] !== 'function') {
            throw new TypeError('Renderer requires a ' + methodName + ' method.');
        }
    }

    return renderer;
};

export {
    assertRenderer,
};
