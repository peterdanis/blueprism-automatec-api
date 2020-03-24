const expressOasGenerator = require("express-oas-generator"); // eslint-disable-line import/no-extraneous-dependencies
const swaggerUi = require("swagger-ui-express");
const OasSpec = require("./oas-spec.json");

const setup = (app) => {
  if (process.env.NODE_ENV !== "production") {
    expressOasGenerator.init(app, OasSpec);
  }
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(OasSpec));
};

module.exports = setup;
