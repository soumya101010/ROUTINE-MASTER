import express from 'express';
import Goal from '../models/Goal.js';

const router = express.Router();

// GET all goals
router.get('/', async (req, res) => {
    try {
        const goals = await Goal.find().sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET goal stats for dashboard badge
router.get('/stats', async (req, res) => {
    try {
        const total = await Goal.countDocuments();
        const active = await Goal.countDocuments({ status: { $ne: 'completed' } });
        const completed = await Goal.countDocuments({ status: 'completed' });
        res.json({ total, active, completed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create goal
router.post('/', async (req, res) => {
    try {
        const goal = new Goal(req.body);
        await goal.save();
        res.status(201).json(goal);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PATCH update goal
router.patch('/:id', async (req, res) => {
    try {
        const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!goal) return res.status(404).json({ error: 'Goal not found' });
        res.json(goal);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE goal
router.delete('/:id', async (req, res) => {
    try {
        const goal = await Goal.findByIdAndDelete(req.params.id);
        if (!goal) return res.status(404).json({ error: 'Goal not found' });
        res.json({ message: 'Goal deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
