const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  headers: false,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  windowMs: 5 * 60 * 1000,
});

const setup = app => {
  app.use(limiter);
};

module.exports = setup;
