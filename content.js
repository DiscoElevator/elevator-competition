const express = require("express");
const LoggerFactory = require("./utils/logger");
const config = require("./config.json");

const logger = LoggerFactory.createLogger(config, "ContentServer");

const app = express();
app.use(express.static("elevatorsaga/build"));

app.listen(config.contentServerPort, function () {
    logger.info(`Content server started on port: ${config.contentServerPort}`);
});
