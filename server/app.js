const express = require('express');
const cors = require('cors');
// Added imports
const fileRoutes = require("./routes/files");

// Added route registration

const app = express();

app.use("/api/files", fileRoutes);
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Chat server is running');
});

// TODO: Add your API routes like /api/chat/messages, etc.
// const chatRoutes = require('./routes/chat');
// app.use('/api/chat', chatRoutes);

module.exports = app;
