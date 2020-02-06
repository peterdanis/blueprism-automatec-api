require("dotenv").config();
const { agent } = require("supertest");

jest.mock("debug", () => () => {
  const debug = () => {};
  debug.enabled = true;
  return debug;
});

const request = agent("http://localhost:3000");
const {
  BP_API_AUTH_PASSWORD: pw,
  BP_API_AUTH_USERNAME: username,
} = process.env;

describe("Server", () => {
  test("should respond", async () => {
    process.env.BP_API_HTTPS = "false";
    const server = require("../src/server");
    const res = await request.get("/version").auth(username, pw);
    expect(res.status).toBe(200);
    server.close();
  });
});
