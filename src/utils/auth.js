const passport = require("passport");
const { BasicStrategy } = require("passport-http");

passport.use(
  new BasicStrategy((username, password, done) => {
    if (
      process.env.BP_API_AUTH_USERNAME !== username &&
      process.env.BP_API_AUTH_PASSWORD !== password
    ) {
      return done(null, false);
    }
    return done(null, username);
  }),
);

const setup = app => {
  if (process.env.BP_API_AUTH === "basic") {
    app.use(passport.initialize());
    app.use(passport.authenticate("basic", { session: false }));
  }
};

module.exports = setup;
