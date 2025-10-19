const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const verifyAuthToken = require("../middleware/verifyAuthToken");
const callFlaskAPI = require("../utils/callFlaskAPI");

const upload = multer({ dest: "uploads/" });

// Proxy GET /api/test_auth
router.get("/test_auth", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5009/api/test_auth",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// Proxy POST /api/interview/upload
router.post(
  "/upload",
  verifyAuthToken,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    const form = new FormData();
    if (req.files && req.files.video) {
      form.append(
        "video",
        fs.createReadStream(req.files.video[0].path),
        req.files.video[0].originalname
      );
    }
    if (req.files && req.files.image) {
      form.append(
        "image",
        fs.createReadStream(req.files.image[0].path),
        req.files.image[0].originalname
      );
    }
    try {
      const flaskRes = await axios.post(
        "http://localhost:5009/api/interview/upload",
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
      // Clean up uploaded files
      if (req.files && req.files.video) fs.unlinkSync(req.files.video[0].path);
      if (req.files && req.files.image) fs.unlinkSync(req.files.image[0].path);
    }
  }
);

// Proxy POST /api/interview/analyze-video
router.post(
  "/analyze-video",
  verifyAuthToken,
  upload.single("video"),
  async (req, res) => {
    const form = new FormData();
    form.append(
      "video",
      fs.createReadStream(req.file.path),
      req.file.originalname
    );
    try {
      const flaskRes = await axios.post(
        "http://localhost:5009/api/interview/analyze-video",
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

// Proxy POST /api/interview/analyze-attire
router.post(
  "/analyze-attire",
  verifyAuthToken,
  upload.single("image"),
  async (req, res) => {
    const form = new FormData();
    form.append(
      "image",
      fs.createReadStream(req.file.path),
      req.file.originalname
    );
    try {
      const flaskRes = await axios.post(
        "http://localhost:5009/api/interview/analyze-attire",
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

// Proxy GET /api/interview/results
router.get("/results", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5009/api/interview/results",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// Proxy GET /api/interview/results/:interview_id
router.get("/results/:interview_id", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: `http://localhost:5009/api/interview/results/${req.params.interview_id}`,
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// Proxy GET /api/interview/latest
router.get("/latest", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5009/api/interview/latest",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// Proxy GET /api/interview/statistics
router.get("/statistics", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5009/api/interview/statistics",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// Proxy GET /api/user/profile
router.get("/user/profile", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5009/api/user/profile",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// Proxy GET /api/health (no auth required)
router.get("/health", async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "https://6a928124edc7.ngrok-free.app/api/health",
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// CONFIDENCE

// Proxy POST /api/confidence/analyze
router.post(
  "/confidence/analyze",
  verifyAuthToken,
  upload.single("video"),
  async (req, res) => {
    const form = new FormData();
    form.append(
      "video",
      fs.createReadStream(req.file.path),
      req.file.originalname
    );
    try {
      const flaskRes = await axios.post(
        "http://localhost:5009/api/confidence/analyze",
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

// Proxy GET /api/confidence/history
router.get("/confidence/history", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5009/api/confidence/history",
    headers: { Authorization: req.header("Authorization") },
    body: req.query, // If Flask expects query params, pass them
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// Proxy GET /api/confidence/latest
router.get("/confidence/latest", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5009/api/confidence/latest",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// Proxy GET /api/confidence/stats
router.get("/confidence/stats", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5009/api/confidence/stats",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// Proxy DELETE /api/confidence/:confidence_id
router.delete(
  "/confidence/:confidence_id",
  verifyAuthToken,
  async (req, res) => {
    const flaskResponse = await callFlaskAPI({
      method: "DELETE",
      url: `http://localhost:5009/api/confidence/${req.params.confidence_id}`,
      headers: { Authorization: req.header("Authorization") },
    });
    res.status(flaskResponse.status).json(flaskResponse.data);
  }
);

module.exports = router;
