const LogManager = require("simple-node-logger");

function createLogger(config, name) {
    const opts = Object.assign({}, config.logger, {logFilePath: `./logs/${name}.log`});
    let manager = LogManager.createLogManager(opts);
    manager.createConsoleAppender();
    manager.createFileAppender(opts);
    return manager.createLogger(`[${name}]`);
}

module.exports = {
    createLogger
};