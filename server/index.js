require("dotenv/config");
const express = require("express");
const cors = require("cors");
const { handleDemo } = require("./routes/demo");
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app'); // your Express app
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ".../client/pages", // Or your frontend URL
    methods: ["GET", "POST"]
  }
});

// Socket event handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('private_message', ({ to, message }) => {
    io.to(to).emit('private_message', message);
  });

  socket.on('join', (userId) => {
    socket.join(userId); // Join room with user's ID
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

module.exports = { server, io };

const {
  handleLogin,
  handleRegister,
  handleAuthCheck,
  authenticateToken,
} = require("./routes/auth");
const {
  handleGetStats,
  handleGetRecentActivity,
  handleGetFullActivity,
} = require("./routes/stats");
const {
  handleGetProjects,
  handleCreateProject,
  handleUpdateProject,
} = require("./routes/projects");
const {
  handleGetTasks,
  handleCreateTask,
  handleUpdateTask,
} = require("./routes/tasks");
const {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
} = require("./routes/users");
const {
  handleGetMessages,
  handleSendMessage,
  handleGetPrivateMessages,
  handleSendPrivateMessage,
  handleGetUserList,
  handleGetUnreadCount,
} = require("./routes/chat");
const { connectToDatabase } = require("./db/connection");

function createServer() {
  const app = express();

  // Initialize database connection
  connectToDatabase().catch(console.error);

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
  app.post("/api/auth/register", handleRegister);
  app.get("/api/auth/check", handleAuthCheck);

  // Stats and activity routes
  app.get("/api/stats", handleGetStats);
  app.get("/api/activity/recent", handleGetRecentActivity);
  app.get("/api/activity/full", handleGetFullActivity);

  // Project routes
  app.get("/api/projects", handleGetProjects);
  app.post("/api/projects", handleCreateProject);
  app.put("/api/projects/:id", handleUpdateProject);

  // Task routes
  app.get("/api/tasks", handleGetTasks);
  app.post("/api/tasks", handleCreateTask);
  app.put("/api/tasks/:id", handleUpdateTask);

  // User management routes
  app.get("/api/users", handleGetUsers);
  app.post("/api/users", handleCreateUser);
  app.put("/api/users/:id", handleUpdateUser);
  app.delete("/api/users/:id", handleDeleteUser);

  // Chat routes
  app.get("/api/chat/messages", handleGetMessages);
  app.post("/api/chat/messages", handleSendMessage);
  app.get("/api/chat/private/:userId", handleGetPrivateMessages);
  app.post("/api/chat/private/:userId", handleSendPrivateMessage);
  app.get("/api/chat/users", handleGetUserList);
  app.get("/api/chat/unread", handleGetUnreadCount);
  return app;
}

module.exports = { createServer };
