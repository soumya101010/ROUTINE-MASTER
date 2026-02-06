import mongoose from 'mongoose';

const studyItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['subject', 'chapter', 'topic'], required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyItem', default: null },
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    notes: String,
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('StudyItem', studyItemSchema);
