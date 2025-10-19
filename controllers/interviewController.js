const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const Interview = require("../models/Interview");

const startInterview = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const username = decoded.username;
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username not found in token",
      });
    }

    const interviewId = uuidv4();

    const newInterview = new Interview({
      interviewId,
      username,
    });

    await newInterview.save();

    res.status(201).json({
      success: true,
      message: "Interview started successfully",
      data: newInterview,
    });
  } catch (error) {
    console.error("Error starting interview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start interview",
      error: error.message,
    });
  }
};

module.exports = { startInterview };
