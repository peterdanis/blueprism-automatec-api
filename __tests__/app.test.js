require("dotenv").config();
const app = require("../src/app");
const request = require("supertest");
const { version } = require("../package.json");

const {
  BP_API_AUTH_PASSWORD: pw,
  BP_API_AUTH_USERNAME: username,
} = process.env;

describe("App", () => {
  test("should require authentication", async () => {
    const res = await request(app).get("/version");
    expect(res.status).toBe(401);
  });
  test("should return 404 for unknown route", async () => {
    const res = await request(app)
      .get("/unknownroute")
      .auth(username, pw);
    expect(res.status).toBe(404);
  });
  describe("GET /version", () => {
    test("should return version number from package.json", async () => {
      const res = await request(app)
        .get("/version")
        .auth(username, pw);
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(version);
    });
  });
  describe("POST /processes", () => {
    test("should return 400 if process name is missing", async () => {
      const res = await request(app)
        .post("/processes")
        .auth(username, pw);
      expect(res.status).toBe(400);
    });
  });
  describe("GET /processes/{sessionId}", () => {
    test("should return 400 if sessionId has incorrect format", async () => {
      const res = await request(app)
        .get("/processes/badId")
        .auth(username, pw);
      expect(res.status).toBe(400);
    });
  });
});
