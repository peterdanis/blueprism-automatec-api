const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const indexRouter = require("./routes/index");
const rfs = require("rotating-file-stream");
const path = require("path");

const app = express();

// create a rotating write stream
const accessLogStream = rfs("access.log", {
  interval: "10d", // rotate daily
  path: path.join("..", "log"),
  size: "1M",
});

// setup the logger
if (process.env.NODE_ENV === "production") {
  app.use(logger("combined", { stream: accessLogStream }));
} else {
  app.use(logger("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("error");
});

module.exports = app;
