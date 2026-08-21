import {CANVAS_PALETTE, getFoodColor, getSnakeColor} from './canvas-palette.js';

const getBrowserPixelRatio = function () {
    if (typeof window === 'undefined') {
        return 1;
    }

    return window.devicePixelRatio || 1;
};

const CanvasRenderer = function (elementId, options = {}) {
    this.elementId = elementId || 'game-canvas';
    this.getPixelRatio = options.getPixelRatio || getBrowserPixelRatio;
    this.canvas = null;
    this.context = null;
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
    this.resize();
};

CanvasRenderer.prototype.getDisplaySize = function (viewport) {
    if (viewport && viewport.width > 0 && viewport.height > 0) {
        return Math.min(viewport.width, viewport.height);
    }

    const canvasBounds = this.canvas.getBoundingClientRect();
    return Math.min(canvasBounds.width, canvasBounds.height);
};

CanvasRenderer.prototype.resize = function (viewport) {
    if (!this.canvas || !this.context) {
        throw new Error('CanvasRenderer must be initialized before resizing.');
    }

    const displaySize = this.getDisplaySize(viewport);
    if (displaySize <= 0) {
        throw new Error('CanvasRenderer requires a positive display size.');
    }

    const pixelRatio = this.getPixelRatio();
    this.logicalSize = displaySize;
    this.cellSize = displaySize / this.mapSize;

    this.canvas.style.width = displaySize + 'px';
    this.canvas.style.height = displaySize + 'px';
    this.canvas.width = Math.round(displaySize * pixelRatio);
    this.canvas.height = Math.round(displaySize * pixelRatio);

    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.context.lineWidth = Math.max(1, this.cellSize / 8);
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

    this.context.clearRect(0, 0, this.logicalSize, this.logicalSize);
    this.canvas = null;
    this.context = null;
    this.mapSize = null;
    this.logicalSize = null;
    this.cellSize = null;
};

export {
    CanvasRenderer,
};
