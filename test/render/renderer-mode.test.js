const {
    resolveRendererMode,
    updateRendererModeInUrl,
} = require('../../src/js/render/renderer-mode.js');

describe('renderer mode', () => {
    afterEach(() => {
        window.history.replaceState({}, '', '/');
    });

    test('uses DOM when the URL does not request a renderer', () => {
        expect(resolveRendererMode('')).toBe('dom');
    });

    test('reads Canvas mode from the URL', () => {
        expect(resolveRendererMode('?renderer=canvas')).toBe('canvas');
    });

    test('keeps other URL values while selecting Canvas', () => {
        window.history.replaceState({}, '', '/play?seed=12#game');

        updateRendererModeInUrl(window, 'canvas');

        expect(window.location.pathname).toBe('/play');
        expect(window.location.search).toBe('?seed=12&renderer=canvas');
        expect(window.location.hash).toBe('#game');
    });

    test('removes the renderer query when returning to default DOM mode', () => {
        window.history.replaceState({}, '', '/play?seed=12&renderer=canvas#game');

        updateRendererModeInUrl(window, 'dom');

        expect(window.location.pathname).toBe('/play');
        expect(window.location.search).toBe('?seed=12');
        expect(window.location.hash).toBe('#game');
    });
});
