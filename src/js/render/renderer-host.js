import {assertRenderer} from './renderer.js';

const copyConfig = function (config) {
    return {...config};
};

const RendererHost = function (renderer) {
    this.renderer = assertRenderer(renderer);
    this.config = null;
    this.initialized = false;
};

RendererHost.prototype.init = function (config) {
    if (this.initialized) {
        return;
    }

    this.config = copyConfig(config);
    this.renderer.init(copyConfig(this.config));
    this.initialized = true;
};

RendererHost.prototype.setRenderer = function (renderer) {
    const nextRenderer = assertRenderer(renderer);

    if (nextRenderer === this.renderer) {
        return;
    }

    const shouldInitializeNextRenderer = this.initialized;

    if (this.initialized) {
        this.renderer.destroy();
        this.initialized = false;
    }

    this.renderer = nextRenderer;

    if (shouldInitializeNextRenderer) {
        this.renderer.init(copyConfig(this.config));
        this.initialized = true;
    }
};

RendererHost.prototype.getRenderer = function () {
    return this.renderer;
};

RendererHost.prototype.render = function (snapshot, meta) {
    if (!this.initialized) {
        throw new Error('RendererHost must be initialized before rendering.');
    }

    this.renderer.render(snapshot, meta);
};

RendererHost.prototype.resize = function (viewport) {
    if (!this.initialized) {
        throw new Error('RendererHost must be initialized before resizing.');
    }

    this.renderer.resize(viewport);
};

RendererHost.prototype.destroy = function () {
    if (!this.initialized) {
        return;
    }

    this.renderer.destroy();
    this.initialized = false;
};

export {
    RendererHost,
};
