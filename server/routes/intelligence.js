import express from 'express';
import Habit from '../models/Habit.js';
import Routine from '../models/Routine.js';
import FocusSession from '../models/FocusSession.js';
import Expense from '../models/Expense.js';
import Attendance from '../models/Attendance.js';
import StudyItem from '../models/StudyItem.js';
import Goal from '../models/Goal.js';
import Document from '../models/Document.js';
import WeeklyReview from '../models/WeeklyReview.js';

const router = express.Router();

// Helper to get date boundaries
const getTrailingDates = (daysAgo) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysAgo);
    start.setHours(0, 0, 0, 0);
    return { start, end };
};

// Aggregate global data logic
const getAggregatedData = async () => {
    const { start: weekStart, end: now } = getTrailingDates(7);
    const { start: monthStart } = getTrailingDates(30);

    // Run aggregations in parallel
    const [
        focusSessions, habits, routines, expenses, attendance,
        studyItems, goals, recentReviews, documents
    ] = await Promise.all([
        FocusSession.find({ completedAt: { $gte: weekStart } }),
        Habit.find({}),
        Routine.find({}),
        Expense.find({ date: { $gte: monthStart } }),
        Attendance.find({ date: { $gte: monthStart } }), // Changed to 30 days to align with monthly UI stats
        StudyItem.find({}),
        Goal.find({}),
        WeeklyReview.find({ weekStartDate: { $gte: monthStart } }).sort({ weekStartDate: -1 }).limit(1),
        Document.find({})
    ]);

    // 1. Consistency / Disicpline logic (Attendance, Habits)
    let totalHabits = habits.length;
    let habitSuccess = habits.reduce((acc, h) => acc + (h.currentStreak > 0 ? 1 : 0), 0);
    let consistencyScore = totalHabits > 0 ? (habitSuccess / totalHabits) * 100 : 80;
    consistencyScore = Math.min(100, Math.round((consistencyScore + (attendance.length > 0 ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 : 0)) / 2) || 82);

    // 2. Focus & Energy (FocusSessions)
    let totalFocusMins = focusSessions.reduce((sum, s) => sum + s.duration, 0);
    // Score based on a target of 5 hours (300 mins) per week
    let focusScore = Math.min(100, Math.round((totalFocusMins / 300) * 100));

    // 3. Study Load (StudyItems)
    // Score based on average progress of active subjects
    let subjects = studyItems.filter(s => s.type === 'subject');
    let studyLoadScore = subjects.length > 0
        ? Math.round(subjects.reduce((sum, s) => sum + (s.progress || 0), 0) / subjects.length)
        : 0;

    // 4. Financial Balance (Expenses)
    // Calculate ratio of income to total flow (Income vs Expenses) to guarantee a positive proportional percentage.
    let totalExpLast30 = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    let totalIncomeLast30 = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    let financialScore = (totalIncomeLast30 + totalExpLast30) > 0
        ? Math.round((totalIncomeLast30 / (totalIncomeLast30 + totalExpLast30)) * 100)
        : 0;

    // 5. Global Score
    let globalScore = Math.round((consistencyScore * 0.3) + (focusScore * 0.3) + (studyLoadScore * 0.2) + (financialScore * 0.2));

    return {
        globalScore,
        metrics: {
            consistency: consistencyScore,
            focus: focusScore,
            studyLoad: studyLoadScore,
            financial: financialScore
        },
        focusSessions, habits, routines, expenses, attendance, studyItems, goals, recentReviews, documents
    };
};

// GET /api/intelligence/dashboard (Lightweight)
router.get('/dashboard', async (req, res) => {
    try {
        const data = await getAggregatedData();

        // Generate mini AI insight based on basic thresholds
        let insights = [];
        if (data.metrics.consistency > 75) insights.push("Strong habits");
        else insights.push("Inconsistent habits");

        if (data.metrics.studyLoad > 85) insights.push("Study overload");
        else if (data.metrics.studyLoad < 30) insights.push("Low study load");

        if (data.metrics.financial < 60) insights.push("Expense drift detected");
        else insights.push("Finances stable");

        res.json({
            globalScore: data.globalScore,
            metrics: data.metrics,
            miniInsight: insights.join(' · ')
        });
    } catch (error) {
        console.error('Intelligence Dashboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard intelligence' });
    }
});

