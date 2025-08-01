const express = require('express');
const cors = require('cors');

const app = express();

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
