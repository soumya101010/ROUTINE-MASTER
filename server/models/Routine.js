import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['morning', 'night', 'off-day', 'custom'], required: true },
    tasks: [{
        title: String,
        time: String,
        completed: { type: Boolean, default: false }
    }],
    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // Days this routine applies to
    isTemplate: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Routine', routineSchema);
