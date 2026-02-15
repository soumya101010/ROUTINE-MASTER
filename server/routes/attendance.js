import express from 'express';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// Get all attendance records (Paginated) - kept for backward compatibility
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

        res.json({
            data: attendance,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get monthly attendance with subject-wise stats
router.get('/monthly/:year/:month', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month); // 1-based

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        const dateMatch = {
            $match: {
                date: { $gte: startDate, $lt: endDate }
            }
        };

        // All records for this month (for log display)
        const records = await Attendance.find({
            date: { $gte: startDate, $lt: endDate }
        }).sort({ date: -1 });

        // Subject-wise aggregation for this month
        const subjectStats = await Attendance.aggregate([
            dateMatch,
            {
                $group: {
                    _id: "$subject",
                    totalClasses: { $sum: 1 },
                    theoryClasses: { $sum: { $cond: [{ $eq: ["$type", "theory"] }, 1, 0] } },
                    practicalClasses: { $sum: { $cond: [{ $eq: ["$type", "practical"] }, 1, 0] } },
                    theoryPresent: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$type", "theory"] }, { $eq: ["$status", "present"] }] },
                                1, 0
                            ]
                        }
                    },
                    practicalPresent: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$type", "practical"] }, { $eq: ["$status", "present"] }] },
                                1, 0
                            ]
                        }
                    },
                    totalPresent: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Overall stats for this month
        const overallAgg = await Attendance.aggregate([
            dateMatch,
            {
                $group: {
                    _id: null,
                    totalClasses: { $sum: 1 },
                    theoryClasses: { $sum: { $cond: [{ $eq: ["$type", "theory"] }, 1, 0] } },
                    practicalClasses: { $sum: { $cond: [{ $eq: ["$type", "practical"] }, 1, 0] } },
                    totalPresent: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
                }
            }
        ]);

        const overall = overallAgg[0] || { totalClasses: 0, theoryClasses: 0, practicalClasses: 0, totalPresent: 0 };
        const attendanceRate = overall.totalClasses > 0
            ? parseFloat(((overall.totalPresent / overall.totalClasses) * 100).toFixed(1))
            : 0;

        res.json({
            records,
            subjectStats,
            overallStats: {
                attendanceRate,
                totalClasses: overall.totalClasses,
                totalPresent: overall.totalPresent,
                theoryClasses: overall.theoryClasses,
                practicalClasses: overall.practicalClasses
            }
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
