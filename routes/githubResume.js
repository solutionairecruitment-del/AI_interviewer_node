const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const verifyAuthToken = require("../middleware/verifyAuthToken");
const callFlaskAPI = require("../utils/callFlaskAPI");

const upload = multer({ dest: "uploads/" });

// POST /api/generate-github-resume
router.post(
  "/generate-github-resume",
  verifyAuthToken,
  upload.single("resume_file"),
  async (req, res) => {
    const form = new FormData();
    if (req.body.github_link) form.append("github_link", req.body.github_link);
    if (req.body.linkedin_link)
      form.append("linkedin_link", req.body.linkedin_link);
    if (req.file)
      form.append(
        "resume_file",
        fs.createReadStream(req.file.path),
        req.file.originalname
      );
    try {
      const flaskRes = await axios.post(
        "http://localhost:5002/api/generate-github-resume",
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
      if (req.file) fs.unlinkSync(req.file.path);
    }
  }
);

// GET /api/github-profile/:profile_id
router.get("/github-profile/:profile_id", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: `http://localhost:5002/api/github-profile/${req.params.profile_id}`,
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/user-github-profiles
router.get("/user-github-profiles", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5002/api/user-github-profiles",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// POST /api/analyze-github
router.post("/analyze-github", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "POST",
    url: "http://localhost:5002/api/analyze-github",
    headers: { Authorization: req.header("Authorization") },
    body: req.body,
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/health
router.get("/health", async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5002/api/health",
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

module.exports = router;
