const copyPlainData = function (value) {
    if (Array.isArray(value)) {
        return value.map((item) => copyPlainData(item));
    }

    if (value !== null && typeof value === 'object') {
        const copy = {};

        for (const key of Object.keys(value)) {
            copy[key] = copyPlainData(value[key]);
        }

        return copy;
    }

    return value;
};

const createCommandLogEntry = function (tick, command) {
    const entry = copyPlainData(command);
    entry.tick = tick;
    return entry;
};

const copyCommandLog = function (commandLog) {
    return commandLog.map((entry) => copyPlainData(entry));
};

export {
    copyCommandLog,
    createCommandLogEntry,
};
