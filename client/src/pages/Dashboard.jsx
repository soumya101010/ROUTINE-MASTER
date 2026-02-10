import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, BookOpen, FileText, DollarSign, TrendingUp, Heart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import GravityContainer from '../components/GravityContainer';
import Card from '../components/Card';
import { reminderAPI, routineAPI, expenseAPI } from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        reminders: 0,
        routines: 0,
        totalIncome: 0,
        totalExpense: 0,
        balance: 0
    });
    const [dailyData, setDailyData] = useState([]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [remindersRes, routinesRes, expensesStatsRes] = await Promise.all([
                reminderAPI.getAll(1, 1, { isActive: true }), // Only need count of active, so limit 1
                routineAPI.getAll(1, 1),
                expenseAPI.getDashboardStats()
            ]);

            const statsData = expensesStatsRes.data;
            const recentStats = statsData.recent || { totalStats: [], dailyTrend: [] };
            const globalStats = statsData.global || { totalIncome: 0, totalExpense: 0 };
            const totalStats = recentStats.totalStats[0] || { totalIncome: 0, totalExpense: 0 };

            // Calculate balance (Global balance)
            const balance = globalStats.totalIncome - globalStats.totalExpense;

            // Format trend data
            // Format trend data
            let runningBalance = balance;
            // Calculate starting balance by subtracting all recent changes
            // Note: This assumes dailyTrend (last 30 days) matches the recent activity flow.
            // We iterate backwards to establish the trend curve relative to current balance.

            // First, map data to basic structure
            const mappedData = recentStats.dailyTrend.map(day => ({
                id: day._id,
                income: day.income,
                expense: day.expense,
                net: day.income - day.expense
            }));

            // We need to build the trend forward, so we need the balance at the start of the period.
            const totalRecentChange = mappedData.reduce((acc, curr) => acc + curr.net, 0);
            let currentTrendBalance = balance - totalRecentChange;

            const trendData = mappedData.map(day => {
                currentTrendBalance += day.net;
                return {
                    date: new Date(day.id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    income: day.income,
                    expense: day.expense,
                    balanceTrend: currentTrendBalance
                };
            });

            // Add running balance for the chart if we want to show net worth trend
            // For now, let's keep the daily income/expense view as it's cleaner with the new data structure

            setStats({
                reminders: remindersRes.data.totalItems || 0,
                routines: routinesRes.data.totalItems || 0,
                totalIncome: totalStats.totalIncome,
                totalExpense: totalStats.totalExpense,
                balance: balance
            });
            setDailyData(trendData);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const quickLinks = [
        {
            to: '/reminders',
            icon: Bell,
            title: 'Reminders',
            description: 'Medication & timed alerts',
            color: '#ec4899',
            count: stats.reminders
        },
        {
            to: '/routines',
            icon: Calendar,
            title: 'Routines',
            description: 'Daily routine templates',
            color: '#e91e63',
            count: stats.routines
        },
        {
            to: '/study',
            icon: BookOpen,
            title: 'Study Tracker',
            description: 'Hierarchical backlog',
            color: '#f472b6'
        },
        {
            to: '/documents',
            icon: FileText,
            title: 'Documents',
            description: 'Secure storage',
            color: '#10b981'
        },
        {
            to: '/expenses',
            icon: DollarSign,
            title: 'Income & Expenses',
            description: `Balance: ₹${stats.balance.toFixed(0)}`,
            color: stats.balance >= 0 ? '#10b981' : '#ef4444'
        }
    ];

    return (
        <div className="dashboard">
            {/* Mobile View - Layout from reference image */}
            <div className="mobile-only">
                <div className="mobile-only-header">
                    <div className="user-profile">
                        <div className="avatar">
                            <img src={`/her.jpeg?v=${new Date().getTime()}`} alt="Avatar" />
                        </div>
                        <div className="greeting">
                            <span>Welcome Back!</span>
                            <h3>Enakshi Debnath</h3>
                        </div>
                    </div>
                    <div className="dashboard-actions">
                        {/* Mobile Header Actions - Verified Clean */}
                        <Link to="/reminders" className="mobile-test-btn" style={{ textDecoration: 'none' }}>
                            <Bell size={20} color="#ec4899" />
                            {stats.reminders > 0 && <span className="dot" style={{ position: 'absolute', top: '8px', right: '8px', border: '1px solid #000' }}></span>}
                        </Link>
                        <Link to="/dedication" className="mobile-heart-btn">
                            <Heart size={20} color="#ec4899" />
                        </Link>
                    </div>
                </div>

                <div className="featured-section">
                    <Card className="featured-balance-card">
                        <div className="featured-content">
                            <span className="label">Monthly Balance</span>
                            <h2 className="amount">₹{stats.balance.toLocaleString()}</h2>
                            <div className="trend-tag">
                                <TrendingUp size={14} />
                                <span>+15% From last month</span>
                            </div>
                        </div>
                        <div className="featured-chart-overlay">
                            <ResponsiveContainer width="100%" height={120}>
                                <AreaChart data={dailyData.slice(-15)} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                    <YAxis domain={['dataMin', 'dataMax']} hide />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="mini-tooltip" style={{
                                                        background: 'rgba(255,255,255,0.2)',
                                                        backdropFilter: 'blur(4px)',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '10px',
                                                        color: '#fff',
                                                        border: '1px solid rgba(255,255,255,0.3)'
                                                    }}>
                                                        ₹{payload[0].value.toLocaleString()}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="balanceTrend"
                                        stroke="rgba(255,255,255,0.9)"
                                        fill="rgba(255,255,255,0.05)"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#fff', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="dashboard-grid">
                    {quickLinks.slice(0, 4).map((link) => (
                        <Link key={link.to} to={link.to} className="dashboard-link">
                            <Card className="dashboard-card mini">
                                <div className="mini-card-header">
                                    <div className="mini-icon-circle" style={{ background: `${link.color}22` }}>
                                        <link.icon size={18} style={{ color: link.color }} />
                                    </div>
                                    <span className="mini-label">{link.title}</span>
                                </div>
                                <div className="mini-card-body">
                                    <span className="mini-value">{link.count !== undefined ? link.count : 'New'}</span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Desktop View - Restored original icons and structure */}
            <div className="desktop-only">
                <div className="dashboard-header">
                    <h1 className="text-gradient">Dashboard</h1>
                    <p>Your complete overview</p>
                </div>

                <GravityContainer className="dashboard-grid">
                    {quickLinks.map((link) => (
                        <Link key={link.to} to={link.to} className="dashboard-link">
                            <Card className="dashboard-card">
                                <div className="card-icon" style={{ color: link.color }}>
                                    <link.icon size={40} />
                                </div>
                                <h3>{link.title}</h3>
                                <p>{link.description}</p>
                                {link.count !== undefined && (
                                    <div className="card-badge" style={{ background: link.color }}>
                                        {link.count}
                                    </div>
                                )}
                            </Card>
                        </Link>
                    ))}
                </GravityContainer>

                <Card className="overview-section">
                    <h2>Daily Income & Expenses (Last 30 Days)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.3)"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.3)"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                name="Income"
                                dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: '#1e293b' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stroke="#ef4444"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                name="Expense"
                                dot={{ stroke: '#ef4444', strokeWidth: 2, r: 4, fill: '#1e293b' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                <div className="dashboard-footer">
                    <Card className="welcome-card">
                        <TrendingUp size={32} className="text-gradient" />
                        <h3>Your productivity hub</h3>
                        <p>Track medications, build routines, manage studies, store documents, and monitor expenses all in one place.</p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
