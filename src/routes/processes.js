const express = require("express");
const automatec = require("../controllers/automatec");

const router = express.Router();

// Start process
router.post("/", async (req, res, next) => {
  try {
    const sessionId = await automatec("startProcess", req.body.process);
    res.status(201).json({ sessionId });
  } catch (error) {
    next(error);
  }
});

// Get status of specific process
router.get("/:sessionId", async (req, res, next) => {
  try {
    const status = await automatec("getStatus", req.params.sessionId);
    res.status(200).json({ status });
  } catch (error) {
    next(error);
  }
});

// Stop specific process
router.post("/:sessionId/stop", async (req, res, next) => {
  try {
    const status = await automatec("stopProcess", req.params.sessionId);
    res.status(202).json({ status });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
