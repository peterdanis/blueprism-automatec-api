const express = require("express");
const processesRouter = require("./routes/processes");
const setupLog = require("./utils/logging");
const setupRateLimiter = require("./utils/rateLimiter");

const app = express();

// Setup logging and rate limiter
setupLog(app);
setupRateLimiter(app);

// Disable headers
app.disable("etag");
app.disable("x-powered-by");

// Use JSON middleware
app.use(express.json());

// Processes router handler
app.use("/processes", processesRouter);

// 404 handler
app.use("*", (req, res, next) => {
  res.status(404);
  next("Not Found");
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.statusCode >= 400) {
    res.status(res.statusCode);
  } else {
    res.status(500);
  }
  res.json({ error: err.message || err });
});

module.exports = app;
