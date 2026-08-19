const {
    COMMAND_TYPES,
    DIRECTIONS,
    getKeyboardCodesForPlayer,
    mapKeyboardCodeToCommand,
} = require('../../src/js/input/command-map.js');

describe('keyboard command map', () => {
    test.each([
        ['ArrowUp', 'a-snake', DIRECTIONS.UP],
        ['ArrowDown', 'a-snake', DIRECTIONS.DOWN],
        ['ArrowLeft', 'a-snake', DIRECTIONS.LEFT],
        ['ArrowRight', 'a-snake', DIRECTIONS.RIGHT],
        ['KeyW', 'b-snake', DIRECTIONS.UP],
        ['KeyS', 'b-snake', DIRECTIONS.DOWN],
        ['KeyA', 'b-snake', DIRECTIONS.LEFT],
        ['KeyD', 'b-snake', DIRECTIONS.RIGHT],
    ])('maps %s to a logical direction command', (code, playerId, direction) => {
        expect(mapKeyboardCodeToCommand(code)).toEqual({
            type: COMMAND_TYPES.CHANGE_DIRECTION,
            playerId,
            direction,
        });
    });

    test('ignores unsupported keyboard codes', () => {
        expect(mapKeyboardCodeToCommand('Space')).toBeNull();
    });

    test('exposes the legacy controls by stable player identity', () => {
        expect(getKeyboardCodesForPlayer('a-snake')).toEqual([
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
        ]);
        expect(getKeyboardCodesForPlayer('b-snake')).toEqual([
            'KeyW',
            'KeyS',
            'KeyA',
            'KeyD',
        ]);
    });
});
