require("dotenv").config();
const { agent } = require("supertest");

process.env.BP_API_HTTPS = "false";

console.log = jest.fn(); // eslint-disable-line no-console
const request = agent("http://localhost:3000");
const {
  BP_API_AUTH_PASSWORD: pw,
  BP_API_AUTH_USERNAME: username,
} = process.env;
let server;

beforeEach(() => {
  server = require("../src/server");
});

afterEach(done => {
  server.close(done);
});

describe("Server", () => {
  test("should respond", async () => {
    const res = await request.get("/version").auth(username, pw);
    expect(res.status).toBe(200);
  });
});
