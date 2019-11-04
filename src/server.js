const packageJson = require("../package.json");
let debug = require("debug")(`express:${packageJson.name}`);
const app = require("./app");
const http = require("http");

// Use console.log if not debugging
if (!debug.enabled) {
  debug = console.log; // eslint-disable-line no-console
}

debug(`Version: ${packageJson.version}`);

// Normalize a port into a number, string, or false.
const normalizePort = val => {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
};

// Get port from environment and store in Express.
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

// Create HTTP server.
const server = http.createServer(app);

// TODO: Create HTTPS server.
// const options = {
//   pfx: fs.readFileSync("mypfxfile"),
//   passphrase: "foo",
// };
// const server = https.createServer(options, app);

// Event listener for HTTP server "error" event.
const onError = error => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case "EACCES":
      debug(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      debug(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// Event listener for HTTP server "listening" event.
const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
};

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
