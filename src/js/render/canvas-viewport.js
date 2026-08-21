const getBrowserPixelRatio = function () {
    if (typeof window === 'undefined') {
        return 1;
    }

    return window.devicePixelRatio || 1;
};

const getBrowserResizeObserver = function () {
    if (typeof ResizeObserver === 'undefined') {
        return null;
    }

    return ResizeObserver;
};

const getBrowserWindow = function () {
    if (typeof window === 'undefined') {
        return null;
    }

    return window;
};

const getElementSize = function (element) {
    const bounds = element.getBoundingClientRect();
    const width = Number.isFinite(bounds.width) ? bounds.width : 0;
    const height = Number.isFinite(bounds.height) ? bounds.height : 0;

    return {
        width: Math.max(0, width),
        height: Math.max(0, height),
    };
};

const getValidPixelRatio = function (pixelRatio) {
    if (!Number.isFinite(pixelRatio) || pixelRatio <= 0) {
        return 1;
    }

    return pixelRatio;
};

const isSameViewport = function (firstViewport, secondViewport) {
    if (!firstViewport || !secondViewport) {
        return false;
    }

    return firstViewport.cssWidth === secondViewport.cssWidth
        && firstViewport.cssHeight === secondViewport.cssHeight
        && firstViewport.pixelRatio === secondViewport.pixelRatio;
};

const CanvasViewport = function (element, onResize, options = {}) {
    if (!element || typeof element.getBoundingClientRect !== 'function') {
        throw new TypeError('CanvasViewport requires a measurable element.');
    }

    if (typeof onResize !== 'function') {
        throw new TypeError('CanvasViewport requires an onResize callback.');
    }

    this.element = element;
    this.onResize = onResize;
    this.getPixelRatio = options.getPixelRatio || getBrowserPixelRatio;
    this.windowObject = Object.prototype.hasOwnProperty.call(options, 'window')
        ? options.window
        : getBrowserWindow();
    this.ResizeObserver = Object.prototype.hasOwnProperty.call(options, 'ResizeObserver')
        ? options.ResizeObserver
        : getBrowserResizeObserver();
    this.resizeObserver = null;
    this.usesWindowResize = false;
    this.started = false;
    this.lastViewport = null;

    const viewport = this;
    this.handleResize = function () {
        viewport.refresh();
    };
};

CanvasViewport.prototype.measure = function () {
    const elementSize = getElementSize(this.element);

    return {
        cssWidth: elementSize.width,
        cssHeight: elementSize.height,
        pixelRatio: getValidPixelRatio(this.getPixelRatio()),
    };
};

CanvasViewport.prototype.refresh = function (force) {
    if (!this.started) {
        return;
    }

    const nextViewport = this.measure();
    if (!force && isSameViewport(this.lastViewport, nextViewport)) {
        return;
    }

    this.lastViewport = nextViewport;
    this.onResize(nextViewport);
};

CanvasViewport.prototype.start = function () {
    if (this.started) {
        return;
    }

    this.started = true;

    if (this.ResizeObserver) {
        this.resizeObserver = new this.ResizeObserver(this.handleResize);
        this.resizeObserver.observe(this.element);
    } else if (this.windowObject) {
        this.windowObject.addEventListener('resize', this.handleResize);
        this.usesWindowResize = true;
    }

    this.refresh(true);
};

CanvasViewport.prototype.destroy = function () {
    if (!this.started) {
        return;
    }

    if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
    }

    if (this.usesWindowResize && this.windowObject) {
        this.windowObject.removeEventListener('resize', this.handleResize);
        this.usesWindowResize = false;
    }

    this.started = false;
    this.lastViewport = null;
};

export {
    CanvasViewport,
};
