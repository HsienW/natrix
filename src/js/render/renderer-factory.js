import {CanvasRenderer} from './canvas-renderer.js';
import {DOMRenderer} from './dom-renderer.js';

const RENDERER_MODES = Object.freeze({
    DOM: 'dom',
    CANVAS: 'canvas',
});

const reportRendererDiagnostic = function (message) {
    console.warn(message);
};

const readRequestedMode = function (search) {
    const searchParams = new URLSearchParams(search || '');
    return searchParams.get('renderer');
};

const resolveRendererMode = function (search, reportDiagnostic) {
    const requestedMode = readRequestedMode(search);

    if (!requestedMode || requestedMode === RENDERER_MODES.DOM) {
        return RENDERER_MODES.DOM;
    }

    if (requestedMode === RENDERER_MODES.CANVAS) {
        return RENDERER_MODES.CANVAS;
    }

    if (reportDiagnostic) {
        reportDiagnostic('Unknown renderer mode "' + requestedMode + '". Falling back to DOM.');
    }

    return RENDERER_MODES.DOM;
};

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
    const mode = resolveRendererMode(options.search, reportDiagnostic);

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
    RENDERER_MODES,
    createWorldRenderer,
    resolveRendererMode,
};
