const express = require("express");
const automatec = require("../controllers/automatec");

const router = express.Router();

// Start process
router.post("/", async (req, res, next) => {
  try {
    const result = await automatec("startProcess", req.body.process);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Get status of specific process
router.get("/:sessionId", async (req, res, next) => {
  try {
    const result = await automatec("getStatus", req.params.sessionId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Stop specific process
router.post("/:sessionId/stop", async (req, res, next) => {
  try {
    const result = await automatec("stopProcess", req.params.sessionId);
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
