import express from 'express';
import StudyItem from '../models/StudyItem.js';

const router = express.Router();

// Get all study items (hierarchical) - using lean() for faster read
router.get('/', async (req, res) => {
    try {
        const items = await StudyItem.find().sort({ order: 1 }).lean();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get children of a specific item - using lean() for faster read
router.get('/:id/children', async (req, res) => {
    try {
        const children = await StudyItem.find({ parentId: req.params.id }).sort({ order: 1 }).lean();
        res.json(children);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create study item
router.post('/', async (req, res) => {
    const item = new StudyItem(req.body);
    try {
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Batch update multiple items (for bulk progress updates)
router.patch('/batch', async (req, res) => {
    try {
        const { updates } = req.body; // Array of { id, data }
        const results = await Promise.all(
            updates.map(({ id, data }) =>
                StudyItem.findByIdAndUpdate(id, data, { new: true })
            )
        );
        res.json(results);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update study item
router.patch('/:id', async (req, res) => {
    try {
        const item = await StudyItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete study item
router.delete('/:id', async (req, res) => {
    try {
        await StudyItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Study item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
