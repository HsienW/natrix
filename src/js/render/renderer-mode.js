const RENDERER_MODES = Object.freeze({
    DOM: 'dom',
    CANVAS: 'canvas',
});

const reportRendererDiagnostic = function (message) {
    console.warn(message);
};

const readRequestedRendererMode = function (search) {
    const searchParams = new URLSearchParams(search || '');
    return searchParams.get('renderer');
};

const resolveRequestedRendererMode = function (requestedMode, reportDiagnostic) {
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

const resolveRendererMode = function (search, reportDiagnostic = reportRendererDiagnostic) {
    const requestedMode = readRequestedRendererMode(search);
    return resolveRequestedRendererMode(requestedMode, reportDiagnostic);
};

const updateRendererModeInUrl = function (windowObject, mode) {
    const url = new URL(windowObject.location.href);

    if (mode === RENDERER_MODES.CANVAS) {
        url.searchParams.set('renderer', RENDERER_MODES.CANVAS);
    } else {
        url.searchParams.delete('renderer');
    }

    const nextUrl = url.pathname + url.search + url.hash;
    windowObject.history.replaceState({}, '', nextUrl);
};

export {
    RENDERER_MODES,
    reportRendererDiagnostic,
    resolveRequestedRendererMode,
    resolveRendererMode,
    updateRendererModeInUrl,
};
