require("dotenv").config();
const app = require("../src/app");
const request = require("supertest");
const { version } = require("../package.json");

const { BP_API_AUTH_PASSWORD, BP_API_AUTH_USERNAME } = process.env;

describe("App", () => {
  test("should require authentication", async () => {
    const res = await request(app).get("/version");
    expect(res.status).toBe(401);
  });
  describe("/version route", () => {
    test("should return version number from package.json", async () => {
      const res = await request(app)
        .get("/version")
        .auth(BP_API_AUTH_USERNAME, BP_API_AUTH_PASSWORD);
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(version);
    });
  });
});
