require("dotenv").config();
const app = require("../src/app");
const request = require("supertest");
const {
  execFileMock,
  execFileMockDefault,
  execFileMockOnce,
  execMock,
  execMockDefault,
  execMockOnce,
} = require("./child_process.mock");
const { version } = require("../package.json");

jest.mock("child_process");

const {
  BP_API_DBCONNAME,
  BP_API_AUTH_PASSWORD: pw,
  BP_API_AUTH_USERNAME: username,
} = process.env;

const get = (route) => request(app).get(route).auth(username, pw);

const post = (route, input) =>
  request(app).post(route).send(input).auth(username, pw);

const postProcesses = (input) => post("/processes", input);

beforeEach(() => {
  // Reset mock before each test, to avoid test interfere with each other
  execMock.mockReset();
  execFileMock.mockReset();
  // Add default mock implementation
  execMockDefault(null, { stdout: "test" });
  execFileMockDefault(null, { stdout: "test" });
});

describe("App", () => {
  test("should require authentication", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(401);
  });

  test("should require correct username", async () => {
    const res = await request(app).get("/").auth(`baduser${Date.now()}`, pw);
    expect(res.status).toBe(401);
  });

  test("should require correct password", async () => {
    const res = await request(app)
      .get("/")
      .auth(username, `badpw${Date.now()}`);
    expect(res.status).toBe(401);
  });

  test("should return 404 for unknown route", async () => {
    const res = await get("/unknownroute");
    expect(res.status).toBe(404);
  });

  test("should return 500 in case of error", async () => {
    const error = new Error("Command failed: something went wrong");
    execMockOnce(error);
    execFileMockOnce(error);
    execFileMockOnce(error);
    execFileMockOnce(error);
    const tests = [
      { fn: post, route: "/reset" },
      { fn: post, input: { process: "Test" }, route: "/processes" },
      {
        fn: get,
        route: "/processes/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
      {
        fn: post,
        route: "/processes/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/stop",
      },
    ];
    const values = await Promise.all(
      tests.map(async ({ fn, input, route }) => fn(route, input)),
    );
    values.forEach((res) => {
      expect(res.status).toBe(500);
    });
    expect.assertions(4);
  });

  describe("GET /version", () => {
    test("should return version number from package.json", async () => {
      const res = await get("/version");
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(version);
    });
  });

  describe("POST /processes", () => {
    test("should check process name and respond accordingly", async () => {
      execFileMockOnce(null, {
        stdout: "session:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      });
      const res = await postProcesses({
        process: "01_Test-of(name,name):[A].",
      });
      expect(res.status).toBe(201);
      const res2 = await postProcesses({
        process: "\\.",
      });
      expect(res2.status).toBe(400);
    });

    test("should respond 201 and return sessionId (without inputs / startup parameters)", async () => {
      execFileMockOnce(null, {
        stdout: "session:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      });
      const res = await postProcesses({
        process: "Test",
      });
      const callArgs = execFileMock.mock.calls[0][1];
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("sessionId");
      expect(res.body.sessionId).toMatchInlineSnapshot(
        '"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"',
      );
      expect(callArgs).toMatchInlineSnapshot(`
        Array [
          "/dbconname",
          "${BP_API_DBCONNAME}",
          "/sso",
          "/run",
          "Test",
        ]
      `);
    });

    test("should respond 201 and return sessionId (with inputs / startup parameters)", async () => {
      execFileMockOnce(null, {
        stdout: "session:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      });
      const res = await postProcesses({
        inputs: [
          {
            "@name": "Test param",
            "@type": "text",
            "@value": "test",
          },
        ],
        process: "Test",
      });
      const inputsXml = execFileMock.mock.calls[0][1][6];

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("sessionId");
      expect(res.body.sessionId).toMatchInlineSnapshot(
        '"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"',
      );
      expect(inputsXml).toMatchInlineSnapshot(
        '"<inputs><input name=\\"Test param\\" type=\\"text\\" value=\\"test\\"/></inputs>"',
      );
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

    test("should respond with 400 if inputs are not an array", async () => {
      const res = await postProcesses({
        inputs: {},
        process: "Test",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatchInlineSnapshot('"Inputs must be an array"');
    });

    test("should respond with 400 if inputs are not correct", async () => {
      const res = await postProcesses({
        inputs: [{}],
        process: "Test",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatchInlineSnapshot(
        "\"Each item in Inputs array must have '@name', '@value' and '@type' properties. In addition, '@type' must be 'text'\"",
      );
    });

    test("should respond with 400 if process is not found", async () => {
      const error = new Error();
      error.stdout = "Error: process 'Test' does not exist";
      execFileMockOnce(error);
      const res = await postProcesses({
        process: "Test",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatchInlineSnapshot('"Process does not exist"');
    });

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

    test("should respond with 503 if connecting to resource is not possible", async () => {
      const error = new Error();
      error.stdout =
        "Error: could not connect to resource HOSTNAME -Connection to the resource timed out.";
      execFileMockOnce(error);
      const res = await postProcesses({
        process: "Test",
      });
      expect(res.status).toBe(503);
      expect(res.body.error).toMatchInlineSnapshot(
        '"Could not connect to resource"',
      );
    });

    test("should respond with 503 if maximum number of concurrent sessions permitted by the license is exceeded", async () => {
      const error = new Error();
      error.stdout =
        "can not create session to run process - The maximum number of concurrent sessions permitted by the current license would be exceeded";
      execFileMockOnce(error);
      execFileMockOnce(error);
      const res = await postProcesses({
        process: "Test",
      });
      expect(res.status).toBe(503);
      expect(res.body.error).toMatchInlineSnapshot(
        '"The maximum number of concurrent sessions permitted by the current BluePrism license would be exceeded"',
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
      expect(res.body.error).toMatchInlineSnapshot(
        '"Supplied session ID is not a valid session identifier. The correct format is xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"',
      );
    });

    test("should respond with 400 if sessionId could not be found", async () => {
      const error = new Error();
      error.stdout =
        "Could not find the session with the ID/number: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
      execFileMockOnce(error);
      const res = await post(
        "/processes/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/stop",
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toMatchInlineSnapshot(
        '"Could not find the session with the ID/number"',
      );
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
      execMockOnce(new Error('process "automate.exe" not found'));
      execMockOnce(null, { stdout: "test" });
      execMockOnce(new Error("The service name is invalid"));
      execMockOnce(new Error("The service name is invalid"));

      const res = await post("/reset");
      expect(res.status).toBe(200);
    });
  });
});
