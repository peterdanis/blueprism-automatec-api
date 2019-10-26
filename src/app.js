const express = require("express");
const logger = require("morgan");
const processesRouter = require("./routes/processes");
const rfs = require("rotating-file-stream");
const path = require("path");

const app = express();

// setup the logger
if (process.env.NODE_ENV === "production") {
  // create a rotating write stream
  const accessLogStream = rfs("access.log", {
    interval: "7d", // rotate weekly
    path: path.join("log"),
    size: "1M",
  });
  app.use(logger("combined", { stream: accessLogStream }));
} else {
  app.use(logger("dev"));
}

// Setup headers and json
app.disable("etag");
app.disable("x-powered-by");
app.use(express.json());

// Processes router handler
app.use("/processes", processesRouter);

// 404 handler
app.use("*", (req, res, next) => {
  res.status(404);
  next(`Cannot ${req.method} ${req.url}`);
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(res.statusCode || err.status || 500);
  res.json(err);
});

module.exports = app;
