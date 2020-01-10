const path = require("path");
const execFile = require("util").promisify(require("child_process").execFile); // eslint-disable-line security/detect-child-process

const dir =
  process.env.BP_API_EXE_PATH ||
  "C:\\Program Files\\Blue Prism Limited\\Blue Prism Automate";
const bin = path.join(dir, "AutomateC.exe");
const args = ["/sso", "/dbconname", "Development"];
const idRegexp = new RegExp(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
const nameRegexp = new RegExp(/^[\w ]+$/);

const throwError = (message, statusCode) => {
  const customError = new Error(message);
  customError.statusCode = statusCode;
  throw customError;
};

// eslint-disable-next-line consistent-return
const runAutomateC = async (action, sessionIdOrProcessName) => {
  let commandResult;

  try {
    switch (action) {
      case "getStatus":
        if (!idRegexp.test(sessionIdOrProcessName)) {
          throwError(
            "Supplied session ID is not a valid session identifier. The correct format is xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            400,
          );
        }
        commandResult = await execFile(bin, [
          ...args,
          "/status",
          sessionIdOrProcessName,
        ]);
        return {
          status: commandResult.stdout.match(/Status:([a-zA-Z]*)/i)[1],
        };

      case "startProcess":
        if (!nameRegexp.test(sessionIdOrProcessName)) {
          throwError("Incorrect process name supplied", 400);
        }
        commandResult = await execFile(bin, [
          ...args,
          "/run",
          sessionIdOrProcessName,
        ]);
        return {
          sessionId: commandResult.stdout.match(/session:([0-9a-z-]*)/i)[1],
        };

      case "stopProcess":
        if (!idRegexp.test(sessionIdOrProcessName)) {
          throwError(
            "Supplied session ID is not a valid session identifier. The correct format is xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            400,
          );
        }
        commandResult = await execFile(bin, [
          ...args,
          "/requeststop",
          sessionIdOrProcessName,
        ]);
        return {
          status: "Stop requested",
        };

      default:
        throwError(
          "Action for this route is not implemented, check server <-> bin file integration part",
          501,
        );
        break;
    }
  } catch (error) {
    const { code, stdout = "" } = error;

    switch (true) {
      case code === "ENOENT":
        throwError("AutomateC.exe not found, check server config", 500);
        break;

      case stdout.match(/The session .* is not running/) !== null:
        throwError("Proccess is not running", 400);
        break;

      case stdout.match(/No information found for that session/) !== null:
        throwError("No information found for that session", 400);
        break;

      case stdout.match(/Could not find the session with the ID\/number/) !==
        null:
        throwError("Could not find the session with the ID/number", 400);
        break;

      case stdout.match(/process .* does not exist/) !== null:
        throwError("Process does not exist", 400);
        break;

      case stdout.match(
        /can not create session to run process - The maximum number of concurrent sessions permitted by the current license would be exceeded/,
      ) !== null:
        throwError(
          "The maximum number of concurrent sessions permitted by the current license would be exceeded",
          400,
        );
        break;

      default:
        throw error;
    }
  }
};

module.exports = runAutomateC;
