import { useEffect, useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import GravityContainer from '../components/GravityContainer';
import Card from '../components/Card';
import { expenseAPI } from '../utils/api';
import './Expenses.css';
const RADIAN = Math.PI / 180;

/* ─── Variable-radius sector (thickness scales with %) ─── */
const renderVariableShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, percent } = props;
    const minThickness = 12;
    const maxOuter = outerRadius + 15;
    const scaled = innerRadius + minThickness + (maxOuter - innerRadius - minThickness) * Math.sqrt(percent);
    return (
        <Sector
            cx={cx} cy={cy}
            innerRadius={innerRadius}
            outerRadius={scaled}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
        />
    );
};

/* ─── Active shape with same scaling + slight expansion ─── */
const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, percent } = props;
    const minThickness = 12;
    const maxOuter = outerRadius + 15;
    const scaled = innerRadius + minThickness + (maxOuter - innerRadius - minThickness) * Math.sqrt(percent);
    return (
        <g>
            <Sector
                cx={cx} cy={cy}
                innerRadius={innerRadius - 2}
                outerRadius={scaled + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
        </g>
    );
};

/* ─── Clean Minimal Labels ─── */
const renderMinimalLabel = (props) => {
    const { cx, cy, midAngle, outerRadius, percent, name, fill } = props;
    if (percent < 0.03) return null;

    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 6) * cos;
    const sy = cy + (outerRadius + 6) * sin;
    const mx = cx + (outerRadius + 22) * cos;
    const my = cy + (outerRadius + 22) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 14;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <path
                d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
                fill="none"
            />
            <circle cx={sx} cy={sy} r={2} fill={fill || 'rgba(255,255,255,0.4)'} />
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 6}
                y={ey}
                textAnchor={textAnchor}
                fill="rgba(255,255,255,0.7)"
                fontSize={12}
                fontWeight="500"
                dominantBaseline="central"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        </g>
    );
};

/* ─── Chart Center Label Component ─── */
const ChartCenterLabel = ({ total, label }) => (
    <div className="chart-center-label">
        <span className="chart-center-amount">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        <span className="chart-center-text">{label}</span>
    </div>
);

