const express = require("express");
const logger = require("morgan");
const indexRouter = require("./routes/index");
const rfs = require("rotating-file-stream");
const path = require("path");

const app = express();

// create a rotating write stream
const accessLogStream = rfs("access.log", {
  interval: "10d", // rotate daily
  path: path.join("log"),
  size: "1M",
});

// setup the logger
if (process.env.NODE_ENV === "production") {
  app.use(logger("combined", { stream: accessLogStream }));
} else {
  app.use(logger("dev"));
}

app.use(express.json());

app.use("/", indexRouter);

app.use("*", (req, res, next) => {
  // 404 handler
  res.status(404);
  next(`Cannot ${req.method} ${req.url}`);
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Error handler
  const response = {};

  if (err.stdout) {
    res.status(400);
    response.error = err.stdout;
  } else {
    if (err.cmd) {
      err.cmd = "Redacted in error handler";
    }
    if (err.spawnargs) {
      err.spawnargs = "Redacted in error handler";
    }
    res.status(res.statusCode || err.status || 500);
    response.error = err;
  }
  res.json(response);
});

module.exports = app;
