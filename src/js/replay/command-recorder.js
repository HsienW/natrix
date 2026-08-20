import {copyCommandLog, createCommandLogEntry} from './command-log.js';

class CommandRecorder {
    constructor() {
        this.commandLog = [];
    }

    record(tick, commands) {
        if (!Number.isInteger(tick) || tick < 0) {
            throw new RangeError('CommandRecorder tick must be a non-negative integer.');
        }
        if (!Array.isArray(commands)) {
            throw new TypeError('CommandRecorder commands must be an array.');
        }

        const newEntries = commands.map((command) => {
            if (!command || typeof command !== 'object' || Array.isArray(command)) {
                throw new TypeError('CommandRecorder only accepts command objects.');
            }

            return createCommandLogEntry(tick, command);
        });

        this.commandLog.push(...newEntries);
        return newEntries.length;
    }

    entries() {
        return copyCommandLog(this.commandLog);
    }

    clear() {
        this.commandLog = [];
    }
}

export {
    CommandRecorder,
};
