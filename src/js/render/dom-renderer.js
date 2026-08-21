const DOMRenderer = function (elementId) {
    this.elementId = elementId || 'game-map';
    this.gameMap = null;
}

DOMRenderer.prototype.init = function () {
    if (typeof document === 'undefined') {
        throw new Error('DOMRenderer requires a browser document.');
    }

    const gameMap = document.getElementById(this.elementId);
    if (!gameMap) {
        throw new Error('DOMRenderer could not find #' + this.elementId + '.');
    }

    this.gameMap = gameMap;
}

DOMRenderer.prototype.createFoodElement = function (foodItem) {
    const foodElement = document.createElement('div');
    foodElement.style.gridRowStart = foodItem.position.y;
    foodElement.style.gridColumnStart = foodItem.position.x;
    foodElement.classList.add(foodItem.style);
    return foodElement;
}

DOMRenderer.prototype.createSnakeElement = function (bodyItem, styleName) {
    const snakeElement = document.createElement('div');
    snakeElement.style.gridRowStart = bodyItem.y;
    snakeElement.style.gridColumnStart = bodyItem.x;
    snakeElement.classList.add(styleName);
    return snakeElement;
}

DOMRenderer.prototype.render = function (snapshot) {
    if (!this.gameMap) {
        throw new Error('DOMRenderer must be initialized before rendering.');
    }

    this.gameMap.innerHTML = '';

    snapshot.food.forEach((foodItem) => {
        const foodElement = this.createFoodElement(foodItem);
        this.gameMap.appendChild(foodElement);
    });

    snapshot.snakes.forEach((snake) => {
        if (!snake.alive) {
            return;
        }

        snake.body.forEach((bodyItem) => {
            const snakeElement = this.createSnakeElement(bodyItem, snake.style);
            this.gameMap.appendChild(snakeElement);
        });
    });
}

DOMRenderer.prototype.resize = function () {}

DOMRenderer.prototype.destroy = function () {
    if (!this.gameMap) {
        return;
    }

    this.gameMap.innerHTML = '';
    this.gameMap = null;
}

export {
    DOMRenderer,
}
