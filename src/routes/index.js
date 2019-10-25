const express = require("express");
const path = require("path");
const { execFile } = require("child_process");

const dir = process.env.BP_PATH || [
  "c:",
  "Program Files",
  "Blue Prism Limited",
  "Blue Prism Automate",
];

const exe = path.join(...dir, "AutomateC.exe");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(process.env.NODE_ENV || {});
});

// const wrapper = fn => (req, res, next) =>
//   fn(req, res, next).catch(console.error);

router.get("/processes/:id", (req, res, next) => {
  // TODO: add check for ID - unsecure
  execFile(
    exe,
    ["/sso", "/dbconname", "Development", "/status", req.params.id],
    (err, stdout, stderr) => {
      if (stdout && stdout.match("No information found for that session")) {
        res.status(400);
        next(stdout);
      }

      if (err) {
        next(stderr || stdout || err);
      } else {
        res.status(200);
        res.json({ status: stdout });
      }
    },
  );
});

module.exports = router;
