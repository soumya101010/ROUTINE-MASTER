import express from 'express';
import Routine from '../models/Routine.js';

const router = express.Router();

// Get all routines
router.get('/', async (req, res) => {
    try {
        const routines = await Routine.find();
        res.json(routines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create routine
router.post('/', async (req, res) => {
    const routine = new Routine(req.body);
    try {
        const newRoutine = await routine.save();
        res.status(201).json(newRoutine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update routine
router.patch('/:id', async (req, res) => {
    try {
        const routine = await Routine.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(routine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete routine
router.delete('/:id', async (req, res) => {
    try {
        await Routine.findByIdAndDelete(req.params.id);
        res.json({ message: 'Routine deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
