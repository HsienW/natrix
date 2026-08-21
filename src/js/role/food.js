import {getRandomPosition, getRandomFoodAmount, getRandomFoodType} from '../common/util.js';
import {checkFoodOnSnakeBody} from '../common/role-util.js';
import {foodTypeInfo} from '../role-config/food-type.js';
import {roleItemMediator} from '../mediator/role-item-mediator.js';

const Food = function (foodPosition, foodType, foodStyleName, bodyExpandRate, speedRate) {
    this.foodPosition = foodPosition;
    this.foodType = foodType;
    this.foodStyleName = foodStyleName;
    // 吃到食物後, 蛇身體會增長的格子數
    this.bodyExpandRate = bodyExpandRate;
    // 吃到食物後, 蛇會變成多塊的移動速度
    this.speedRate = speedRate;
}

Food.prototype.createFoodPosition = function () {
    let newFoodPosition;
    while (newFoodPosition === null || newFoodPosition === undefined) {
        newFoodPosition = getRandomPosition();
    }
    return newFoodPosition;
}

Food.prototype.getFoodPosition = function () {
    return this.foodPosition;
}

Food.prototype.getFoodBodyExpandRate = function () {
    return this.bodyExpandRate;
}

Food.prototype.updateFoodItem = function () {
    // 檢查蛇是否有吃到食物
    const allSnake = roleItemMediator.getData('getAllSnake');
    const eatFoodSnakes = checkFoodOnSnakeBody(this, allSnake);
    if (eatFoodSnakes.length !== 0) {
        roleItemMediator.callAction('snakeEatFood', this, eatFoodSnakes);
        // 有吃到的話就重新 render 食物的位子
        this.foodPosition = this.createFoodPosition();
    }
    eatFoodSnakes.length = 0;
}

const foodFactory = function (foodPosition, foodType, foodStyleName, bodyExpandRate, speedRate) {
    const newFood = new Food(foodPosition, foodType, foodStyleName, bodyExpandRate, speedRate);
    roleItemMediator.callAction('addFood', newFood);
}

const initFoodAmount = getRandomFoodAmount(4);

const initFoods = function () {
    for (let i = 0; i < initFoodAmount; i++) {
        const initFood = foodTypeInfo[getRandomFoodType(2)](1, 1);
        foodFactory(
            initFood.position,
            initFood.type,
            initFood.styleName,
            initFood.expandRate,
            initFood.speedRate
        );
    }
}

export {
    initFoods,
}
