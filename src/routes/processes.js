const express = require("express");
const automatec = require("../controllers/automatec");

const router = express.Router();

// Start process
router.post("/", async (req, res, next) => {
  const { inputs, process } = req.body;

  try {
    const sessionId = await automatec("startProcess", {
      inputs,
      process,
    });
    res.status(201).json({ sessionId });
  } catch (error) {
    next(error);
  }
});

// Get status of specific process
router.get("/:sessionId", async (req, res, next) => {
  const { sessionId } = req.params;
  try {
    const status = await automatec("getStatus", { sessionId });
    res.status(200).json({ status });
  } catch (error) {
    next(error);
  }
});

// Stop specific process
router.post("/:sessionId/stop", async (req, res, next) => {
  const { sessionId } = req.params;
  try {
    const status = await automatec("stopProcess", { sessionId });
    res.status(202).json({
      status,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
