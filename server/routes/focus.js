import express from 'express';
import FocusSession from '../models/FocusSession.js';

const router = express.Router();

// GET session history + stats
router.get('/', async (req, res) => {
    try {
        const sessions = await FocusSession.find().sort({ completedAt: -1 }).limit(50);

        // Calculate streak (consecutive days with at least one session)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let streak = 0;
        let checkDate = new Date(today);

        while (true) {
            const dayStart = new Date(checkDate);
            const dayEnd = new Date(checkDate);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const hasSession = await FocusSession.findOne({
                completedAt: { $gte: dayStart, $lt: dayEnd }
            });

            if (hasSession) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Total focus time this week
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekSessions = await FocusSession.find({
            completedAt: { $gte: weekStart }
        });
        const weeklyMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);

        res.json({
            sessions,
            streak,
            weeklyMinutes,
            totalSessions: await FocusSession.countDocuments()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET stats for dashboard badge
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaySessions = await FocusSession.countDocuments({
            completedAt: { $gte: today, $lt: tomorrow }
        });

        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekSessions = await FocusSession.find({ completedAt: { $gte: weekStart } });
        const weeklyMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);

        res.json({ todaySessions, weeklyMinutes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST log a completed session
router.post('/', async (req, res) => {
    try {
        const session = new FocusSession(req.body);
        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
