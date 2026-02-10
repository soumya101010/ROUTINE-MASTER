import { useEffect, useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Sector } from 'recharts';
import GravityContainer from '../components/GravityContainer';
import Card from '../components/Card';
import { expenseAPI } from '../utils/api';
import './Expenses.css';
const RADIAN = Math.PI / 180;

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill="#ffffff"
                filter="url(#glow)"
                cornerRadius={0}
            />
        </g>
    );
};

const renderCustomLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 2.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const midRadius = innerRadius + (outerRadius - innerRadius) * 1.6;
    const midX = cx + midRadius * Math.cos(-midAngle * RADIAN);
    const midY = midRadius * Math.sin(-midAngle * RADIAN); // Relative Y for line calculation not quite right with just midY, need absolute

    // Correct line coordinates
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 5) * cos;
    const sy = cy + (outerRadius + 5) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="rgba(255,255,255,0.5)" fill="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#ffffff" dy={-6} fontSize={14} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="rgba(255,255,255,0.5)" dy={14} fontSize={10}>
                {name}
            </text>
        </g>
    );
};

export default function Expenses() {
    const [transactions, setTransactions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, hobby: 0, necessary: 0, salary: 0, freelance: 0, other: 0 });
    const [activeIndexExpense, setActiveIndexExpense] = useState(0);
    const [activeIndexIncome, setActiveIndexIncome] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'expense',
        category: 'necessary',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const onPieEnterExpense = (_, index) => {
        setActiveIndexExpense(index);
    };

    const onPieEnterIncome = (_, index) => {
        setActiveIndexIncome(index);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [transactionsRes, statsRes] = await Promise.all([
                expenseAPI.getAll(1, 1000), // Increased limit to fetch all records
                expenseAPI.getDashboardStats()
            ]);

            const txData = transactionsRes.data.data || transactionsRes.data;
            setTransactions(Array.isArray(txData) ? txData : []);

            // Process stats for summary
            const globalStats = statsRes.data.global;
            const categoryStats = statsRes.data.globalCategories;

            const newSummary = {
                totalIncome: globalStats.totalIncome || 0,
                totalExpense: globalStats.totalExpense || 0,
                balance: (globalStats.totalIncome || 0) - (globalStats.totalExpense || 0),
                hobby: 0,
                necessary: 0,
                salary: 0,
                freelance: 0,
                other: 0
            };

            categoryStats.forEach(cat => {
                if (newSummary.hasOwnProperty(cat._id)) {
                    newSummary[cat._id] = cat.total;
                }
            });

            setSummary(newSummary);

        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    // Removed client-side calculateSummary as we now use server stats
    const calculateSummary = (data) => {
        // Legacy function kept if needed for optimistic updates, 
        // but generally we should reload stats or update state manually
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const transactionData = {
                ...formData,
                amount: parseFloat(formData.amount)
            };
            console.log('Submitting transaction:', transactionData);

            const response = await expenseAPI.create(transactionData);
            console.log('Transaction created successfully:', response.data);

            // Update local state avoiding stale closures
            setTransactions(prev => [response.data, ...prev]);

            // Simple manual update for UI responsiveness
            setSummary(prev => {
                const amount = parseFloat(transactionData.amount);
                const isIncome = transactionData.type === 'income';
                return {
                    ...prev,
                    totalIncome: isIncome ? prev.totalIncome + amount : prev.totalIncome,
                    totalExpense: !isIncome ? prev.totalExpense + amount : prev.totalExpense,
                    balance: isIncome ? prev.balance + amount : prev.balance - amount,
                    [transactionData.category]: (prev[transactionData.category] || 0) + amount
                };
            });

            setShowForm(false);
            setFormData({
                title: '',
                amount: '',
                type: 'expense',
                category: 'necessary',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('Error creating transaction:', error);
            console.error('Error details:', error.response?.data);
            alert(`Error: ${error.response?.data?.message || error.message || 'Failed to add transaction'}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await expenseAPI.delete(id);
            // Update local state without refetching
            const deletedTransaction = transactions.find(t => t._id === id);
            setTransactions(prev => prev.filter(t => t._id !== id));

            if (deletedTransaction) {
                setSummary(prev => {
                    const amount = deletedTransaction.amount;
                    const isIncome = deletedTransaction.type === 'income';
                    return {
                        ...prev,
                        totalIncome: isIncome ? prev.totalIncome - amount : prev.totalIncome,
                        totalExpense: !isIncome ? prev.totalExpense - amount : prev.totalExpense,
                        balance: isIncome ? prev.balance - amount : prev.balance + amount,
                        [deletedTransaction.category]: (prev[deletedTransaction.category] || 0) - amount
                    };
                });
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const expenseData = [
        { name: 'Hobby', value: summary.hobby, color: '#7c3aed' },
        { name: 'Necessary', value: summary.necessary, color: '#4c1d95' }
    ];

    const incomeData = [
        { name: 'Salary', value: summary.salary, color: '#8b5cf6' },
        { name: 'Freelance', value: summary.freelance, color: '#6d28d9' },
        { name: 'Other', value: summary.other, color: '#5b21b6' }
    ];

    const filteredTransactions = transactions.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm)
    );

    return (
        <div className="expenses-page">
            <div className="page-header">
                <h1 className="text-gradient">Income & Expenses</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={20} />
                    Add Transaction
                </button>
            </div>

            {showForm && (
                <Card className="expense-form">
                    <h3>New Transaction</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value, category: e.target.value === 'income' ? 'salary' : 'necessary' })}
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {formData.type === 'expense' ? (
                                        <>
                                            <option value="necessary">Necessary</option>
                                            <option value="hobby">Hobby</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="salary">Salary</option>
                                            <option value="freelance">Freelance</option>
                                            <option value="other">Other</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Monthly Salary, Groceries"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Amount (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Add Transaction
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            <GravityContainer className="summary-cards">
                <Card className="summary-card income">
                    <div className="summary-icon" style={{ color: '#10b981' }}>
                        <ArrowUpCircle size={32} />
                    </div>
                    <div className="summary-content">
                        <h4>Total Income</h4>
                        <h2>₹{summary.totalIncome.toFixed(2)}</h2>
                    </div>
                </Card>

                <Card className="summary-card expense">
                    <div className="summary-icon" style={{ color: '#ef4444' }}>
                        <ArrowDownCircle size={32} />
                    </div>
                    <div className="summary-content">
                        <h4>Total Expenses</h4>
                        <h2>₹{summary.totalExpense.toFixed(2)}</h2>
                    </div>
                </Card>

                <Card className="summary-card balance">
                    <div className="summary-icon" style={{ color: summary.balance >= 0 ? '#ec4899' : '#ef4444' }}>
                        <DollarSign size={32} />
                    </div>
                    <div className="summary-content">
                        <h4>Balance</h4>
                        <h2 style={{ color: summary.balance >= 0 ? '#10b981' : '#ef4444' }}>
                            ₹{summary.balance.toFixed(2)}
                        </h2>
                    </div>
                </Card>
            </GravityContainer>

            <div className="charts-row">
                {summary.totalExpense > 0 && (
                    <Card className="chart-card">
                        <h3>Expense Breakdown</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                                <Pie
                                    data={expenseData.filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    cornerRadius={0}
                                    stroke="none"
                                    activeIndex={activeIndexExpense}
                                    activeShape={renderActiveShape}
                                    onMouseEnter={onPieEnterExpense}
                                    dataKey="value"
                                    label={renderCustomLabel}
                                    labelLine={false}
                                >
                                    {expenseData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke={index === activeIndexExpense ? 'none' : '#0f172a'}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                )}

                {summary.totalIncome > 0 && (
                    <Card className="chart-card">
                        <h3>Income Sources</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                                <Pie
                                    data={incomeData.filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    cornerRadius={0}
                                    stroke="none"
                                    activeIndex={activeIndexIncome}
                                    activeShape={renderActiveShape}
                                    onMouseEnter={onPieEnterIncome}
                                    dataKey="value"
                                    label={renderCustomLabel}
                                    labelLine={false}
                                >
                                    {incomeData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke={index === activeIndexIncome ? 'none' : '#0f172a'}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                )}
            </div>

            <div className="expenses-list">
                <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Recent Transactions</h3>
                    <div className="search-bar" style={{ position: 'relative', width: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 10px 8px 36px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
                <GravityContainer className="expenses-grid">
                    {filteredTransactions.map((transaction) => (
                        <Card key={transaction._id} className={`expense-card ${transaction.type}`}>
                            <div className="expense-header">
                                <h4>{transaction.title}</h4>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(transaction._id)}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="expense-amount" style={{
                                color: transaction.type === 'income' ? '#10b981' : '#ef4444'
                            }}>
                                {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                            </div>
                            <div className="expense-meta">
                                <span className={`category-badge ${transaction.category}`}>
                                    {transaction.category}
                                </span>
                                <span className="expense-date">
                                    {new Date(transaction.date).toLocaleDateString()}
                                </span>
                            </div>
                            {transaction.description && (
                                <p className="expense-description">{transaction.description}</p>
                            )}
                        </Card>
                    ))}
                </GravityContainer>
            </div>

            {filteredTransactions.length === 0 && !showForm && (
                <div className="empty-state">
                    <DollarSign size={64} className="text-gradient" />
                    <h3>No transactions found</h3>
                    <p>{searchTerm ? 'Try a different search term' : 'Start tracking your income and expenses'}</p>
                </div>
            )}
        </div>
    );
}
