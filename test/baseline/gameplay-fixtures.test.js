const {legacyBaseline} = require('../fixtures/legacy-baseline.js');
const {mainGameTimeType} = require('../../src/js/main-config/main-game-time.js');
const {getRandomFoodAmount} = require('../../src/js/common/util.js');
const {mapSize} = require('../../src/js/role/map.js');
const {foodTypeInfo} = require('../../src/js/role-config/food-type.js');
const {snakeTypeInfo} = require('../../src/js/role-config/snake-type.js');
const {getKeyboardCodesForPlayer} = require('../../src/js/input/command-map.js');

describe('legacy gameplay fixtures', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('keeps the map and short countdown configuration', () => {
        expect(mapSize).toBe(legacyBaseline.mapSize);
        expect(mainGameTimeType.short()).toBe(legacyBaseline.countdownSeconds);
    });

    test('keeps food count and growth boundaries', () => {
        jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999999);

        expect(getRandomFoodAmount(legacyBaseline.food.maximumCount)).toBe(legacyBaseline.food.minimumCount);
        expect(getRandomFoodAmount(legacyBaseline.food.maximumCount)).toBe(legacyBaseline.food.maximumCount);

        jest.spyOn(Math, 'random').mockReturnValue(0);
        const generalFood = foodTypeInfo[0](1, 1);
        const megaFood = foodTypeInfo[1](1, 1);

        expect(generalFood).toEqual(expect.objectContaining({
            expandRate: legacyBaseline.food.types.generalExpand.bodyGrowth,
            styleName: legacyBaseline.food.types.generalExpand.styleName,
        }));
        expect(megaFood).toEqual(expect.objectContaining({
            expandRate: legacyBaseline.food.types.megaExpand.bodyGrowth,
            styleName: legacyBaseline.food.types.megaExpand.styleName,
        }));
    });

    test('keeps team identities, controls, and stationary initial direction', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);
        const blueSnake = snakeTypeInfo[0]();
        const redSnake = snakeTypeInfo[1]();

        expect(blueSnake.snakeTeam).toBe(legacyBaseline.teams.blue.id);
        expect(redSnake.snakeTeam).toBe(legacyBaseline.teams.red.id);
        expect(blueSnake.playerId).toBe('a-snake');
        expect(redSnake.playerId).toBe('b-snake');
        expect(getKeyboardCodesForPlayer(blueSnake.playerId)).toEqual(legacyBaseline.teams.blue.controls);
        expect(getKeyboardCodesForPlayer(redSnake.playerId)).toEqual(legacyBaseline.teams.red.controls);
        expect(blueSnake.direction).toEqual({x: 0, y: 0});
        expect(redSnake.direction).toEqual({x: 0, y: 0});
    });
});
