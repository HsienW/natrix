import {DIRECTIONS} from '../role-config/snake-operation.js';

const COMMAND_TYPES = Object.freeze({
    CHANGE_DIRECTION: 'CHANGE_DIRECTION',
});

const KEYBOARD_COMMANDS = Object.freeze({
    ArrowUp: Object.freeze({
        type: COMMAND_TYPES.CHANGE_DIRECTION,
        playerId: 'a-snake',
        direction: DIRECTIONS.UP,
    }),
    ArrowDown: Object.freeze({
        type: COMMAND_TYPES.CHANGE_DIRECTION,
        playerId: 'a-snake',
        direction: DIRECTIONS.DOWN,
    }),
    ArrowLeft: Object.freeze({
        type: COMMAND_TYPES.CHANGE_DIRECTION,
        playerId: 'a-snake',
        direction: DIRECTIONS.LEFT,
    }),
    ArrowRight: Object.freeze({
        type: COMMAND_TYPES.CHANGE_DIRECTION,
        playerId: 'a-snake',
        direction: DIRECTIONS.RIGHT,
    }),
    KeyW: Object.freeze({
        type: COMMAND_TYPES.CHANGE_DIRECTION,
        playerId: 'b-snake',
        direction: DIRECTIONS.UP,
    }),
    KeyS: Object.freeze({
        type: COMMAND_TYPES.CHANGE_DIRECTION,
        playerId: 'b-snake',
        direction: DIRECTIONS.DOWN,
    }),
    KeyA: Object.freeze({
        type: COMMAND_TYPES.CHANGE_DIRECTION,
        playerId: 'b-snake',
        direction: DIRECTIONS.LEFT,
    }),
    KeyD: Object.freeze({
        type: COMMAND_TYPES.CHANGE_DIRECTION,
        playerId: 'b-snake',
        direction: DIRECTIONS.RIGHT,
    }),
});

const mapKeyboardCodeToCommand = function (code) {
    const command = KEYBOARD_COMMANDS[code];
    return command ? {...command} : null;
};

const getKeyboardCodesForPlayer = function (playerId) {
    return Object.keys(KEYBOARD_COMMANDS).filter((code) => {
        return KEYBOARD_COMMANDS[code].playerId === playerId;
    });
};

export {
    COMMAND_TYPES,
    DIRECTIONS,
    getKeyboardCodesForPlayer,
    mapKeyboardCodeToCommand,
};
