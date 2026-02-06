import express from 'express';
import multer from 'multer';
import path from 'path';
import Document from '../models/Document.js';
import { storage } from '../config/cloudinary.js';

const router = express.Router();

// Configure multer for file uploads using Cloudinary storage
const upload = multer({ storage: storage });

// Get all documents
router.get('/', async (req, res) => {
    try {
        const documents = await Document.find().sort({ uploadDate: -1 });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload document
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const document = new Document({
            title: req.body.title || req.file.originalname,
            filename: req.file.originalname,
            filepath: req.file.path,
            category: req.body.category,
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        });

        const newDocument = await document.save();
        res.status(201).json(newDocument);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update document metadata
router.patch('/:id', async (req, res) => {
    try {
        const document = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(document);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete document
router.delete('/:id', async (req, res) => {
    try {
        await Document.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
