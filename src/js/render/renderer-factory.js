import {CanvasRenderer} from './canvas-renderer.js';
import {DOMRenderer} from './dom-renderer.js';
import {
    RENDERER_MODES,
    reportRendererDiagnostic,
    resolveRequestedRendererMode,
    resolveRendererMode,
} from './renderer-mode.js';

const updateWorldVisibility = function (documentObject, mode, domElementId, canvasElementId) {
    const domElement = documentObject.getElementById(domElementId);
    const canvasElement = documentObject.getElementById(canvasElementId);

    if (domElement) {
        domElement.hidden = mode !== RENDERER_MODES.DOM;
    }

    if (canvasElement) {
        canvasElement.hidden = mode !== RENDERER_MODES.CANVAS;
    }
};

const createWorldRenderer = function (options = {}) {
    const documentObject = options.document || document;
    const domElementId = options.domElementId || 'game-map';
    const canvasElementId = options.canvasElementId || 'game-canvas';
    const reportDiagnostic = options.reportDiagnostic || reportRendererDiagnostic;
    const hasExplicitMode = Object.prototype.hasOwnProperty.call(options, 'mode');
    const mode = hasExplicitMode
        ? resolveRequestedRendererMode(options.mode, reportDiagnostic)
        : resolveRendererMode(options.search, reportDiagnostic);

    updateWorldVisibility(documentObject, mode, domElementId, canvasElementId);

    if (mode === RENDERER_MODES.CANVAS) {
        return {
            mode: mode,
            renderer: new CanvasRenderer(canvasElementId, options.canvasOptions),
        };
    }

    return {
        mode: mode,
        renderer: new DOMRenderer(domElementId),
    };
};

export {
    createWorldRenderer,
};
