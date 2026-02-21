import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Brain, ArrowLeft, Target, Timer, Flame, Clock, BookOpen, FileText, DollarSign, CheckSquare, TriangleAlert, Bell, CalendarIcon, Loader2, Sparkles, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { intelligenceAPI } from '../utils/api';
import './RoutineIntelligenceCore.css';

const ModuleIcons = {
    'Time': { icon: Clock, color: '#3b82f6', route: '/time-analytics' },
    'Goals': { icon: Target, color: '#a855f7', route: '/goals' },
    'Focus': { icon: Timer, color: '#0ea5e9', route: '/focus' },
    'Habits': { icon: Flame, color: '#ec4899', route: '/habits' },
    'Attendance': { icon: CheckSquare, color: '#10b981', route: '/attendance' },
    'Routines': { icon: CalendarIcon, color: '#f59e0b', route: '/routines' },
    'Study': { icon: BookOpen, color: '#f97316', route: '/study' },
    'Documents': { icon: FileText, color: '#06b6d4', route: '/documents' },
    'Expenses': { icon: DollarSign, color: '#ef4444', route: '/expenses' }
};

export default function RoutineIntelligenceCore() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInsights, setShowInsights] = useState(false);
    const [timeframe, setTimeframe] = useState('This Week');
    const [expandedRec, setExpandedRec] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadCoreData = async () => {
            try {
                const res = await intelligenceAPI.getCore();
                setData(res.data);
            } catch (error) {
                console.error("Error loading intelligence core:", error);
            } finally {
                setLoading(false);
            }
        };
        loadCoreData();
    }, []);

    if (loading) {
        return (
            <div className="ric-core-loader">
                <Loader2 className="animate-spin" size={48} color="#a855f7" />
                <p>Initializing Master Analytics...</p>
            </div>
        );
    }

    if (!data) {
        return <div className="ric-core-loader">System Offline. Failed to connect to Master Brain.</div>;
    }

    // Prepare Sparkline data for Flanks
    const consistencyData = [{ v: 40 }, { v: 60 }, { v: data.metrics.consistency }];
    const focusData = [{ v: 50 }, { v: 70 }, { v: data.metrics.focus }];

    return (
        <div className="ric-core-page animate-fade-in">

            {/* Header */}
            <header className="ric-core-topbar">
                <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={24} /></button>
                <div className="core-title-container animate-fade-in" style={{ flexWrap: 'nowrap', minWidth: 0 }}>
                    <h1 className="module-title text-gradient" style={{ margin: 0, fontSize: '28px', fontWeight: 800, lineHeight: 1.1, whiteSpace: 'normal', wordBreak: 'break-word' }}>Routine Intelligence</h1>
                    <span className="badge" style={{ fontSize: '0.85rem', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>Core</span>
                </div>
                <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isSearching ? (
                        <div className="search-bar animate-fade-in" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '6px 14px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                            <Search size={16} className="text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search queries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onBlur={() => !searchQuery && setIsSearching(false)}
                                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', marginLeft: '8px', fontSize: '0.9rem', width: '130px', padding: 0 }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // mock search execute
                                        setIsSearching(false);
                                        setSearchQuery('');
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <button className="icon-btn" onClick={() => setIsSearching(true)}>
                            <Search size={20} />
                        </button>
                    )}
                </div>
            </header>

            <div className="ric-core-grid">

                {/* LEFT COLUMN - Main Analytics */}
                <div className="left-column">

                    {/* Master Health Widget */}
                    <div className="ric-panel health-panel">
                        <div className="panel-title text-center" style={{ marginBottom: 0 }}>Health Score</div>
                        <div className="health-dial-container">
                            <div className="health-dial-glow"></div>
                            <div className="health-dial">
                                <svg viewBox="0 0 100 100">
                                    <defs>
                                        <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#ec4899" />
                                            <stop offset="50%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                    <circle className="dial-bg" cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                                    <circle className="dial-fg" cx="50" cy="50" r="45" stroke="url(#score-grad)" strokeWidth="6" fill="none" strokeDasharray="283" strokeDashoffset={`${283 - (data.globalScore / 100) * 283}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                                </svg>
                                <div className="dial-content">
                                    <Brain size={48} className="brain-core-icon" />
                                    <div className="score-num">{data.globalScore}</div>
                                    <div className="score-max">/100</div>
                                </div>
                            </div>
                        </div>

                        {/* Flanking Metrics underneath the dial to match the image */}
                        <div className="health-flanks">
                            <div className="flank">
                                <span className="title">Consistency</span>
                                <span className="value" style={{ color: '#60a5fa' }}>{data.metrics.consistency}%</span>
                                <div style={{ height: '30px', width: '100%', marginTop: '5px' }}>
                                    <ResponsiveContainer>
                                        <AreaChart data={consistencyData}>
                                            <defs><linearGradient id="gf1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} /><stop offset="100%" stopColor="#60a5fa" stopOpacity={0} /></linearGradient></defs>
                                            <Area type="monotone" dataKey="v" stroke="#60a5fa" fill="url(#gf1)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="flank">
                                <span className="title right">Focus Energy</span>
                                <span className="value right" style={{ color: '#a78bfa' }}>{data.metrics.focus}%</span>
                                <div style={{ height: '30px', width: '100%', marginTop: '5px' }}>
                                    <ResponsiveContainer>
                                        <AreaChart data={focusData}>
                                            <defs><linearGradient id="gf2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs>
                                            <Area type="monotone" dataKey="v" stroke="#a78bfa" fill="url(#gf2)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Module Status Grid */}
                    <div className="ric-panel module-grid-panel">
                        <div className="panel-header">
                            <div className="panel-title" style={{ marginBottom: 0 }}>Module Status</div>
                            <span className="dropdown" onClick={() => setTimeframe(t => t === 'This Week' ? 'This Month' : (t === 'This Month' ? 'All Time' : 'This Week'))} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                                {timeframe} <ChevronRight size={14} style={{ transform: timeframe !== 'This Week' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                            </span>
                        </div>
                        <div className="modules-grid-container">
                            {data.charts.modulePerformance.map((mod, i) => {
                                const Meta = ModuleIcons[mod.name] || ModuleIcons['Focus'];
                                const Icon = Meta.icon;
                                return (
                                    <div key={i} className="module-micro-card" onClick={() => navigate(Meta.route || '/')} style={{ cursor: 'pointer' }}>
                                        <div className="mod-head">
                                            <Icon size={20} className="mod-icon" style={{ color: Meta.color, filter: `drop-shadow(0 0 5px ${Meta.color})` }} />
                                            <span>{mod.name}</span>
                                        </div>
                                        <div className="mod-score">{mod.score}%</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Performance & Failure Row */}
                    <div className="perf-failure-row">
                        {/* Performance Overview (Line Chart) */}
                        <div className="ric-panel perf-panel">
                            <div className="panel-title">Performance Overview</div>
                            <div className="chart-legends">
                                <span className="leg focus"><span className="b dot"></span> Focus</span>
                                <span className="leg load"><span className="c dot"></span> Load</span>
                                <span className="leg study"><span className="o dot"></span> Study</span>
                            </div>
                            <div className="chart-container" style={{ height: '220px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.charts.performanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gFocus" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="gLoad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="gStudy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} /><stop offset="95%" stopColor="#ec4899" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dx={-5} width={35} />

                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(10, 5, 20, 0.9)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', color: '#f8fafc' }}
                                            itemStyle={{ color: '#e2e8f0', fontSize: '0.85rem' }}
                                            labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}
                                        />

                                        <Area type="monotone" dataKey="focus" stroke="#8b5cf6" fill="url(#gFocus)" strokeWidth={3} activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} dot={false} />
                                        <Area type="monotone" dataKey="load" stroke="#0ea5e9" fill="url(#gLoad)" strokeWidth={3} activeDot={{ r: 6, fill: '#fff', stroke: '#0ea5e9', strokeWidth: 2 }} dot={false} />
                                        <Area type="monotone" dataKey="study" stroke="#ec4899" fill="url(#gStudy)" strokeWidth={3} activeDot={{ r: 6, fill: '#fff', stroke: '#ec4899', strokeWidth: 2 }} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Failure Causes (Pie Chart) */}
                        <div className="ric-panel failure-panel">
                            <div className="panel-title">Failure Causes</div>
                            <div className="pie-container flex-col-center">
                                <div style={{ width: '100%', height: '160px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={data.charts.failureCauses} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                                                {data.charts.failureCauses.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pie-center-text">This<br />Week</div>
                                </div>
                                <div className="pie-legends">
                                    {data.charts.failureCauses.map((entry, i) => (
                                        <div key={i} className="pie-leg">
                                            <span className="dot" style={{ backgroundColor: entry.fill, boxShadow: `0 0 8px ${entry.fill}` }}></span>
                                            <span className="name">{entry.name}</span>
                                            <span className="val">{entry.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Sidebar */}
                <div className="right-column">

                    {/* AI Summary Sidebar */}
                    <div className="ric-panel ai-summary-panel">
                        <div className="panel-title">AI Summary</div>
                        <div className="ai-summary-content">
                            {data.metrics.consistency > 75 ? (
                                <div className="summary-item positive"><span className="dot bg-blue-500"></span> Strong Habits Maintained</div>
                            ) : (
                                <div className="summary-item warning"><TriangleAlert size={16} /> Inconsistent Habits</div>
                            )}
                            {data.metrics.studyLoad > 80 ? (
                                <div className="summary-item warning"><TriangleAlert size={16} /> Approaching Study Overload</div>
                            ) : (
                                <div className="summary-item positive"><span className="dot bg-green-500"></span> Study Load Stable</div>
                            )}
                            {data.metrics.financial < 60 ? (
                                <div className="summary-item highlight"><FileText size={16} /> Expense Drift Detected</div>
                            ) : (
                                <div className="summary-item positive"><span className="dot bg-green-500"></span> Finances Stable</div>
                            )}

                            <div className="brain-graphic-small">
                                <Brain size={80} className="text-blue-400" style={{ filter: 'drop-shadow(0 0 15px rgba(96, 165, 250, 0.5))' }} />
                            </div>

                            {showInsights && (
                                <div className="insights-expansion animate-fade-in" style={{ marginTop: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                    <div style={{ color: '#f1f5f9', marginBottom: '0.5rem', fontWeight: 600 }}>AI Synthesis</div>
                                    <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', lineHeight: 1.5 }}>{data.aiLayer.humanReadableSummary}</p>
                                    <div style={{ color: '#f1f5f9', marginBottom: '0.25rem', fontWeight: 600 }}>Causal Chain Detected</div>
                                    <p style={{ color: '#fca5a5', lineHeight: 1.5 }}>{data.aiLayer.causeEffectChains[0]}</p>
                                </div>
                            )}

                            <button className="insights-btn" onClick={() => setShowInsights(!showInsights)}>
                                {showInsights ? 'Close Insights' : 'Deep Insights >'}
                            </button>
                        </div>
                    </div>

                    {/* AI Recommendations */}
                    <div className="ric-panel ai-recs-panel">
                        <div className="panel-title">AI Recommendations</div>
                        <div className="recs-list">
                            {data.aiLayer.recommendations.map((rec, i) => (
                                <div key={i} className="rec-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setExpandedRec(expandedRec === i ? null : i)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                                        <div className="rec-icon"><Sparkles size={20} className="text-purple-400" /></div>
                                        <div className="rec-info">
                                            <div className="title">{rec.title}</div>
                                            <div className="impact-bar-container">
                                                <div className="impact-text">Expected Impact +{rec.impact}%</div>
                                                <div className="impact-bar">
                                                    <div className="fill" style={{ width: `${rec.impact * 4}%`, background: i === 0 ? '#10b981' : (i === 1 ? '#8b5cf6' : '#f59e0b') }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rec-arrow"><ChevronRight size={20} style={{ transform: expandedRec === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} /></div>
                                    </div>

                                    {expandedRec === i && (
                                        <div className="animate-fade-in" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#94a3b8' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span>Risk Level:</span>
                                                <span style={{ fontWeight: 600, color: rec.risk === 'Low' ? '#10b981' : (rec.risk === 'Medium' ? '#f59e0b' : '#ef4444') }}>{rec.risk}</span>
                                            </div>
                                            <p style={{ lineHeight: 1.5 }}>Action: Execute this adjustment carefully over the next 48 hours to secure the projected impact on your Global Health Score.</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Predictions */}
                    <div className="ric-panel predictions-panel">
                        <div className="panel-title">Predictions (7 Days)</div>
                        <div className="pred-stats">
                            <div className="p-stat warning">
                                <span className="label">Risk Day</span>
                                <span className="val"><TriangleAlert size={16} />{data.predictions.nextRiskDay}</span>
                            </div>
                            <div className="p-stat alert">
                                <span className="label">Burnout</span>
                                <span className="val"><Flame size={16} />{data.predictions.burnoutProbability}%</span>
                            </div>
                            <div className="p-stat safe">
                                <span className="label">Finance Risk</span>
                                <span className="val"><CheckSquare size={16} />{data.predictions.financialRisk}</span>
                            </div>
                        </div>
                        {/* Smooth prediction curve line */}
                        <div className="pred-chart" style={{ height: '90px', marginTop: '15px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[{ n: 1, v: 10 }, { n: 2, v: 25 }, { n: 3, v: 60 }, { n: 4, v: 85 }, { n: 5, v: 45 }, { n: 6, v: 20 }]}>
                                    <defs>
                                        <linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(10, 5, 20, 0.9)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f59e0b', fontSize: '0.85rem' }}
                                        labelStyle={{ display: 'none' }}
                                        formatter={(value) => [`${value}% Loss Risk`, '']}
                                    />
                                    <Area type="monotone" dataKey="v" stroke="#f59e0b" fill="url(#gPred)" strokeWidth={3} activeDot={{ r: 4, fill: '#fff' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
