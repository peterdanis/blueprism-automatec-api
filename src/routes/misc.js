const { version } = require("../../package.json");
const exec = require("util").promisify(require("child_process").exec); // eslint-disable-line security/detect-child-process
const express = require("express");

const { BP_API_FULL_RESET } = process.env;

// eslint-disable-next-line consistent-return
const logoff = (value) => {
  // eslint-disable-next-line security/detect-unsafe-regex
  const id = value.match(/((?<id>[1-9][0-9]*)[ ]+)(disc|active)/i);
  if (id) {
    return exec(`logoff ${id.groups.id}`);
  }
};

const execHelper = async (command, match) => {
  try {
    await exec(command);
  } catch (error) {
    if (error.message && error.message.match(match)) {
      // Ignore selected errors
    } else {
      throw error;
    }
  }
};

const router = express.Router();

router.get("/version", (req, res) => {
  res.json({ version });
});

router.post("/reset", async (req, res, next) => {
  // Kill BP process
  try {
    await execHelper(
      "taskkill /IM automate.exe /F",
      /process "automate.exe" not found/,
    );
  } catch (error) {
    next(error);
    return;
  }

  if (BP_API_FULL_RESET !== "true") {
    return;
  }

  // Forcibly logoff all users
  try {
    const { stdout } = await exec("qwinsta");
    await Promise.all(stdout.match(/[^\r\n]+/g).map(logoff));
  } catch (error) {
    next(error);
    return;
  }

  // Restart Login Agent service
  try {
    await execHelper(
      "net stop loginagent",
      /(The service name is invalid)|(service is not started)/,
    );
  } catch (error) {
    next(error);
    return;
  }

  try {
    await execHelper(
      "net start loginagent",
      /(The service name is invalid)|(service has already been started)/,
    );
  } catch (error) {
    next(error);
    return;
  }

  res.status(200).end();
});

module.exports = router;
