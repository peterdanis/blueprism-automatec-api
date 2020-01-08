const logger = require("morgan");
const path = require("path");
const rfs = require("rotating-file-stream");

const setup = app => {
  if (process.env.BP_API_FILELOG === "true") {
    // create a rotating write stream
    const accessLogStream = rfs.createStream("access.log", {
      interval: "7d", // rotate weekly
      path: path.join("log"),
      size: "1M",
    });
    app.use(logger("combined", { stream: accessLogStream }));
  } else {
    app.use(logger("dev"));
  }
};

module.exports = setup;
