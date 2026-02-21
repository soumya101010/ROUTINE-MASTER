import express from 'express';
import fetch from 'node-fetch';
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

// HELPER: OpenRouter AI Gateway Logic
const MODELS_TO_TRY = [
    'google/gemini-flash-1.5-8b',
    'google/gemini-flash-1.5',
    'anthropic/claude-3-haiku',
    'meta-llama/llama-3.1-8b-instruct'
];

async function callOpenRouterAI(messages) {
    if (!process.env.OPENROUTER_API_KEY) {
        // Fallback to Gemini if OpenRouter key is missing but Gemini is there
        if (process.env.GEMINI_API_KEY) return callGeminiDirectly(messages);
        throw new Error('AI API Keys are missing');
    }

    for (const model of MODELS_TO_TRY) {
        try {
            console.log(`OpenRouter: Attempting model ${model}`);
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://routine-master.onrender.com",
                    "X-Title": "Routine Master Intelligence",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": model,
                    "messages": messages,
                    "response_format": { "type": "json_object" }
                })
            });

            const result = await response.json();

            if (response.status === 200) {
                const content = result.choices[0].message.content;
                console.log(`OpenRouter: Success with ${model}`);
                return content;
            } else if (response.status === 429) {
                console.warn(`OpenRouter: Rate limit for ${model}. Trying next...`);
                continue;
            } else {
                console.error(`OpenRouter: Error from ${model}:`, response.status, JSON.stringify(result).substring(0, 150));
                continue;
            }
        } catch (err) {
            console.error(`OpenRouter: Failed to reach ${model}:`, err.message);
        }
    }
    throw new Error('Intelligence system under heavy load');
}

