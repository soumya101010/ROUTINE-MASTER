import express from 'express';
import WeeklyReview from '../models/WeeklyReview.js';

const router = express.Router();

// Helper: get week boundaries
function getWeekBounds(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

// GET all reviews (most recent first)
router.get('/', async (req, res) => {
    try {
        const reviews = await WeeklyReview.find().sort({ weekStart: -1 }).limit(12);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET stats for dashboard badge
router.get('/stats', async (req, res) => {
    try {
        const { start } = getWeekBounds();
        const currentReview = await WeeklyReview.findOne({ weekStart: start });
        const totalReviews = await WeeklyReview.countDocuments();
        res.json({
            hasCurrentWeek: !!currentReview,
            totalReviews
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET or create current week review
router.get('/current', async (req, res) => {
    try {
        const { start, end } = getWeekBounds();
        let review = await WeeklyReview.findOne({ weekStart: start });

        if (!review) {
            review = new WeeklyReview({
                weekStart: start,
                weekEnd: end,
                summary: {},
                reflections: {}
            });
            await review.save();
        }

        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST/PATCH save reflection for current week
router.post('/', async (req, res) => {
    try {
        const { start, end } = getWeekBounds();
        let review = await WeeklyReview.findOne({ weekStart: start });

        if (review) {
            review.reflections = req.body.reflections || review.reflections;
            review.summary = req.body.summary || review.summary;
            await review.save();
        } else {
            review = new WeeklyReview({
                weekStart: start,
                weekEnd: end,
                reflections: req.body.reflections || {},
                summary: req.body.summary || {}
            });
            await review.save();
        }

        res.json(review);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
