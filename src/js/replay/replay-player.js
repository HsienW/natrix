const createSimulationCommand = function (recordedCommand) {
    return {
        type: recordedCommand.type,
        playerId: recordedCommand.playerId,
        direction: recordedCommand.direction,
    };
};

const ReplayPlayer = function (commandLog) {
    this.commandsByTick = new Map();

    for (const recordedCommand of commandLog) {
        if (!this.commandsByTick.has(recordedCommand.tick)) {
            this.commandsByTick.set(recordedCommand.tick, []);
        }

        const commands = this.commandsByTick.get(recordedCommand.tick);
        commands.push(createSimulationCommand(recordedCommand));
    }
};

ReplayPlayer.prototype.commandsForTick = function (tick) {
    const commands = this.commandsByTick.get(tick) || [];
    return commands.map((command) => ({...command}));
};

export {
    ReplayPlayer,
};
