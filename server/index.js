require("dotenv/config");
const express = require("express");
const cors = require("cors");
const { handleDemo } = require("./routes/demo");
const { handleLogin, handleAuthCheck } = require("./routes/auth");
const {
  handleGetStats,
  handleGetRecentActivity,
  handleGetFullActivity,
} = require("./routes/stats");
const {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
} = require("./routes/users");
const { initializeDatabase } = require("./db/config");

function createServer() {
  const app = express();

  // Initialize database connection
  initializeDatabase().catch(console.error);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/check", handleAuthCheck);

  // Stats and activity routes
  app.get("/api/stats", handleGetStats);
  app.get("/api/activity/recent", handleGetRecentActivity);
  app.get("/api/activity/full", handleGetFullActivity);

  return app;
}

module.exports = { createServer };