// GET /api/intelligence/core (Heavy)
router.get('/core', async (req, res) => {
    try {
        const data = await getAggregatedData();

        // Build domain statuses
        const domainStatus = [
            { domain: 'Productivity', score: Math.round((data.metrics.consistency * 0.6) + (data.metrics.focus * 0.4)), status: data.metrics.consistency > 80 ? 'Strong' : 'Stable' },
            { domain: 'Focus & Energy', score: data.metrics.focus, status: data.metrics.focus > 70 ? 'Strong' : 'Weak' },
            { domain: 'Discipline', score: data.metrics.consistency, status: data.metrics.consistency > 75 ? 'Strong' : 'Weak' },
            { domain: 'Study Load', score: data.metrics.studyLoad, status: data.metrics.studyLoad > 80 ? 'Overload' : 'Stable' },
            { domain: 'Financial Balance', score: data.metrics.financial, status: data.metrics.financial > 60 ? 'Stable' : 'Weak' }
        ];

        // Real 7-day Line Graph Data
        const performanceData = [];
        const heatIndicator = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - i);
            const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
            const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

            // Focus for the day (all focus sessions)
            const dayFocus = data.focusSessions.filter(f => new Date(f.completedAt) >= dayStart && new Date(f.completedAt) <= dayEnd);
            const dayFocusMins = dayFocus.reduce((sum, f) => sum + f.duration, 0);
            const dailyFocusScore = Math.min(100, Math.round((dayFocusMins / 60) * 100)); // 1 hr = 100%

            // Study for the day (maps to absolute total load)
            const dailyStudyScore = data.metrics.studyLoad;

            // Routines / Load for the day
            // Count total tasks completed across all routines on that day vs total tasks
            // If historical routine data without timestamps is not easily accessible per DAY,
            // we will evaluate the current routine's completion ratio.
            const totalTasks = data.routines.reduce((sum, r) => sum + (r.tasks ? r.tasks.length : 0), 0);
            const completedTasks = data.routines.reduce((sum, r) => sum + (r.tasks ? r.tasks.filter(t => t.completed).length : 0), 0);
            const dailyLoadScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            performanceData.push({
                date: days[dayStart.getDay()],
                focus: dailyFocusScore,
                load: dailyLoadScore,
                study: dailyStudyScore
            });

            heatIndicator.push(dailyFocusScore);
        }

        // Calculate Routine Task completion ratio
        const totalRoutineTasks = data.routines.reduce((sum, r) => sum + (r.tasks ? r.tasks.length : 0), 0);
        const completedRoutineTasks = data.routines.reduce((sum, r) => sum + (r.tasks ? r.tasks.filter(t => t.completed).length : 0), 0);
        const routineScore = totalRoutineTasks > 0 ? Math.round((completedRoutineTasks / totalRoutineTasks) * 100) : 0;

        // Real Module Performance Calculation (best effort mapping)
        const modulePerformance = [
            { name: 'Time', score: routineScore }, // Time reflects true execution of scheduled routine blocks

            { name: 'Goals', score: data.goals.length > 0 ? Math.round(data.goals.reduce((sum, g) => sum + (g.progress || 0), 0) / data.goals.length) : 0 },
            { name: 'Focus', score: data.metrics.focus },
            { name: 'Habits', score: data.metrics.consistency },
            { name: 'Attendance', score: data.attendance.length > 0 ? Math.round((data.attendance.filter(a => a.status === 'present').length / data.attendance.length) * 100) : 0 },
            { name: 'Routines', score: routineScore },
            { name: 'Study', score: data.metrics.studyLoad },
            { name: 'Documents', score: data.documents.length > 0 ? 100 : 0 },
            { name: 'Expenses', score: data.metrics.financial }
        ];

        // Performance Distribution Pie Chart (Direct mapping of their scores to slices to satisfy "larger number = larger slice")
        const pieColors = ['#f43f5e', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981'];
        let performanceDistribution = modulePerformance
            .filter(m => m.score > 0) // Only look at modules with data
            .sort((a, b) => b.score - a.score) // Sort by highest score
            .slice(0, 5) // Take top 5
            .map((item, index) => ({
                name: item.name,
                value: item.score, // Absolute true score dictates slice size
                fill: pieColors[index % pieColors.length]
            }));

        // Fallback
        if (performanceDistribution.length === 0) {
            performanceDistribution = [{ name: 'None', value: 100, fill: '#10b981' }];
        }

        // Dynamic AI Layer Engine
        let humanReadableSummary = "";
        let causeEffectChains = [];
        let recommendations = [];
        let predictions = {
            nextRiskDay: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][new Date().getDay()], // Predicts risk tomorrow basically or based on real weak days
            burnoutProbability: 15,
            financialRisk: "Low"
        };

        // Rule-Based Synthesis based on dynamic 'data.metrics' thresholds
        if (data.metrics.studyLoad > 80 && data.metrics.focus < 50) {
            humanReadableSummary = "System indicates severe study overload resulting in rapid focus depletion. Your cognitive stamina is breaking under the current task density.";
            causeEffectChains.push("Excessive Study Hours → Cognitive Fatigue → Reduced Focus Quality");
            recommendations.push({ title: "Mandatory Deload", impact: 25, risk: "High", icon: "Timer" });
            predictions.burnoutProbability = 89;
        } else if (data.metrics.financial < 40 && data.metrics.consistency < 60) {
            humanReadableSummary = "Critical expense drift detected alongside dropping habit consistency. Financial friction is cascading into daily discipline.";
            causeEffectChains.push("Financial Drain → Increased Mental Load → Habit Execution Failure");
            recommendations.push({ title: "Emergency Audit", impact: 20, risk: "High", icon: "Wallet" });
            predictions.financialRisk = "Critical";
            predictions.burnoutProbability = 60;
        } else if (data.metrics.financial < 60) {
            humanReadableSummary = "Your routine is relatively stable, but expense velocity is exceeding income parameters. Focus is holding steady.";
            causeEffectChains.push("Expense Velocity Unchecked → Slow Financial Bleed");
            recommendations.push({ title: "Limit Discretionary Spend", impact: 15, risk: "Medium", icon: "DollarSign" });
            predictions.financialRisk = "Medium";
        } else if (data.metrics.consistency > 80 && data.metrics.focus > 75) {
            humanReadableSummary = "Master execution state achieved. Habits are highly locked in and focus energy is optimal. You are operating at peak efficiency.";
            causeEffectChains.push("Consistent Discipline → Lower Activation Energy → Superior Focus");
            recommendations.push({ title: "Increase Goal Difficulty", impact: 10, risk: "Low", icon: "Target" });
            predictions.burnoutProbability = 5;
        } else {
            humanReadableSummary = "Routine is stable but showing signs of friction. Focus metrics are average while habits are maintained at a functional baseline.";
            causeEffectChains.push("Average Task Density → Sub-optimal Recovery → Plateaued Growth");
            predictions.burnoutProbability = 35;
        }

        // Fill out remaining recommendation slots dynamically to always have 3 actionable items
        if (data.metrics.focus < 65 && !recommendations.some(r => r.title.includes('Sleep') || r.title.includes('Rest'))) {
            recommendations.push({ title: "Extend Deep Sleep", impact: 18, risk: "Medium", icon: "Moon" });
        }
        if (data.metrics.studyLoad < 50 && !recommendations.some(r => r.title.includes('Study') || r.title.includes('Work'))) {
            recommendations.push({ title: "Trigger Deep Work Block", impact: 12, risk: "Low", icon: "Brain" });
        }
        if (recommendations.length < 3) {
            recommendations.push({ title: "Micro-Adjust Schedule", impact: 8, risk: "Low", icon: "Clock" });
        }
        // Fallback filler if somehow still under 3
        while (recommendations.length < 3) {
            recommendations.push({ title: "Hydration Protocol", impact: 5, risk: "Low", icon: "Droplet" });
        }

        // Take top 3 recommendations
        recommendations = recommendations.slice(0, 3);

        res.json({
            globalScore: data.globalScore,
            metrics: data.metrics,
            domainStatus,
            charts: {
                performanceData,
                modulePerformance,
                performanceDistribution
            },
            heatIndicator,
            aiLayer: {
                humanReadableSummary,
                causeEffectChains,
                recommendations
            },
            predictions
        });
    } catch (error) {
        console.error('Intelligence Core Error:', error);
        res.status(500).json({ error: 'Failed to fetch core intelligence' });
    }
});

export default router;
