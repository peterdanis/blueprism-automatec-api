const express = require("express");
const processesRouter = require("./routes/processes");
const setupLog = require("./utils/logging");
const setupRateLimiter = require("./utils/rateLimiter");

const app = express();

setupLog(app);
setupRateLimiter(app);

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
