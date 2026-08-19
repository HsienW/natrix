const {KeyboardInput} = require('../../src/js/input/keyboard-input.js');

const createEventTarget = function () {
    let keydownListener = null;

    return {
        addEventListener: jest.fn((eventName, listener) => {
            if (eventName === 'keydown') {
                keydownListener = listener;
            }
        }),
        removeEventListener: jest.fn((eventName, listener) => {
            if (eventName === 'keydown' && listener === keydownListener) {
                keydownListener = null;
            }
        }),
        dispatchKeydown: function (event) {
            return keydownListener(event);
        },
    };
};

describe('KeyboardInput', () => {
    test('starts and stops idempotently', () => {
        const target = createEventTarget();
        const keyboardInput = new KeyboardInput({
            buffer: {push: jest.fn()},
            target,
        });

        expect(keyboardInput.start()).toBe(true);
        expect(keyboardInput.start()).toBe(false);
        expect(target.addEventListener).toHaveBeenCalledTimes(1);

        expect(keyboardInput.stop()).toBe(true);
        expect(keyboardInput.stop()).toBe(false);
        expect(target.removeEventListener).toHaveBeenCalledTimes(1);
    });

    test('buffers mapped commands without retaining the browser event', () => {
        const target = createEventTarget();
        const buffer = {push: jest.fn()};
        const keyboardInput = new KeyboardInput({buffer, target});
        const event = {
            code: 'ArrowUp',
            preventDefault: jest.fn(),
        };

        keyboardInput.start();
        target.dispatchKeydown(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(buffer.push).toHaveBeenCalledWith({
            type: 'CHANGE_DIRECTION',
            playerId: 'a-snake',
            direction: 'UP',
        });
        expect(buffer.push.mock.calls[0][0]).not.toHaveProperty('event');
    });

    test('ignores unknown keyboard input', () => {
        const target = createEventTarget();
        const buffer = {push: jest.fn()};
        const keyboardInput = new KeyboardInput({buffer, target});
        const event = {
            code: 'Space',
            preventDefault: jest.fn(),
        };

        keyboardInput.start();
        target.dispatchKeydown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(buffer.push).not.toHaveBeenCalled();
    });
});
