const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();
require("dotenv").config();

// Trust proxy headers (important if app is behind a reverse proxy / load balancer)
app.set("trust proxy", 1);

// Connect to MongoDB
const connectToDb = require("./config/connectToDb");
connectToDb();

// Connect to Redis
const redisService = require("./utils/redisService");
redisService.connect().catch(console.error);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

// Apply rate limiting to all routes
app.use(limiter);

// Auth-specific rate limiting (more strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 5 requests per windowMs for auth routes
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const tpoRoutes = require("./routes/tpo");
const interviewRoutes = require("./routes/interview");
const githubResumeRoutes = require("./routes/githubResume");
const resumeRoutes = require("./routes/resume");
const contentRoutes = require("./routes/content");
// const interviewResponseRouter = require("./routes/interviewResponse");
const profileRoutes = require("./routes/profile");

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tpo", tpoRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/githubresume", githubResumeRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/content", contentRoutes);
// app.use("/api", interviewResponseRouter);
app.use("/api/profile", profileRoutes);

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Welcome to the AI Interviewer API");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

module.exports = app;