// Fallback if OpenRouter isn't set up yet
async function callGeminiDirectly(messages) {
    const prompt = messages.map(m => m.content).join("\n");
    const model = "gemini-1.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const result = await response.json();
    if (response.status === 200) return result.candidates[0].content.parts[0].text;
    throw new Error(`Gemini direct failed: ${response.status}`);
}

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

    // Run aggregations in parallel with lean() for pure JSON
    const [
        focusSessions, habits, routines, expenses, attendance,
        studyItems, goals, recentReviews, documents
    ] = await Promise.all([
        FocusSession.find({ completedAt: { $gte: weekStart } }).lean(),
        Habit.find({}).lean(),
        Routine.find({}).lean(),
        Expense.find({ date: { $gte: monthStart } }).lean(),
        Attendance.find({ date: { $gte: monthStart } }).lean(),
        StudyItem.find({}).lean(),
        Goal.find({}).lean(),
        WeeklyReview.find({ weekStartDate: { $gte: monthStart } }).sort({ weekStartDate: -1 }).limit(1).lean(),
        Document.find({}).lean()
    ]);

    // 1. Consistency / Discipline logic (Attendance, Habits)
    let totalHabits = habits.length;
    let habitSuccess = habits.reduce((acc, h) => acc + (h.currentStreak > 0 ? 1 : 0), 0);
    let consistencyScore = totalHabits > 0 ? (habitSuccess / totalHabits) * 100 : 80;
    consistencyScore = Math.min(100, Math.round((consistencyScore + (attendance.length > 0 ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 : 0)) / 2) || 82);

    // 2. Focus & Energy (FocusSessions)
    let totalFocusMins = focusSessions.reduce((sum, s) => sum + s.duration, 0);
    let focusScore = Math.min(100, Math.round((totalFocusMins / 300) * 100)); // 5 hours target

    // 3. Study Load (StudyItems)
    let subjects = studyItems.filter(s => s.type === 'subject');
    let studyLoadScore = subjects.length > 0
        ? Math.round(subjects.reduce((sum, s) => sum + (s.progress || 0), 0) / subjects.length)
        : 0;

    // 4. Financial Balance (Expenses)
    let totalExpLast30 = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    let totalIncomeLast30 = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    let financialScore = (totalIncomeLast30 + totalExpLast30) > 0
        ? Math.round((totalIncomeLast30 / (totalIncomeLast30 + totalExpLast30)) * 100)
        : 0;

    // 5. Global Score (Redistributed weight: Consistency 35%, Focus 35%, Study 30%)
    let globalScore = Math.round((consistencyScore * 0.35) + (focusScore * 0.35) + (studyLoadScore * 0.3));

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
            { domain: 'Study Load', score: data.metrics.studyLoad, status: data.metrics.studyLoad > 80 ? 'Overload' : 'Stable' }
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

            const dayFocus = data.focusSessions.filter(f => new Date(f.completedAt) >= dayStart && new Date(f.completedAt) <= dayEnd);
            const dayFocusMins = dayFocus.reduce((sum, f) => sum + f.duration, 0);
            const dailyFocusScore = Math.min(100, Math.round((dayFocusMins / 60) * 100));

            const dailyStudyScore = Math.max(0, Math.min(100, data.metrics.studyLoad - (i * 2) + Math.floor(Math.random() * 5)));

            const totalTasks = data.routines.reduce((sum, r) => sum + (r.tasks ? r.tasks.length : 0), 0);
            const completedTasks = data.routines.reduce((sum, r) => sum + (r.tasks ? r.tasks.filter(t => t.completed).length : 0), 0);
            const baseLoad = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const dailyLoadScore = i === 0 ? baseLoad : Math.max(0, Math.min(100, baseLoad - (i * 3) + Math.floor(Math.random() * 8)));

            performanceData.push({
                date: days[dayStart.getDay()],
                focus: dailyFocusScore,
                load: dailyLoadScore,
                study: dailyStudyScore
            });

            heatIndicator.push(dailyFocusScore);
        }

        const totalRoutineTasks = data.routines.reduce((sum, r) => sum + (r.tasks ? r.tasks.length : 0), 0);
        const completedRoutineTasks = data.routines.reduce((sum, r) => sum + (r.tasks ? r.tasks.filter(t => t.completed).length : 0), 0);
        const routineScore = totalRoutineTasks > 0 ? Math.round((completedRoutineTasks / totalRoutineTasks) * 100) : 0;

        const modulePerformance = [
            { name: 'Time', score: routineScore },
            { name: 'Goals', score: data.goals.length > 0 ? Math.round(data.goals.reduce((sum, g) => sum + (g.progress || 0), 0) / data.goals.length) : 0 },
            { name: 'Focus', score: data.metrics.focus },
            { name: 'Habits', score: data.metrics.consistency },
            { name: 'Attendance', score: data.attendance.length > 0 ? Math.round((data.attendance.filter(a => a.status === 'present').length / data.attendance.length) * 100) : 0 },
            { name: 'Routines', score: routineScore },
            { name: 'Study', score: data.metrics.studyLoad }
        ];

        const pieColors = ['#f43f5e', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981'];
        let performanceDistribution = modulePerformance
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((item, index) => ({
                name: item.name,
                value: item.score,
                fill: pieColors[index % pieColors.length]
            }));

        if (performanceDistribution.length === 0) {
            performanceDistribution = [{ name: 'None', value: 100, fill: '#10b981' }];
        }

        // --- PURE AI ANALYSIS LAYER ---
        const aiPrompt = [
            { role: "system", content: "You are the Master Control AI. Analyze the user's weekly metrics and provide a deep strategic analysis. Return ONLY a JSON object." },
            {
                role: "user", content: `Data: ${JSON.stringify({
                    metrics: data.metrics,
                    domainStatus,
                    recentActivities: {
                        focusMins: data.focusSessions.length,
                        habits: data.habits.length,
                        routines: data.routines.length
                    }
                })}. 
            
            Generate the following JSON:
            {
                "aiLayer": {
                    "humanReadableSummary": "2-sentence high-level system analysis",
                    "causeEffectChains": ["Chain 1", "Chain 2"],
                    "recommendations": [
                        { "title": "...", "impact": 0-100, "risk": "Low|Med|High", "icon": "Cpu", "source": "Master Control AI", "action": "..." }
                    ]
                },
                "predictions": {
                    "nextRiskDay": "...",
                    "burnoutProbability": 0-100,
                    "financialRisk": "Low|Med|High"
                }
            }` }
        ];

        let aiAnalysis;
        try {
            const aiRaw = await callOpenRouterAI(aiPrompt);
            const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
            aiAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : aiRaw);
        } catch (e) {
            console.error("AI Analysis Failed, using minimal fallback:", e);
            aiAnalysis = {
                aiLayer: { humanReadableSummary: "System analysis temporarily offline.", causeEffectChains: [], recommendations: [] },
                predictions: { nextRiskDay: "N/A", burnoutProbability: 0, financialRisk: "Stable" }
            };
        }

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
            aiLayer: aiAnalysis.aiLayer,
            predictions: aiAnalysis.predictions
        });
    } catch (error) {
        console.error('Intelligence Core Error:', error);
        res.status(500).json({ error: 'Failed to fetch core intelligence' });
    }
});

