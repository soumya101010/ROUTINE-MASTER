import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    date: { type: Date, required: true, default: Date.now },
    subject: { type: String, required: true },
    type: { type: String, enum: ['theory', 'practical'], required: true },
    status: { type: String, enum: ['present', 'absent'], default: 'present' },
    createdAt: { type: Date, default: Date.now }
});

// Index for querying by date
attendanceSchema.index({ date: -1 });

export default mongoose.model('Attendance', attendanceSchema);
