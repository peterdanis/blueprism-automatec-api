const passport = require("passport");
const { BasicStrategy } = require("passport-http");

const { BP_API_AUTH, BP_API_AUTH_PASSWORD, BP_API_AUTH_USERNAME } = process.env;

passport.use(
  new BasicStrategy((username, password, done) => {
    if (
      BP_API_AUTH_USERNAME === username &&
      BP_API_AUTH_PASSWORD === password
    ) {
      return done(null, username);
    }
    return done(null, false);
  }),
);

const setup = (app) => {
  if (BP_API_AUTH === "basic") {
    app.use(passport.initialize());
    app.use(passport.authenticate("basic", { session: false }));
  }
};

module.exports = setup;
