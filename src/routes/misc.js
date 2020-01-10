const { version } = require("../../package.json");
const execFile = require("util").promisify(require("child_process").execFile); // eslint-disable-line security/detect-child-process
const express = require("express");

const router = express.Router();

router.get("/version", (req, res) => {
  res.json({ version });
});

router.post("/logoff", async (req, res, next) => {
  try {
    await execFile("logoff");
    res.status(202).json({ status: "Logging off" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
