const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const verifyAuthToken = require("../middleware/verifyAuthToken");
const callFlaskAPI = require("../utils/callFlaskAPI");

const upload = multer({ dest: "uploads/" });

// POST /api/generate-resume
router.post(
  "/generate-resume",
  verifyAuthToken,
  upload.single("resume_file"),
  async (req, res) => {
    const form = new FormData();
    form.append(
      "resume_file",
      fs.createReadStream(req.file.path),
      req.file.originalname
    );
    if (req.body.job_description)
      form.append("job_description", req.body.job_description);
    try {
      const flaskRes = await axios.post(
        `${process.env.RESUME_SERVER_FLASK}/api/generate-resume`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: req.header("Authorization"),
          },
        }
      );
      res.status(flaskRes.status).json(flaskRes.data);
    } catch (error) {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: error.message });
    } finally {
      fs.unlinkSync(req.file.path);
    }
  }
);

// GET /api/resume/:resume_id
router.get("/:resume_id", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: `${process.env.RESUME_SERVER_FLASK}/api/resume/${req.params.resume_id}`,
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/user-resumes
router.get("/user-resumes", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: `${process.env.RESUME_SERVER_FLASK}/api/user-resumes`,
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/health
router.get("/health", async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5001/api/health",
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

module.exports = router;
