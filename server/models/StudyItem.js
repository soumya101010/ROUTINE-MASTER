import mongoose from 'mongoose';

const studyItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['subject', 'chapter', 'topic'], required: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyItem', default: null, index: true },
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    notes: String,
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: Date.now }
});

// Compound index for hierarchical queries
studyItemSchema.index({ parentId: 1, order: 1 });

export default mongoose.model('StudyItem', studyItemSchema);
