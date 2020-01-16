const { version } = require("../../package.json");
const exec = require("util").promisify(require("child_process").exec); // eslint-disable-line security/detect-child-process
const express = require("express");

// eslint-disable-next-line consistent-return
const logoff = value => {
  // eslint-disable-next-line security/detect-unsafe-regex
  const id = value.match(/((?<id>[1-9][0-9]*)[ ]+)(disc|active)/i);
  if (id) {
    return exec(`logoff ${id.groups.id}`);
  }
};

const router = express.Router();

router.get("/version", (req, res) => {
  res.json({ version });
});

router.post("/reset", async (req, res, next) => {
  // Kill BP process
  try {
    await exec("taskkill /IM automate.exe /F");
  } catch (error) {
    if (
      error.message &&
      error.message.match(/process "automate.exe" not found/)
    ) {
      // Ignore "process not running" error, as the automate.exe does not have to run at the moment
    } else {
      next(error);
      return;
    }
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
    await exec("net stop loginagent");
  } catch (error) {
    if (
      error.message &&
      error.message.match(
        /(The service name is invalid)|(service is not started)/,
      )
    ) {
      // Ignore error, Login Agent service does not have to be used or the service might be alerady stopped
    } else {
      next(error);
      return;
    }
  }

  try {
    await exec("net start loginagent");
  } catch (error) {
    if (
      error.message &&
      error.message.match(
        /(The service name is invalid)|(service has already been started)/,
      )
    ) {
      // Ignore error, Login Agent service does not have to be used or the service might be alerady running
    } else {
      next(error);
      return;
    }
  }

  res.status(200).end();
});

module.exports = router;
