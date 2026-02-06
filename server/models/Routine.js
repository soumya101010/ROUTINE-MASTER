import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['morning', 'night', 'off-day', 'custom'], required: true, index: true },
    tasks: [{
        title: String,
        time: String,
        completed: { type: Boolean, default: false }
    }],
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    isTemplate: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now }
});

// Index for day-based queries
routineSchema.index({ daysOfWeek: 1 });

export default mongoose.model('Routine', routineSchema);
