import {mapKeyboardCodeToCommand} from './command-map.js';
import {inputBuffer} from './input-buffer.js';

class KeyboardInput {
    constructor({
        buffer = inputBuffer,
        commandMapper = mapKeyboardCodeToCommand,
        target = null,
    } = {}) {
        if (!buffer || typeof buffer.push !== 'function') {
            throw new TypeError('KeyboardInput requires a command buffer.');
        }
        if (typeof commandMapper !== 'function') {
            throw new TypeError('KeyboardInput requires a command mapper.');
        }

        this.buffer = buffer;
        this.commandMapper = commandMapper;
        this.target = target;
        this.activeTarget = null;
        this.running = false;
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    start(target = this.target || (typeof window !== 'undefined' ? window : null)) {
        if (this.running) {
            return false;
        }
        if (!target || typeof target.addEventListener !== 'function') {
            throw new TypeError('KeyboardInput requires an event target.');
        }

        this.activeTarget = target;
        this.activeTarget.addEventListener('keydown', this.handleKeydown);
        this.running = true;
        return true;
    }

    stop() {
        if (!this.running) {
            return false;
        }

        this.activeTarget.removeEventListener('keydown', this.handleKeydown);
        this.activeTarget = null;
        this.running = false;
        return true;
    }

    handleKeydown(event) {
        const command = this.commandMapper(event.code);

        if (!command) {
            return false;
        }

        if (typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        this.buffer.push(command);
        return true;
    }
}

const keyboardInput = new KeyboardInput();

export {
    KeyboardInput,
    keyboardInput,
};
