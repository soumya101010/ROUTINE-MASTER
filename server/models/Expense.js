import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], default: 'expense', index: true },
    category: { type: String, enum: ['food', 'transport', 'shopping', 'bills', 'education', 'health', 'entertainment', 'hobby', 'necessary', 'salary', 'freelance', 'investments', 'gifts', 'other'], required: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

// Compound index for monthly summaries
expenseSchema.index({ date: -1, type: 1 });

export default mongoose.model('Expense', expenseSchema);
