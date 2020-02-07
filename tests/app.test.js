require("dotenv").config();
const app = require("../src/app");
const request = require("supertest");
const {
  execFileMockOnce,
  execMock,
  execMockOnce,
} = require("./child_process.mock");
const { version } = require("../package.json");

jest.mock("child_process");

const {
  BP_API_AUTH_PASSWORD: pw,
  BP_API_AUTH_USERNAME: username,
} = process.env;

const get = route =>
  request(app)
    .get(route)
    .auth(username, pw);

const post = (route, input) =>
  request(app)
    .post(route)
    .send(input)
    .auth(username, pw);

const postProcesses = input => post("/processes", input);

describe("App", () => {
  test("should require authentication", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(401);
  });

  test("should require correct username", async () => {
    const res = await request(app)
      .get("/")
      .auth(`baduser${Date.now}`, pw);
    expect(res.status).toBe(401);
  });

  test("should require correct password", async () => {
    const res = await request(app)
      .get("/")
      .auth(username, `badpw${Date.now}`);
    expect(res.status).toBe(401);
  });

  test("should return 404 for unknown route", async () => {
    const res = await get("/unknownroute");
    expect(res.status).toBe(404);
  });
  test("should return 500 in case of error", async () => {
    execMockOnce(new Error("test"));
    const res = await post("/reset");
    expect(res.status).toBe(500);
  });

  describe("GET /version", () => {
    test("should return version number from package.json", async () => {
      const res = await get("/version");
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(version);
    });
  });

  describe("POST /processes", () => {
    test("should respond 201 and return sessionId", async () => {
      execFileMockOnce(null, {
        stdout: "session:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      });
      const res = await postProcesses({
        process: "Test",
      });
      expect(res.body).toHaveProperty("sessionId");
      expect(res.status).toBe(201);
    });
    test("should accept inputs", async () => {
      execFileMockOnce(null, {
        stdout: "session:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      });
      const res = await postProcesses({
        inputs: [
          {
            "@name": "Name",
            "@type": "text",
            "@value": "Value",
          },
        ],
        process: "Test",
      });
      expect(res.status).toBe(201);
    });
    test("should respond with 400 if process name is missing", async () => {
      const res = await postProcesses();
      expect(res.status).toBe(400);
    });
    test("should respond with 400 if inputs is not an array", async () => {
      const res = await postProcesses({
        inputs: {},
        process: "Test",
      });
      expect(res.status).toBe(400);
    });
    test("should respond with 400 if inputs is not correct", async () => {
      const res = await postProcesses({
        inputs: [{}],
        process: "Test",
      });
      expect(res.status).toBe(400);
    test("should respond with 503 if resource is locked / used by another user", async () => {
      const error = new Error();
      error.stdout = "Authentication error - RESTRICTED : user@company.com";
      execFileMockOnce(error);
      const res = await postProcesses({
        process: "Test",
    });
      expect(res.status).toBe(503);
      expect(res.body.error).toMatchInlineSnapshot(
        '"Runtime resource is locked / used by another user: user@company.com"',
      );
  });
  });

  describe("GET /processes/{sessionId}", () => {
    test("should return status", async () => {
      execFileMockOnce(null, {
        stdout: "Status:test",
      });
      const res = await get("/processes/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
      expect(res.body.status).toBe("test");
    });
    test("should respond with 400 if sessionId has incorrect format", async () => {
      const res = await get("/processes/badId");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /processes/{sessionId}/stop", () => {
    test("should respond with 202", async () => {
      const res = await post(
        "/processes/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/stop",
      );
      expect(res.status).toBe(202);
    });
    test("should respond with 400 if sessionId has incorrect format", async () => {
      const res = await post("/processes/badId/stop");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /reset", () => {
    test("should respond with 200", async () => {
      execMock.mockClear();
      execMockOnce(null, {});
      execMockOnce(null, {
        stdout: `
         SESSIONNAME       USERNAME                 ID  STATE   TYPE        DEVICE
         services                                    0  Disc
        >console           user                     1  Active`,
      });
      const res = await post("/reset");
      expect(res.status).toBe(200);
      expect(execMock.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            "taskkill /IM automate.exe /F",
            [Function],
          ],
          Array [
            "qwinsta",
            [Function],
          ],
          Array [
            "logoff 1",
            [Function],
          ],
          Array [
            "net stop loginagent",
            [Function],
          ],
          Array [
            "net start loginagent",
            [Function],
          ],
        ]
      `);
    });
    test("should ignore known errors", async () => {
      execMock.mockClear();
      // eslint-disable-next-line quotes
      execMockOnce(new Error('process "automate.exe" not found'));
      execMockOnce(null, { stdout: "test" });
      execMockOnce(new Error("The service name is invalid"));
      execMockOnce(new Error("The service name is invalid"));

      const res = await post("/reset");
      expect(res.status).toBe(200);
    });
  });
});
