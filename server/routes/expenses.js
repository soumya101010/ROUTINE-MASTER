import express from 'express';
import Expense from '../models/Expense.js';

const router = express.Router();

// Get all expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.json(expenses);
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
