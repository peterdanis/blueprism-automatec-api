const logger = require("morgan");
const path = require("path");
const rfs = require("rotating-file-stream");

const { BP_API_FILELOG, NODE_ENV } = process.env;

const setup = (app) => {
  if (BP_API_FILELOG === "true") {
    // create a rotating write stream
    const accessLogStream = rfs.createStream("access.log", {
      interval: "7d", // rotate weekly
      path: path.join("logs"),
      size: "1M",
    });
    app.use(logger("combined", { stream: accessLogStream }));
  } else if (NODE_ENV !== "test") {
    // disable logging for test runs
    app.use(logger("dev"));
  }
};

module.exports = setup;
