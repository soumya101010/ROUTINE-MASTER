import express from 'express';
import Expense from '../models/Expense.js';

const router = express.Router();

// Get dashboard stats (aggregated)
// Get dashboard stats (aggregated)
router.get('/dashboard-stats', async (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Current Month Bounds
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Last Month Bounds
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        const stats = await Expense.aggregate([
            {
                $facet: {
                    "recentStats": [
                        { $match: { date: { $gte: thirtyDaysAgo } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                                income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
                                expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    "currentMonth": [
                        { $match: { date: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
                        {
                            $group: {
                                _id: null,
                                income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
                                expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
                            }
                        }
                    ],
                    "lastMonth": [
                        { $match: { date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
                        {
                            $group: {
                                _id: null,
                                income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
                                expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
                            }
                        }
                    ],
                    "globalStats": [
                        {
                            $group: {
                                _id: null,
                                totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
                                totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
                            }
                        }
                    ],
                    "globalCategories": [
                        {
                            $group: {
                                _id: "$category",
                                total: { $sum: "$amount" }
                            }
                        }
                    ]
                }
            }
        ]);

        const resultData = stats[0];
        const current = resultData.currentMonth[0] || { income: 0, expense: 0 };
        const last = resultData.lastMonth[0] || { income: 0, expense: 0 };
        const global = resultData.globalStats[0] || { totalIncome: 0, totalExpense: 0 };

        const currentBalance = current.income - current.expense;
        const lastBalance = last.income - last.expense;

        let percentageChange = 0;
        if (lastBalance !== 0) {
            percentageChange = ((currentBalance - lastBalance) / Math.abs(lastBalance)) * 100;
        } else if (currentBalance !== 0) {
            percentageChange = 100; // If last month was 0 and this month has balance
        }

        const result = {
            recent: {
                totalStats: [{ totalIncome: global.totalIncome, totalExpense: global.totalExpense }], // Keep structure for frontend compatibility
                dailyTrend: resultData.recentStats
            },
            global: global,
            globalCategories: resultData.globalCategories,
            monthComparison: {
                currentBalance,
                lastBalance,
                percentageChange: Math.round(percentageChange)
            }
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all expenses (Paginated)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const expenses = await Expense.find()
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Expense.countDocuments();

        res.json({
            data: expenses,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get monthly summary
router.get('/summary/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const expenses = await Expense.find({
            date: { $gte: startDate, $lte: endDate }
        });

        const summary = {
            total: 0,
            hobby: 0,
            necessary: 0,
            expenses: expenses
        };

        expenses.forEach(exp => {
            summary.total += exp.amount;
            summary[exp.category] += exp.amount;
        });

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create expense
router.post('/', async (req, res) => {
    const expense = new Expense(req.body);
    try {
        const newExpense = await expense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update expense
router.patch('/:id', async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
