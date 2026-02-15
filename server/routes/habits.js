import express from 'express';
import Habit from '../models/Habit.js';

const router = express.Router();

// GET all habits with auto-reset logic
router.get('/', async (req, res) => {
    try {
        const habits = await Habit.find().sort({ createdAt: -1 });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Auto-reset streaks for missed days
        const updated = await Promise.all(habits.map(async (habit) => {
            if (habit.lastCompletedDate) {
                const lastCompleted = new Date(habit.lastCompletedDate);
                lastCompleted.setHours(0, 0, 0, 0);

                // If last completed was before yesterday, streak is broken
                if (lastCompleted < yesterday) {
                    habit.currentStreak = 0;
                    await habit.save();
                }
            }
            return habit;
        }));

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET stats for dashboard badge
router.get('/stats', async (req, res) => {
    try {
        const habits = await Habit.find();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let maxStreak = 0;
        let completedToday = 0;

        habits.forEach(h => {
            if (h.currentStreak > maxStreak) maxStreak = h.currentStreak;
            if (h.lastCompletedDate) {
                const last = new Date(h.lastCompletedDate);
                last.setHours(0, 0, 0, 0);
                if (last.getTime() === today.getTime()) completedToday++;
            }
        });

        res.json({
            total: habits.length,
            completedToday,
            maxStreak
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create habit
router.post('/', async (req, res) => {
    try {
        const habit = new Habit(req.body);
        await habit.save();
        res.status(201).json(habit);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PATCH mark habit complete for today
router.patch('/:id/complete', async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) return res.status(404).json({ error: 'Habit not found' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already completed today
        const alreadyDone = habit.completedDates.some(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date.getTime() === today.getTime();
        });

        if (!alreadyDone) {
            habit.completedDates.push(today);
            habit.lastCompletedDate = today;

            // Check if yesterday was completed to continue streak
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDone = habit.completedDates.some(d => {
                const date = new Date(d);
                date.setHours(0, 0, 0, 0);
                return date.getTime() === yesterday.getTime();
            });

            if (yesterdayDone || habit.currentStreak === 0) {
                habit.currentStreak += 1;
            } else {
                habit.currentStreak = 1;
            }

            if (habit.currentStreak > habit.longestStreak) {
                habit.longestStreak = habit.currentStreak;
            }

            await habit.save();
        }

        res.json(habit);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE habit
router.delete('/:id', async (req, res) => {
    try {
        const habit = await Habit.findByIdAndDelete(req.params.id);
        if (!habit) return res.status(404).json({ error: 'Habit not found' });
        res.json({ message: 'Habit deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