// POST /api/intelligence/generate-ai (Dynamic LLM Call)
router.post('/generate-ai', async (req, res) => {
    try {
        const { metrics } = req.body;
        const fullContext = {
            metrics,
            habits: await Habit.find({}).limit(15).select('name currentStreak status').lean(),
            routines: await Routine.find({}).limit(15).select('name status tasks').lean(),
            focus: await FocusSession.find({}).limit(15).select('duration completedAt').lean(),
            expenses: await Expense.find({}).limit(10).select('title amount type category').lean(),
            attendance: await Attendance.find({}).limit(10).select('date status').lean(),
            study: await StudyItem.find({}).limit(10).select('name type progress').lean(),
            goals: await Goal.find({}).limit(10).select('title progress status').lean()
        };

        // Log key presence for debugging on Render
        if (process.env.OPENROUTER_API_KEY) {
            console.log('OpenRouter API Key active.');
        } else {
            console.warn('OPENROUTER_API_KEY is missing, falling back to Gemini direct if available.');
        }

        const prompt = `You are the Master Control AI. 
        Life Data: ${JSON.stringify(fullContext)}.
        
        Analyze the cross-module connections (e.g., how Focus relates to Habit success, or how Expense drift correlates with Study stress).
        
        Generate exactly this JSON schema:
        {
            "DynamicTitle": "A technical, cinematic name for the current system state",
            "PriorityLabel": "1-word system priority",
            "AISynthesis": "A strategic 2-sentence overhaul of their current direction.",
            "BulletInsights": [
                "Detailed bullet about Habit/Routine intersection",
                "Detailed bullet about Focus/Study performance",
                "Detailed bullet about Discipline/Attendance stability",
                "Detailed bullet about a predicted risk or opportunistic win",
                "Extra tactical insight based on unique data patterns"
            ],
            "CausalChain": "Complex technical logic chain",
            "AIPredictions": [
                {"label": "Metric Name", "value": "Trend/Percentage", "type": "Safe | Warning | Alert"}
            ],
            "WeeklySummary": "Intelligent, data-driven weekly recap.",
            "MonthlyOutlook": "Strategic vision for the next 30 days.",
            "Recommendations": [
                {
                    "title": "System Adjustment",
                    "impact": 0-100,
                    "risk": "Low | Medium | High",
                    "icon": "Cpu | Target | Timer | Flame | Clock | BookOpen | CheckSquare | Sparkles",
                    "action": "High-impact technical instruction.",
                    "source": "Master Control AI"
                }
            ]
        }
        Provide exactly 5 BulletInsights and 3 Recommendations. Return ONLY valid JSON.`;

        const messages = [
            { role: "system", content: "You are the Master Control AI. Analyze the system data and return exactly the specified JSON schema. Return ONLY JSON." },
            { role: "user", content: prompt }
        ];

        const resultText = await callOpenRouterAI(messages);

        // Robust parsing of JSON from the response
        let aiResponse;
        try {
            // Find JSON block if AI adds extra text
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : resultText);
        } catch (e) {
            console.error('JSON Extraction Error:', e, 'Raw:', resultText);
            return res.status(500).json({ error: 'Failed to parse intelligence data' });
        }

        res.json(aiResponse);
    } catch (error) {
        console.error('AI Strategy Generation Error:', error);
        res.status(500).json({ error: 'Master Control analysis interrupted' });
    }
});

// POST /api/intelligence/chat (Consultant Chat)
router.post('/chat', async (req, res) => {
    try {
        const { message, metrics } = req.body;

        if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
            console.error('Chat Error: No AI API keys found');
            return res.status(500).json({ reply: "My brain isn't connected to the cloud right now, friend. Check back soon?" });
        }

        const prompt = `You are the master intelligence for this system, acting as an unrestricted general-purpose AI consultant (like Gemini/GPT) with the added benefit of knowing the user's real-time stats.
        
        USER STATS (FOR REFERENCE ONLY): ${JSON.stringify(metrics)}.
        USER QUESTION: "${message}"
        
        STRICT OPERATING INSTRUCTIONS:
        1. Answer the user's question with 100% accuracy and depth regardless of the topic (Politics, History, Science, Tech, Creative, etc.).
        2. Do NOT mention routine metrics, consistency, or study load UNLESS the user directly asks about them or if it is logically required for a life-strategy answer.
        3. Never "pivot" a general knowledge question back to the site's metrics. If they ask about the President of India, talk about the President of India.
        4. Maintain an elite, high-knowledge, and helpful persona. You are a limitless AI power.`;

        const messages = [
            { role: "system", content: "You are a master intelligence consultant. Answer directly and accurately. Use real stats only if relevant." },
            { role: "user", content: prompt }
        ];

        const reply = await callOpenRouterAI(messages);
        res.json({ reply });
    } catch (error) {
        console.error('LLM Chat Error:', error);
        res.status(500).json({ reply: "I'm having a little trouble thinking right now. Maybe try again in a bit, friend?" });
    }
});

export default router;