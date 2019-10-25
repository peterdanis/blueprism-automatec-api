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

app.get("*", (req, res, next) => {
  // 404 handler
  res.status(404);
  next(`Cannot ${req.method} ${req.url}`);
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Error handler
  res.status(res.statusCode || err.status || 500);
  res.json({ error: err });
});

module.exports = app;
