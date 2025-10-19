const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const verifyAuthToken = require("../middleware/verifyAuthToken");
const callFlaskAPI = require("../utils/callFlaskAPI");

const upload = multer({ dest: "uploads/" });

// POST /api/transcribe
router.post(
  "/transcribe",
  verifyAuthToken,
  upload.single("video"),
  async (req, res) => {
    const form = new FormData();
    form.append(
      "video",
      fs.createReadStream(req.file.path),
      req.file.originalname
    );
    if (req.body.target_language)
      form.append("target_language", req.body.target_language);
    try {
      const flaskRes = await axios.post(
        "https://contentserver.skillara.asia/api/transcribe",
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: req.header("Authorization"),
          },
          maxContentLength: Infinity, // Important for large video files
          maxBodyLength: Infinity,
          timeout: 1200000, // 2 minutes timeout in milliseconds
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

// POST /api/transcribelink
router.post(
  "/transcribelink",
  verifyAuthToken,
  upload.none(),
  async (req, res) => {
    const form = new FormData();
    form.append("youtube_link", req.body.youtube_link);
    if (req.body.target_language)
      form.append("target_language", req.body.target_language);
    try {
      const flaskRes = await axios.post(
        "https://contentserver.skillara.asia/api/transcribelink",
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
    }
  }
);

// GET /api/summary
router.get("/summary", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "https://contentserver.skillara.asia/api/summary",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/flashcards
router.get("/flashcards", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "https://contentserver.skillara.asia/api/flashcards",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/quiz
router.get("/quiz", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "https://contentserver.skillara.asia/api/quiz",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/exercise
router.get("/exercise", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "https://contentserver.skillara.asia/api/exercise",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// POST /api/generate-note
router.post(
  "/generate-note",
  verifyAuthToken,
  upload.single("file"),
  async (req, res) => {
    const form = new FormData();
    form.append(
      "file",
      fs.createReadStream(req.file.path),
      req.file.originalname
    );
    if (req.body.target_language)
      form.append("target_language", req.body.target_language);
    try {
      const flaskRes = await axios.post(
        "https://contentserver.skillara.asia/api/generate-note",
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

// GET /api/user/transcriptions
router.get("/user/transcriptions", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "https://contentserver.skillara.asia/api/user/transcriptions",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/user/notes
router.get("/user/notes", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "https://contentserver.skillara.asia/api/user/notes",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/user/history
router.get("/user/history", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "https://contentserver.skillara.asia/api/user/history",
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/transcription/:transcription_id
router.get(
  "/transcription/:transcription_id",
  verifyAuthToken,
  async (req, res) => {
    const flaskResponse = await callFlaskAPI({
      method: "GET",
      url: `https://contentserver.skillara.asia/api/transcription/${req.params.transcription_id}`,
      headers: { Authorization: req.header("Authorization") },
    });
    res.status(flaskResponse.status).json(flaskResponse.data);
  }
);

// GET /api/note/:note_id
router.get("/note/:note_id", verifyAuthToken, async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: `https://contentserver.skillara.asia/api/note/${req.params.note_id}`,
    headers: { Authorization: req.header("Authorization") },
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

// GET /api/transcription/:transcription_id/summary
router.get(
  "/transcription/:transcription_id/summary",
  verifyAuthToken,
  async (req, res) => {
    const flaskResponse = await callFlaskAPI({
      method: "GET",
      url: `https://contentserver.skillara.asia/api/transcription/${req.params.transcription_id}/summary`,
      headers: { Authorization: req.header("Authorization") },
    });
    res.status(flaskResponse.status).json(flaskResponse.data);
  }
);

// GET /api/transcription/:transcription_id/flashcards
router.get(
  "/transcription/:transcription_id/flashcards",
  verifyAuthToken,
  async (req, res) => {
    const flaskResponse = await callFlaskAPI({
      method: "GET",
      url: `https://contentserver.skillara.asia/api/transcription/${req.params.transcription_id}/flashcards`,
      headers: { Authorization: req.header("Authorization") },
    });
    res.status(flaskResponse.status).json(flaskResponse.data);
  }
);

// GET /api/transcription/:transcription_id/quiz
router.get(
  "/transcription/:transcription_id/quiz",
  verifyAuthToken,
  async (req, res) => {
    const flaskResponse = await callFlaskAPI({
      method: "GET",
      url: `https://contentserver.skillara.asia/api/transcription/${req.params.transcription_id}/quiz`,
      headers: { Authorization: req.header("Authorization") },
    });
    res.status(flaskResponse.status).json(flaskResponse.data);
  }
);

// GET /api/transcription/:transcription_id/exercises
router.get(
  "/transcription/:transcription_id/exercises",
  verifyAuthToken,
  async (req, res) => {
    const flaskResponse = await callFlaskAPI({
      method: "GET",
      url: `https://contentserver.skillara.asia/api/transcription/${req.params.transcription_id}/exercises`,
      headers: { Authorization: req.header("Authorization") },
    });
    res.status(flaskResponse.status).json(flaskResponse.data);
  }
);

// POST /api/transcription/:transcription_id/regenerate/:content_type
router.post(
  "/transcription/:transcription_id/regenerate/:content_type",
  verifyAuthToken,
  async (req, res) => {
    const flaskResponse = await callFlaskAPI({
      method: "POST",
      url: `https://contentserver.skillara.asia/api/transcription/${req.params.transcription_id}/regenerate/${req.params.content_type}`,
      headers: { Authorization: req.header("Authorization") },
      body: req.body,
    });
    res.status(flaskResponse.status).json(flaskResponse.data);
  }
);

// GET /api/health
router.get("/health", async (req, res) => {
  const flaskResponse = await callFlaskAPI({
    method: "GET",
    url: "http://localhost:5009/api/health",
  });
  res.status(flaskResponse.status).json(flaskResponse.data);
});

module.exports = router;
