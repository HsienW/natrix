const CANVAS_PALETTE = Object.freeze({
    background: '#c7c7c7',
    border: '#000000',
    snakes: Object.freeze({
        'a-snake-body': '#386994',
        'b-snake-body': '#f55733',
    }),
    food: Object.freeze({
        'general-expand-food': '#ffa000',
        'mega-expand-food': '#14a343',
        'double-fast-food': '#571bbf',
        food: '#e60ecc',
    }),
});

const getSnakeColor = function (styleName) {
    return CANVAS_PALETTE.snakes[styleName] || CANVAS_PALETTE.snakes['a-snake-body'];
};

const getFoodColor = function (styleName) {
    return CANVAS_PALETTE.food[styleName] || CANVAS_PALETTE.food.food;
};

export {
    CANVAS_PALETTE,
    getSnakeColor,
    getFoodColor,
};
