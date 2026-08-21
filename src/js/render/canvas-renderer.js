import {CANVAS_PALETTE, getFoodColor, getSnakeColor} from './canvas-palette.js';
import {CanvasViewport} from './canvas-viewport.js';

const CanvasRenderer = function (elementId, options = {}) {
    this.elementId = elementId || 'game-canvas';
    this.viewportOptions = {};

    if (options.getPixelRatio) {
        this.viewportOptions.getPixelRatio = options.getPixelRatio;
    }

    if (Object.prototype.hasOwnProperty.call(options, 'ResizeObserver')) {
        this.viewportOptions.ResizeObserver = options.ResizeObserver;
    }

    if (Object.prototype.hasOwnProperty.call(options, 'window')) {
        this.viewportOptions.window = options.window;
    }

    this.container = options.container || null;
    this.canvas = null;
    this.context = null;
    this.viewport = null;
    this.mapSize = null;
    this.logicalSize = null;
    this.cellSize = null;
};

CanvasRenderer.prototype.init = function (config) {
    if (typeof document === 'undefined') {
        throw new Error('CanvasRenderer requires a browser document.');
    }

    const canvas = document.getElementById(this.elementId);
    if (!canvas) {
        throw new Error('CanvasRenderer could not find #' + this.elementId + '.');
    }

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('CanvasRenderer requires a 2D canvas context.');
    }

    this.canvas = canvas;
    this.context = context;
    this.mapSize = config.mapSize;
    this.container = this.container || canvas.parentElement || canvas;

    const renderer = this;
    this.viewport = new CanvasViewport(this.container, function (viewport) {
        renderer.applyViewport(viewport);
    }, this.viewportOptions);
    this.viewport.start();
};

CanvasRenderer.prototype.applyViewport = function (viewport) {
    const displaySize = Math.min(viewport.cssWidth, viewport.cssHeight);
    const pixelRatio = viewport.pixelRatio;
    const backingSize = Math.round(displaySize * pixelRatio);

    this.logicalSize = displaySize;
    this.cellSize = displaySize > 0 ? displaySize / this.mapSize : 0;

    this.canvas.style.width = displaySize + 'px';
    this.canvas.style.height = displaySize + 'px';

    // 設定相同尺寸會重建 Canvas backing store, 所以只在實際變更時更新。
    if (this.canvas.width !== backingSize) {
        this.canvas.width = backingSize;
    }

    if (this.canvas.height !== backingSize) {
        this.canvas.height = backingSize;
    }

    // 每次都先回到預設 transform, 避免重複 resize 時累加 DPR 縮放。
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.scale(pixelRatio, pixelRatio);
    this.context.lineWidth = this.cellSize > 0
        ? Math.max(1, this.cellSize / 8)
        : 1;
};

CanvasRenderer.prototype.resize = function (viewport) {
    if (!this.canvas || !this.context || !this.viewport) {
        throw new Error('CanvasRenderer must be initialized before resizing.');
    }

    if (viewport) {
        this.applyViewport(viewport);
        return;
    }

    this.viewport.refresh(true);
};

CanvasRenderer.prototype.getCellRectangle = function (position) {
    return {
        x: (position.x - 1) * this.cellSize,
        y: (position.y - 1) * this.cellSize,
        width: this.cellSize,
        height: this.cellSize,
    };
};

CanvasRenderer.prototype.drawBackground = function () {
    this.context.fillStyle = CANVAS_PALETTE.background;
    this.context.fillRect(0, 0, this.logicalSize, this.logicalSize);
};

CanvasRenderer.prototype.drawFood = function (foodItem) {
    const rectangle = this.getCellRectangle(foodItem.position);
    const centerX = rectangle.x + rectangle.width / 2;
    const centerY = rectangle.y + rectangle.height / 2;
    const radius = rectangle.width / 2;

    this.context.beginPath();
    this.context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.context.fillStyle = getFoodColor(foodItem.style);
    this.context.fill();
    this.context.strokeStyle = CANVAS_PALETTE.border;
    this.context.stroke();
};

CanvasRenderer.prototype.drawSnakeSegment = function (bodyItem, styleName) {
    const rectangle = this.getCellRectangle(bodyItem);

    this.context.fillStyle = getSnakeColor(styleName);
    this.context.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    this.context.strokeStyle = CANVAS_PALETTE.border;
    this.context.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
};

CanvasRenderer.prototype.render = function (snapshot) {
    if (!this.canvas || !this.context) {
        throw new Error('CanvasRenderer must be initialized before rendering.');
    }

    // ResizeObserver 不一定會在 DPR 單獨改變時觸發, render 前同步一次即可補足。
    this.viewport.refresh();

    // 隱藏中的容器可能是零尺寸, 等 observer 回報有效尺寸後再恢復繪製。
    if (this.logicalSize <= 0) {
        return;
    }

    this.drawBackground();

    snapshot.food.forEach((foodItem) => {
        this.drawFood(foodItem);
    });

    snapshot.snakes.forEach((snake) => {
        if (!snake.alive) {
            return;
        }

        snake.body.forEach((bodyItem) => {
            this.drawSnakeSegment(bodyItem, snake.style);
        });
    });
};

CanvasRenderer.prototype.destroy = function () {
    if (!this.canvas || !this.context) {
        return;
    }

    this.viewport.destroy();

    if (this.logicalSize > 0) {
        this.context.clearRect(0, 0, this.logicalSize, this.logicalSize);
    }

    this.canvas = null;
    this.context = null;
    this.viewport = null;
    this.mapSize = null;
    this.logicalSize = null;
    this.cellSize = null;
};

export {
    CanvasRenderer,
};
