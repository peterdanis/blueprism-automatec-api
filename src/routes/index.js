const express = require("express");
const fs = require("fs");

const router = express.Router();

/* GET home page. */
router.get("/", (req, res) => {
  res.send(process.env.NODE_ENV);
});

module.exports = router;
