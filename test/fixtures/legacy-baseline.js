const legacyBaseline = Object.freeze({
    countdownSeconds: 60,
    food: Object.freeze({
        maximumCount: 4,
        minimumCount: 1,
        types: Object.freeze({
            generalExpand: Object.freeze({bodyGrowth: 1, styleName: 'general-expand-food'}),
            megaExpand: Object.freeze({bodyGrowth: 2, styleName: 'mega-expand-food'}),
        }),
    }),
    mapSize: 41,
    teams: Object.freeze({
        blue: Object.freeze({
            controls: Object.freeze(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']),
            id: 'a-team',
        }),
        red: Object.freeze({
            controls: Object.freeze(['KeyW', 'KeyS', 'KeyA', 'KeyD']),
            id: 'b-team',
        }),
    }),
});

module.exports = {
    legacyBaseline,
};
