import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useEffect, useState } from 'react';
import { intelligenceAPI } from '../utils/api';
import './RoutineIntelligenceCard.css';

const CircularProgress = ({ value, label, color, gradientId }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="ric-micro-indicator">
            <div className="ric-circle-container">
                <svg className="ric-circle-svg" width="70" height="70" viewBox="0 0 70 70">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color.start} />
                            <stop offset="100%" stopColor={color.end} />
                        </linearGradient>
                    </defs>
                    <circle
                        className="ric-circle-bg"
                        cx="35" cy="35" r={radius}
                        strokeWidth="5" fill="none"
                    />
                    <circle
                        className="ric-circle-progress"
                        cx="35" cy="35" r={radius}
                        strokeWidth="5" fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 35 35)"
                    />
                </svg>
                <div className="ric-circle-value">{value}%</div>
            </div>
            <div className="ric-micro-label">{label}</div>
            <div className="ric-micro-subvalue" style={{ color: color.start }}>{value}%</div>
        </div>
    );
};

export default function RoutineIntelligenceCard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await intelligenceAPI.getDashboard();
                setData(res.data);
            } catch (err) {
                console.error("Failed to load Intelligence Dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="ric-card ric-loading animate-fade-in glass-card">
                <div className="animate-pulse">Loading Core Intelligence...</div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <Link to="/routine-intelligence" className="ric-card-link animate-fade-in">
            <div className="ric-card glass-card">
                <div className="ric-glow-backdrop"></div>

                <div className="ric-header">
                    <div className="ric-icon-container">
                        <Brain size={48} className="ric-brain-icon" />
                    </div>
                    <h2 className="ric-title">Routine Intelligence</h2>
                    <div className="ric-subtitle">
                        Global Routine Health <span className="ric-score-badge">{data.globalScore}</span>
                    </div>
                </div>

                <div className="ric-metrics-row">
                    <CircularProgress
                        value={data.metrics.consistency}
                        label="Consistency"
                        color={{ start: '#3b82f6', end: '#60a5fa' }}
                        gradientId="grad-consistency"
                    />
                    <CircularProgress
                        value={data.metrics.focus}
                        label="Focus"
                        color={{ start: '#8b5cf6', end: '#a78bfa' }}
                        gradientId="grad-focus"
                    />
                    <CircularProgress
                        value={data.metrics.studyLoad}
                        label="Study Load"
                        color={{ start: '#0ea5e9', end: '#38bdf8' }}
                        gradientId="grad-study"
                    />
                </div>

                <div className="ric-insight-pill">
                    {data.miniInsight}
                </div>
            </div>
        </Link>
    );
}
