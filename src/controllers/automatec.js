const path = require("path");
const execFile = require("util").promisify(require("child_process").execFile); // eslint-disable-line security/detect-child-process
const xmlBuilder = require("xmlbuilder");

// Variables
const {
  BP_API_DBCONNAME,
  BP_API_EXE_DIR,
  BP_API_PASSWORD,
  BP_API_SSO,
  BP_API_USERNAME,
} = process.env;
const dir =
  BP_API_EXE_DIR ||
  "C:\\Program Files\\Blue Prism Limited\\Blue Prism Automate";
const bin = path.join(dir, "AutomateC.exe");
const idRegexp = new RegExp(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
const nameRegexp = new RegExp(/^[\w ]+$/);

// Helper functions
const throwError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const execAutomateC = async (
  command,
  sessionIdOrProcessName,
  match,
  startupParams,
) => {
  const args = [
    "/dbconname",
    BP_API_DBCONNAME,
    ...(BP_API_SSO === "true"
      ? ["/sso"]
      : ["/user", BP_API_USERNAME, BP_API_PASSWORD]),
    command,
    sessionIdOrProcessName,
    ...(startupParams ? ["/startp", startupParams] : []),
  ];
  const { stdout } = await execFile(bin, args);
  if (match) {
    return stdout.match(match)[1];
  }
  return stdout;
};

// Main exported function
// eslint-disable-next-line consistent-return
const runAutomateC = async (command, argsObject) => {
  const { sessionId, process, inputs = [] } = argsObject;
  try {
    switch (command) {
      case "getStatus":
        if (!idRegexp.test(sessionId)) {
          throwError(
            "Supplied session ID is not a valid session identifier. The correct format is xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            400,
          );
        }
        return await execAutomateC("/status", sessionId, /Status:([a-zA-Z]*)/i);

      case "startProcess":
        if (!nameRegexp.test(process)) {
          throwError("Incorrect process name supplied", 400);
        }

        // Inputs checks
        if (Array.isArray(inputs)) {
          inputs.forEach(input => {
            if (
              typeof input["@name"] !== "string" ||
              typeof input["@value"] !== "string" ||
              input["@type"] !== "text"
            ) {
              throwError(
                "Each item in Inputs array must have '@name', '@value' and '@type' properties. In addition, '@type' must be 'text'",
                400,
              );
            }
          });
        } else {
          throwError("Inputs must be an array", 400);
        }

        // eslint-disable-next-line no-case-declarations
        const xml = xmlBuilder
          .create({ inputs: { input: inputs } }, { headless: true })
          .end();

        return await execAutomateC(
          "/run",
          process,
          /session:([0-9a-z-]*)/i,
          xml,
        );

      case "stopProcess":
        if (!idRegexp.test(sessionId)) {
          throwError(
            "Supplied session ID is not a valid session identifier. The correct format is xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            400,
          );
        }
        await execAutomateC("/requeststop", sessionId);
        return "Stop requested";

      default:
        throwError(
          "Action for this route is not implemented, check server <-> bin file integration part",
          501,
        );
        break;
    }
  } catch (error) {
    const { code, message = "", stdout = "" } = error;

    switch (true) {
      case code === "ENOENT":
        throwError("AutomateC.exe not found, check server config", 500);
        break;

      case stdout.match(/The session .* is not running/) !== null:
        throwError("Process is not running", 400);
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
          "The maximum number of concurrent sessions permitted by the current BluePrism license would be exceeded",
          400,
        );
        break;

      case stdout.match(/could not connect to resource/) !== null:
        throwError("Could not connect to resource", 500);
        break;

      case message.match(/Command failed:/) !== null:
        throwError(
          `Command failed. Details: ${stdout.replace(/(\n)|(\r)/g, "")}`,
          500,
        );
        break;

      default:
        throw error;
    }
  }
};

module.exports = runAutomateC;
