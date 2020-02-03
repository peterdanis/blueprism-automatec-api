require("dotenv").config();
const app = require("../src/app");
const request = require("supertest");
const { execFileMockOnce, execMockOnce } = require("./child_process.mock");
const { version } = require("../package.json");

jest.mock("child_process");

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
  test("should return 500 in case of error", async () => {
    execFileMockOnce(new Error("test"));
    const res = await request(app)
      .get("/processes/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
      .auth(username, pw);
    expect(res.status).toBe(500);
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
    test("should return 400 if inputs are wrong", async () => {
      execFileMockOnce(null, { stdout: "session:x" });
      const res = await request(app)
        .post("/processes")
        .send({
          inputs: {},
          process: "Test",
        })
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

  describe("POST /reset", () => {
    test("should run successfully", async () => {
      const res = await request(app)
        .post("/reset")
        .auth(username, pw);
      expect(res.status).toBe(200);
    });
  });
});
