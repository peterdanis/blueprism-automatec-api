const path = require("path");
const execFile = require("util").promisify(require("child_process").execFile); // eslint-disable-line security/detect-child-process

const dir = process.env.BP_PATH || [
  "C:",
  "Program Files",
  "Blue Prism Limited",
  "Blue Prism Automate",
];
const bin = path.join(...dir, "AutomateC.exe");

const args = ["/sso", "/dbconname", "Development"];

const idRegexp = new RegExp(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
const nameRegexp = new RegExp(/^[\w ]+$/);

const runAutomateC = async (action, identifier) => {
  let result = {};
  try {
    const customError = new Error();
    switch (action) {
      case "getStatus":
        if (!idRegexp.test(identifier)) {
          customError.statusCode = 400;
          customError.message =
            "Supplied session ID is not a valid session identifier. The correct format is xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
          throw customError;
        }
        result = await execFile(bin, [...args, "/status", identifier]);
        result = { status: result.stdout.match(/Status:([a-zA-Z]*)/i)[1] };
        break;

      case "startProcess":
        if (!nameRegexp.test(identifier)) {
          customError.statusCode = 400;
          customError.message = "Incorrect process name supplied";
          throw customError;
        }
        result = await execFile(bin, [...args, "/run", identifier]);
        result = { sessionId: result.stdout.match(/session:([0-9a-z-]*)/i)[1] };
        break;

      case "stopProcess":
        if (!idRegexp.test(identifier)) {
          customError.statusCode = 400;
          customError.message =
            "Supplied session ID is not a valid session identifier. The correct format is xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
          throw customError;
        }
        result = await execFile(bin, [...args, "/requeststop", identifier]);
        result = { status: "Stop requested" };
        break;

      default:
        customError.statusCode = 501;
        customError.message =
          "No action specified, check server <-> bin file integration part";
        throw customError;
    }
  } catch (error) {
    if (error.stdout) {
      const customError = new Error();
      switch (true) {
        case error.stdout.match(/The session .* is not running/) != null:
          customError.statusCode = 400;
          customError.message = "Proccess is not running";
          break;

        case error.stdout.match(/No information found for that session/) !=
          null:
          customError.statusCode = 400;
          customError.message = "No information found for that session";
          break;

        case error.stdout.match(/process .* does not exist/) != null:
          customError.statusCode = 400;
          customError.message = "Process does not exist";
          break;

        default:
          customError.message = error.stdout;
          break;
      }
      throw customError;
    }
    throw error;
  }
  return result;
};

module.exports = runAutomateC;
