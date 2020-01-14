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

router.post("/logoff", async (req, res, next) => {
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

  try {
    // Get all sessions and logoff them
    const { stdout } = await exec("qwinsta");
    await Promise.all(stdout.match(/[^\r\n]+/g).map(logoff));
    res.status(202).json({ status: "Logging off" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
