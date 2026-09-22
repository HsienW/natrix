const readClock = function (clock) {
    if (typeof clock !== 'function') {
        return null;
    }

    try {
        const currentTime = clock();
        return Number.isFinite(currentTime) ? currentTime : null;
    } catch (error) {
        return null;
    }
};

const getCurrentTime = function () {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        const performanceTime = readClock(function () {
            return performance.now();
        });

        if (performanceTime !== null) {
            return performanceTime;
        }
    }

    const dateTime = readClock(function () {
        return Date.now();
    });
    return dateTime === null ? 0 : dateTime;
};

const calculateElapsedTime = function (startedAt, finishedAt) {
    if (!Number.isFinite(startedAt) || !Number.isFinite(finishedAt)) {
        return null;
    }
    if (finishedAt < startedAt) {
        return null;
    }

    return finishedAt - startedAt;
};

export {
    calculateElapsedTime,
    getCurrentTime,
    readClock,
};
