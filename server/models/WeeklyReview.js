import mongoose from 'mongoose';

const weeklyReviewSchema = new mongoose.Schema({
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    summary: {
        routinesCompleted: { type: Number, default: 0 },
        routinesMissed: { type: Number, default: 0 },
        studyProgressChange: { type: Number, default: 0 },
        totalExpenses: { type: Number, default: 0 },
        totalIncome: { type: Number, default: 0 },
        focusMinutes: { type: Number, default: 0 }
    },
    reflections: {
        wentWell: { type: String, default: '' },
        didntGoWell: { type: String, default: '' },
        improvements: { type: String, default: '' }
    }
}, { timestamps: true });

export default mongoose.model('WeeklyReview', weeklyReviewSchema);
