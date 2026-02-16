import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, BookOpen, FileText, DollarSign, TrendingUp, TrendingDown, Heart, CheckSquare, BarChart3, Target, Timer, Flame, ClipboardList } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import GravityContainer from '../components/GravityContainer';
import Card from '../components/Card';
import { reminderAPI, routineAPI, expenseAPI, goalAPI, focusAPI, habitAPI, weeklyReviewAPI } from '../utils/api';
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
    const [moduleBadges, setModuleBadges] = useState({
        goals: { text: 'New', loading: true },
        focus: { text: 'Start', loading: true },
        habits: { text: 'New', loading: true },
        review: { text: 'New', loading: true },
        analytics: { text: 'This Week', loading: false }
    });

    useEffect(() => {
        loadStats();
        loadModuleBadges();
    }, []);

    const loadStats = async () => {
        try {
            const [remindersRes, routinesRes, expensesStatsRes] = await Promise.all([
                reminderAPI.getAll(1, 1, { isActive: true }),
                routineAPI.getAll(1, 1),
                expenseAPI.getDashboardStats()
            ]);

            const statsData = expensesStatsRes.data;
            const recentStats = statsData.recent || { totalStats: [], dailyTrend: [] };
            const globalStats = statsData.global || { totalIncome: 0, totalExpense: 0 };
            const totalStats = recentStats.totalStats[0] || { totalIncome: 0, totalExpense: 0 };
            const balance = globalStats.totalIncome - globalStats.totalExpense;

            let runningBalance = balance;
            const mappedData = recentStats.dailyTrend.map(day => ({
                id: day._id,
                income: day.income,
                expense: day.expense,
                net: day.income - day.expense
            }));

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

            setStats({
                reminders: remindersRes.data.totalItems || 0,
                routines: routinesRes.data.totalItems || 0,
                totalIncome: totalStats.totalIncome,
                totalExpense: totalStats.totalExpense,
                balance: balance,
                percentageChange: statsData.monthComparison?.percentageChange || 0
            });
            setDailyData(trendData);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadModuleBadges = async () => {
        // Load all badge stats in parallel, gracefully handle failures
        const results = await Promise.allSettled([
            goalAPI.getStats(),
            focusAPI.getStats(),
            habitAPI.getStats(),
            weeklyReviewAPI.getStats()
        ]);

        setModuleBadges({
            goals: {
                text: results[0].status === 'fulfilled'
                    ? (results[0].value.data.active > 0 ? `${results[0].value.data.active} Active` : 'New')
                    : 'New',
                loading: false
            },
            focus: {
                text: results[1].status === 'fulfilled'
                    ? (results[1].value.data.weeklyMinutes > 0 ? `${Math.round(results[1].value.data.weeklyMinutes / 60)}h ${results[1].value.data.weeklyMinutes % 60}m` : 'Start')
                    : 'Start',
                loading: false
            },
            habits: {
                text: results[2].status === 'fulfilled'
                    ? (results[2].value.data.maxStreak > 0 ? `${results[2].value.data.maxStreak} Day Streak` : (results[2].value.data.total > 0 ? `${results[2].value.data.completedToday}/${results[2].value.data.total} Today` : 'New'))
                    : 'New',
                loading: false
            },
            review: {
                text: results[3].status === 'fulfilled'
                    ? (results[3].value.data.hasCurrentWeek ? 'In Progress' : 'New')
                    : 'New',
                loading: false
            },
            analytics: { text: 'This Week', loading: false }
        });
    };

    const moduleCards = [
        { path: '/time-analytics', icon: BarChart3, title: 'Time Analytics', badgeKey: 'analytics', color: 'blue' },
        { path: '/goals', icon: Target, title: 'Goal Tracker', badgeKey: 'goals', color: 'purple' },
        { path: '/focus', icon: Timer, title: 'Focus Mode', badgeKey: 'focus', color: 'orange' },
        { path: '/habits', icon: Flame, title: 'Habit Streaks', badgeKey: 'habits', color: 'pink' },
        { path: '/weekly-review', icon: ClipboardList, title: 'Weekly Review', badgeKey: 'review', color: 'cyan' }
    ];

    return (
        <div className="dashboard">
            {/* Mobile View */}
            <div className="mobile-only">
                <div className="featured-section">
                    <Card className="featured-balance-card">
                        <div className="featured-content">
                            <span className="label">Monthly Balance</span>
                            <h2 className="amount">₹{stats.balance.toLocaleString()}</h2>
                            <div className="trend-tag">
                                {stats.percentageChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>
                                    {stats.percentageChange >= 0 ? '+' : ''}
                                    {Math.abs(stats.percentageChange) > 999 ? '>999' : stats.percentageChange}% From last month
                                </span>
                            </div>
                        </div>
                        <div className="featured-chart-overlay">
                            <ResponsiveContainer width="100%" height={120}>
                                <AreaChart data={dailyData.slice(-15)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fff" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        hide={false}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        hide={false}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                        tickFormatter={(val) => `₹${val}`}
                                        domain={[0, 'auto']}
                                    />
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
                                        stroke="#fff"
                                        fill="url(#balanceGradient)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#fff', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Module Cards Grid — Mobile */}
                <div className="module-cards-grid">
                    {moduleCards.map(({ path, icon: Icon, title, badgeKey, color }) => (
                        <Link key={path} to={path} className="module-card-link">
                            <Card className={`module-card ${color}`}>
                                <div className={`module-card-icon ${color}`}>
                                    <Icon size={28} />
                                </div>
                                <h3 className="module-card-title">{title}</h3>
                                <span className={`module-card-badge ${color}`}>
                                    {moduleBadges[badgeKey]?.loading ? '...' : moduleBadges[badgeKey]?.text}
                                </span>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only">
                <div className="dashboard-header">
                    <h1 className="module-title text-gradient">Dashboard</h1>
                    <p>Your complete overview</p>
                </div>

                {/* Module Cards Grid — Desktop */}
                <div className="module-cards-grid desktop-grid">
                    {moduleCards.map(({ path, icon: Icon, title, badgeKey, color }) => (
                        <Link key={path} to={path} className="module-card-link">
                            <Card className={`module-card ${color}`}>
                                <div className={`module-card-icon ${color}`}>
                                    <Icon size={28} />
                                </div>
                                <h3 className="module-card-title">{title}</h3>
                                <span className={`module-card-badge ${color}`}>
                                    {moduleBadges[badgeKey]?.loading ? '...' : moduleBadges[badgeKey]?.text}
                                </span>
                            </Card>
                        </Link>
                    ))}
                </div>

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
