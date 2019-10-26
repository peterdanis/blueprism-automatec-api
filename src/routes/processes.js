const express = require("express");
const path = require("path");
const execFile = require("util").promisify(require("child_process").execFile);

const router = express.Router();
const dir = process.env.BP_PATH || [
  "C:",
  "Program Files",
  "Blue Prism Limited",
  "Blue Prism Automate",
];
const binPath = path.join(...dir, "AutomateC.exe");

router.post("/", async (req, res, next) => {
  const args = ["/sso", "/dbconname", "Development", "/run", req.body.process];

  try {
    const { stdout } = await execFile(binPath, args);

    res.json({ status: stdout });
  } catch (err) {
    res.status(500);
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  // TODO: add check for ID - unsecure
  const args = ["/sso", "/dbconname", "Development", "/status", req.params.id];

  try {
    const { stdout } = await execFile(binPath, args);

    res.json({ status: stdout });
  } catch (err) {
    res.status(500);
    next(err);
  }
});

router.post("/:id/stop", async (req, res, next) => {
  // TODO: add check for ID - unsecure
  const args = [
    "/sso",
    "/dbconname",
    "Development",
    "/requeststop",
    req.params.id,
  ];

  try {
    const { stdout } = await execFile(binPath, args);

    res.json({ status: stdout });
  } catch (err) {
    res.status(500);
    next(err);
  }
});

module.exports = router;
