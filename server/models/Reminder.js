import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['medication', 'meal', 'general'], default: 'general' },
  time: { type: String, required: true }, // HH:MM format
  daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sunday, 6=Saturday
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Reminder', reminderSchema);
