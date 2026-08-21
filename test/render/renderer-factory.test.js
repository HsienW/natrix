const {CanvasRenderer} = require('../../src/js/render/canvas-renderer.js');
const {DOMRenderer} = require('../../src/js/render/dom-renderer.js');
const {createWorldRenderer} = require('../../src/js/render/renderer-factory.js');

describe('renderer factory', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-map"></div>
            <canvas id="game-canvas" hidden></canvas>
        `;
    });

    test('uses DOM rendering by default', () => {
        const selection = createWorldRenderer({
            document: document,
            search: '',
        });

        expect(selection.mode).toBe('dom');
        expect(selection.renderer).toBeInstanceOf(DOMRenderer);
        expect(document.getElementById('game-map').hidden).toBe(false);
        expect(document.getElementById('game-canvas').hidden).toBe(true);
    });

    test('selects Canvas rendering from the query string', () => {
        const selection = createWorldRenderer({
            document: document,
            search: '?renderer=canvas',
        });

        expect(selection.mode).toBe('canvas');
        expect(selection.renderer).toBeInstanceOf(CanvasRenderer);
        expect(document.getElementById('game-map').hidden).toBe(true);
        expect(document.getElementById('game-canvas').hidden).toBe(false);
    });

    test('falls back to DOM and reports an invalid renderer mode', () => {
        const reportDiagnostic = jest.fn();

        const selection = createWorldRenderer({
            document: document,
            search: '?renderer=unknown',
            reportDiagnostic: reportDiagnostic,
        });

        expect(selection.mode).toBe('dom');
        expect(selection.renderer).toBeInstanceOf(DOMRenderer);
        expect(reportDiagnostic).toHaveBeenCalledWith(
            'Unknown renderer mode "unknown". Falling back to DOM.',
        );
    });
});
