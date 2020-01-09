const path = require("path");
const execFile = require("util").promisify(require("child_process").execFile); // eslint-disable-line security/detect-child-process

const dir =
  process.env.BP_API_EXE_PATH ||
  "C:\\Program Files\\Blue Prism Limited\\Blue Prism Automate";
const bin = path.join(dir, "AutomateC.exe");
const args = ["/sso", "/dbconname", "Development"];
const idRegexp = new RegExp(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
const nameRegexp = new RegExp(/^[\w ]+$/);

const runAutomateC = async (action, sessionIdOrProcessName) => {
  let commandResult;
  const customError = new Error();

  try {
    switch (action) {
      case "getStatus":
        if (!idRegexp.test(sessionIdOrProcessName)) {
          customError.statusCode = 400;
          customError.message =
            "Supplied session ID is not a valid session identifier. The correct format is xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
          throw customError;
        }
        commandResult = await execFile(bin, [
          ...args,
          "/status",
          sessionIdOrProcessName,
        ]);
        return { status: commandResult.stdout.match(/Status:([a-zA-Z]*)/i)[1] };

      case "startProcess":
        if (!nameRegexp.test(sessionIdOrProcessName)) {
          customError.statusCode = 400;
          customError.message = "Incorrect process name supplied";
          throw customError;
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
          customError.statusCode = 400;
          customError.message =
            "Supplied session ID is not a valid session identifier. The correct format is xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
          throw customError;
        }
        commandResult = await execFile(bin, [
          ...args,
          "/requeststop",
          sessionIdOrProcessName,
        ]);
        return { status: "Stop requested" };

      default:
        customError.message =
          "Action for this route is not implemented, check server <-> bin file integration part";
        throw customError;
    }
  } catch (error) {
    const { code, message, stdout = "" } = error;

    switch (true) {
      case code === "ENOENT":
        customError.message = "AutomateC.exe not found, check server config";
        break;

      case stdout.match(/The session .* is not running/) !== null:
        customError.statusCode = 400;
        customError.message = "Proccess is not running";
        break;

      case stdout.match(/No information found for that session/) !== null:
        customError.statusCode = 400;
        customError.message = "No information found for that session";
        break;

      case stdout.match(/Could not find the session with the ID\/number/) !==
        null:
        customError.statusCode = 400;
        customError.message = "Could not find the session with the ID/number";
        break;

      case stdout.match(/process .* does not exist/) !== null:
        customError.statusCode = 400;
        customError.message = "Process does not exist";
        break;

      case stdout.match(
        /can not create session to run process - The maximum number of concurrent sessions permitted by the current license would be exceeded/,
      ) !== null:
        customError.statusCode = 400;
        customError.message =
          "The maximum number of concurrent sessions permitted by the current license would be exceeded";
        break;

      default:
        customError.message = stdout || message;
        break;
    }
    throw customError;
  }
};

module.exports = runAutomateC;
