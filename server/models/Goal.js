import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['short-term', 'long-term'], default: 'short-term' },
    deadline: { type: Date },
    linkedItems: [{
        itemType: { type: String, enum: ['routine', 'study', 'expense'] },
        itemId: { type: mongoose.Schema.Types.ObjectId },
        label: String
    }],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['on-track', 'behind', 'completed'], default: 'on-track' }
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);