/* ─── Custom Legend Component ─── */
const ChartLegend = ({ data, total }) => (
    <div className="chart-legend">
        {data.filter(d => d.value > 0).map((item, i) => (
            <div key={i} className="chart-legend-item">
                <div className="chart-legend-dot" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}60` }} />
                <div className="chart-legend-info">
                    <span className="chart-legend-name">{item.name}</span>
                    <span className="chart-legend-value">₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <span className="chart-legend-pct">{total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'}</span>
            </div>
        ))}
    </div>
);

export default function Expenses() {
    const [transactions, setTransactions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [summary, setSummary] = useState({
        totalIncome: 0, totalExpense: 0, balance: 0,
        food: 0, transport: 0, shopping: 0, bills: 0, education: 0,
        health: 0, entertainment: 0, hobby: 0, necessary: 0,
        salary: 0, freelance: 0, investments: 0, gifts: 0, other: 0
    });
    const [activeIndexExpense, setActiveIndexExpense] = useState(0);
    const [activeIndexIncome, setActiveIndexIncome] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'expense',
        category: 'food',
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
                expenseAPI.getAll(1, 20),
                expenseAPI.getDashboardStats()
            ]);

            setTransactions(transactionsRes.data.data);

            // Process stats for summary
            const globalStats = statsRes.data.global;
            const categoryStats = statsRes.data.globalCategories;

            const newSummary = {
                totalIncome: globalStats.totalIncome || 0,
                totalExpense: globalStats.totalExpense || 0,
                balance: (globalStats.totalIncome || 0) - (globalStats.totalExpense || 0),
                food: 0, transport: 0, shopping: 0, bills: 0, education: 0,
                health: 0, entertainment: 0, hobby: 0, necessary: 0,
                salary: 0, freelance: 0, investments: 0, gifts: 0, other: 0
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

            // Update local state without refetching (simple append)
            // Note: This won't update the global summary stats immediately unless we refetch or incorrectly calc
            const newTransactions = [response.data, ...transactions];
            setTransactions(newTransactions);

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
                category: 'food',
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
            const newTransactions = transactions.filter(t => t._id !== id);
            setTransactions(newTransactions);

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
        { name: 'Food', value: summary.food, color: '#be123c' },
        { name: 'Transport', value: summary.transport, color: '#e11d48' },
        { name: 'Shopping', value: summary.shopping, color: '#f43f5e' },
        { name: 'Bills', value: summary.bills, color: '#fb7185' },
        { name: 'Education', value: summary.education, color: '#fda4af' },
        { name: 'Health', value: summary.health, color: '#9f1239' },
        { name: 'Entertainment', value: summary.entertainment, color: '#ff6b81' },
        { name: 'Hobby', value: summary.hobby, color: '#db2777' },
        { name: 'Necessary', value: summary.necessary, color: '#ec4899' }
    ];

    const incomeData = [
        { name: 'Salary', value: summary.salary, color: '#059669' },
        { name: 'Freelance', value: summary.freelance, color: '#34d399' },
        { name: 'Investments', value: summary.investments, color: '#6ee7b7' },
        { name: 'Gifts', value: summary.gifts, color: '#10b981' },
        { name: 'Other', value: summary.other, color: '#a7f3d0' }
    ];

    return (
        <div className="expenses-page">
            <div className="page-header">
                <h1 className="module-title text-gradient">Income & Expenses</h1>
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
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value, category: e.target.value === 'income' ? 'salary' : 'food' })}
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
                                            <option value="food">🍔 Food</option>
                                            <option value="transport">🚗 Transport</option>
                                            <option value="shopping">🛍️ Shopping</option>
                                            <option value="bills">📄 Bills</option>
                                            <option value="education">📚 Education</option>
                                            <option value="health">💊 Health</option>
                                            <option value="entertainment">🎬 Entertainment</option>
                                            <option value="hobby">🎮 Hobby</option>
                                            <option value="necessary">📌 Necessary</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="salary">💰 Salary</option>
                                            <option value="freelance">💻 Freelance</option>
                                            <option value="investments">📈 Investments</option>
                                            <option value="gifts">🎁 Gifts</option>
                                            <option value="other">📦 Other</option>
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
                        <div className="chart-wrapper">
                            <div className="chart-pie-area">
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={expenseData.filter(d => d.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={105}
                                            paddingAngle={2}
                                            stroke="none"
                                            shape={renderVariableShape}
                                            dataKey="value"
                                            label={renderMinimalLabel}
                                            labelLine={false}
                                            animationBegin={0}
                                            animationDuration={800}
                                            animationEasing="ease-out"
                                        >
                                            {expenseData.filter(d => d.value > 0).map((entry, index) => (
                                                <Cell
                                                    key={`exp-cell-${index}`}
                                                    fill={entry.color}
                                                    stroke="rgba(0,0,0,0.3)"
                                                    strokeWidth={1}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <ChartCenterLabel total={summary.totalExpense} label="Expenses" />
                            </div>
                            <ChartLegend data={expenseData} total={summary.totalExpense} />
                        </div>
                    </Card>
                )}

                {summary.totalIncome > 0 && (
                    <Card className="chart-card">
                        <h3>Income Sources</h3>
                        <div className="chart-wrapper">
                            <div className="chart-pie-area">
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={incomeData.filter(d => d.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={105}
                                            paddingAngle={2}
                                            stroke="none"
                                            shape={renderVariableShape}
                                            dataKey="value"
                                            label={renderMinimalLabel}
                                            labelLine={false}
                                            animationBegin={0}
                                            animationDuration={800}
                                            animationEasing="ease-out"
                                        >
                                            {incomeData.filter(d => d.value > 0).map((entry, index) => (
                                                <Cell
                                                    key={`inc-cell-${index}`}
                                                    fill={entry.color}
                                                    stroke="rgba(0,0,0,0.3)"
                                                    strokeWidth={1}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <ChartCenterLabel total={summary.totalIncome} label="Income" />
                            </div>
                            <ChartLegend data={incomeData} total={summary.totalIncome} />
                        </div>
                    </Card>
                )}
            </div>

            <div className="expenses-list">
                <h3>Recent Transactions</h3>
                <GravityContainer className="expenses-grid">
                    {transactions.slice(0, 10).map((transaction) => (
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

            {transactions.length === 0 && !showForm && (
                <div className="empty-state">
                    <DollarSign size={64} className="text-gradient" />
                    <h3>No transactions yet</h3>
                    <p>Start tracking your income and expenses</p>
                </div>
            )}
        </div>
    );
}
