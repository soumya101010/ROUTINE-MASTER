import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], default: 'expense' },
    category: { type: String, enum: ['hobby', 'necessary', 'salary', 'freelance', 'other'], required: true },
    date: { type: Date, default: Date.now },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Expense', expenseSchema);
