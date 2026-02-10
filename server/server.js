import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';

// Import routes
import reminderRoutes from './routes/reminders.js';
import routineRoutes from './routes/routines.js';
import studyRoutes from './routes/study.js';
import expenseRoutes from './routes/expenses.js';
import documentRoutes from './routes/documents.js';
import attendanceRoutes from './routes/attendance.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression()); // Compress all responses
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path, stat) => {
        res.set('Content-Disposition', 'inline');
    }
}));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/routinemaster';

const clientOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4 // Use IPv4, skip IPv6
};

mongoose.connect(MONGODB_URI, clientOptions)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/reminders', reminderRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'RoutineMaster API is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
