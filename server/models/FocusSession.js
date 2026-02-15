import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
    linkedTo: {
        itemType: { type: String, enum: ['routine', 'study', 'custom'] },
        itemId: { type: mongoose.Schema.Types.ObjectId },
        label: String
    },
    duration: { type: Number, required: true }, // in minutes
    sessionType: { type: String, enum: ['custom', 'pomodoro'], default: 'custom' },
    completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('FocusSession', focusSessionSchema);
