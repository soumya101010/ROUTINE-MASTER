import express from 'express';
import Reminder from '../models/Reminder.js';

const router = express.Router();

// Get all reminders (Paginated)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const reminders = await Reminder.find()
            .sort({ time: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Reminder.countDocuments();

        res.json({
            data: reminders,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create reminder
router.post('/', async (req, res) => {
    const reminder = new Reminder(req.body);
    try {
        const newReminder = await reminder.save();
        res.status(201).json(newReminder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update reminder
router.patch('/:id', async (req, res) => {
    try {
        const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(reminder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete reminder
router.delete('/:id', async (req, res) => {
    try {
        await Reminder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Reminder deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
