import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
    title: { type: String, required: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: Date },
    completedDates: [{ type: Date }]
}, { timestamps: true });

export default mongoose.model('Habit', habitSchema);
