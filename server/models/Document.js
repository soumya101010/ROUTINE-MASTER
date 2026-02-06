import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    filename: { type: String, required: true },
    filepath: { type: String, required: true },
    category: String,
    tags: [String],
    uploadDate: { type: Date, default: Date.now },
    fileSize: Number,
    mimeType: String
});

export default mongoose.model('Document', documentSchema);
