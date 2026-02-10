import express from 'express';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// Get all attendance records (Paginated)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const attendance = await Attendance.find()
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Attendance.countDocuments();

        // Get aggregate stats
        const stats = await Attendance.aggregate([
            {
                $group: {
                    _id: null,
                    totalClasses: { $sum: 1 },
                    theory: { $sum: { $cond: [{ $eq: ["$type", "theory"] }, 1, 0] } },
                    practical: { $sum: { $cond: [{ $eq: ["$type", "practical"] }, 1, 0] } },
                    present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } }
                }
            }
        ]);

        res.json({
            data: attendance,
            stats: stats[0] || { totalClasses: 0, theory: 0, practical: 0, present: 0, absent: 0 },
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create attendance record
router.post('/', async (req, res) => {
    const attendance = new Attendance(req.body);
    try {
        const newRecord = await attendance.save();
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete attendance record
router.delete('/:id', async (req, res) => {
    try {
        await Attendance.findByIdAndDelete(req.params.id);
        res.json({ message: 'Attendance record deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
