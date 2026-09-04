const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth.routes');
const conversationRoutes = require('./routes/conversation.routes');
const courseRoutes = require('./routes/course.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const taskRoutes = require('./routes/task.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes = require('./routes/ai.routes');
const materialRoutes = require('./routes/material.routes');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// Connect to MongoDB
connectDB();

// Security & Standard Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174', // restrict CORS to frontend origin
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // Auth routes manage their own auth limiters
app.use('/api/ai', aiRoutes);

// Protected Routes
app.use('/api/conversations', authMiddleware, conversationRoutes);
app.use('/api/courses', authMiddleware, courseRoutes);
app.use('/api/assignments', authMiddleware, assignmentRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/materials', authMiddleware, materialRoutes);

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
