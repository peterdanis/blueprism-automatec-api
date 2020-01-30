require("dotenv").config();
const app = require("../src/app");
// eslint-disable-next-line security/detect-child-process
const cp = require("child_process");
const request = require("supertest");
const { version } = require("../package.json");

const {
  BP_API_AUTH_PASSWORD: pw,
  BP_API_AUTH_USERNAME: username,
} = process.env;

const execFileMock = (err, input) => (...args) => {
  args.pop()(err, { stdout: input });
};

const execMock = (err, input) => (...args) => {
  args.pop()(err, input);
};

jest.mock("child_process");

// TODO: create mock implementation helpers, will be called multiple times from tests, mock inputs needs to be different
cp.exec.mockImplementation(execMock(null, {}));
cp.execFile.mockImplementation(execFileMock(null, "session:testId"));

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
    test("should return 400 if inputs are wrong", async () => {
      // TODO: finish test
      const res = await request(app)
        .post("/processes")
        .send({
          process: "Test",
        })
        .auth(username, pw);
      expect(res.body).toBe();
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
    // TODO: finish test
    test("TODO", async () => {
      const res = await request(app)
        .post("/reset")
        .auth(username, pw);
      expect(res.body).toBe();
    });
  });
});
