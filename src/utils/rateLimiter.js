const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  headers: false,
  max: process.env.BP_API_RATE_LIMIT || 200,
  message: { error: "Too many requests, please try again later." },
  windowMs: 1 * 60 * 1000,
});

const setup = (app) => {
  app.use(limiter);
};

module.exports = setup;
