const express = require("express");
const miscRouter = require("./routes/misc");
const processesRouter = require("./routes/processes");
const setupAuth = require("./utils/auth");
const setupLog = require("./utils/logging");
const setupRateLimiter = require("./utils/rateLimiter");
const setupSwagger = require("./utils/swagger.js");

const app = express();

// Setup logging and rate limiter
setupLog(app);
setupRateLimiter(app);
setupAuth(app);
setupSwagger(app);

// Disable headers
app.disable("etag");
app.disable("x-powered-by");

// Use JSON middleware
app.use(express.json());

// Route handlers
app.use("/", miscRouter);
app.use("/processes", processesRouter);

// 404 handler
app.use("*", (req, res, next) => {
  if (req.baseUrl.match(/\/api-spec/)) {
    next();
  } else {
    res.status(404);
    next("Not Found");
  }
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error.statusCode || res.statusCode >= 400) {
    res.status(error.statusCode || res.statusCode);
  } else {
    res.status(500);
  }
  res.json({ error: error.message || error });
});

module.exports = app;
