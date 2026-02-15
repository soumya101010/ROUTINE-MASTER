import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, CheckCircle, XCircle, TrendingUp, DollarSign, Save } from 'lucide-react';
import Card from '../components/Card';
import { weeklyReviewAPI, routineAPI, expenseAPI } from '../utils/api';
import './WeeklyReview.css';

export default function WeeklyReview() {
    const navigate = useNavigate();
    const [review, setReview] = useState(null);
    const [history, setHistory] = useState([]);
    const [reflections, setReflections] = useState({ wentWell: '', didntGoWell: '', improvements: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewingHistory, setViewingHistory] = useState(false);

    useEffect(() => {
        loadReview();
    }, []);

    const loadReview = async () => {
        try {
            const [currentRes, historyRes] = await Promise.all([
                weeklyReviewAPI.getCurrent(),
                weeklyReviewAPI.getAll()
            ]);
            setReview(currentRes.data);
            setReflections(currentRes.data.reflections || { wentWell: '', didntGoWell: '', improvements: '' });
            setHistory(historyRes.data || []);

            // Auto-generate summary from existing data
            await generateSummary(currentRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const generateSummary = async (existingReview) => {
        try {
            const [routinesRes, expensesRes] = await Promise.all([
                routineAPI.getAll(1, 1000),
                expenseAPI.getDashboardStats()
            ]);

            // Handle paginated response { data: [], ... }
            const routines = routinesRes.data.data || routinesRes.data.items || (Array.isArray(routinesRes.data) ? routinesRes.data : []);
            const completed = routines.filter(r => r.isCompleted || r.completed).length;
            const missed = routines.length - completed;

            const stats = expensesRes.data;
            const recentStats = stats.recent?.totalStats?.[0] || { totalIncome: 0, totalExpense: 0 };

            const summary = {
                routinesCompleted: completed,
                routinesMissed: missed,
                totalExpenses: recentStats.totalExpense || 0,
                totalIncome: recentStats.totalIncome || 0
            };

            setReview(prev => ({ ...prev, summary }));
        } catch (err) {
            console.error(err);
        }
    };

    const saveReflections = async () => {
        if (!review) return;
        setSaving(true);
        try {
            await weeklyReviewAPI.save({
                reflections,
                summary: review.summary
            });
            alert('Weekly Review saved successfully!');
            loadReview(); // Refresh history with new data
        } catch (err) {
            console.error(err);
            alert('Failed to save reflection. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const formatDateRange = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        const opts = { month: 'short', day: 'numeric' };
        return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
    };

    if (loading) {
        return (
            <div className="review-page">
                <div className="loading-state">Loading review...</div>
            </div>
        );
    }

    return (
        <div className="review-page">
            <button className="back-btn" onClick={() => navigate('/')}>
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            <h1 className="module-title text-gradient">Weekly Review</h1>

            {review && (
                <p className="week-range">{formatDateRange(review.weekStart, review.weekEnd)}</p>
            )}

            <div className="review-toggle">
                <button
                    className={`toggle-btn ${!viewingHistory ? 'active' : ''}`}
                    onClick={() => setViewingHistory(false)}
                >
                    This Week
                </button>
                <button
                    className={`toggle-btn ${viewingHistory ? 'active' : ''}`}
                    onClick={() => setViewingHistory(true)}
                >
                    History ({history.length})
                </button>
            </div>

            {!viewingHistory ? (
                <>
                    {/* Auto-generated Summary */}
                    <div className="summary-grid">
                        <Link to="/routines" className="summary-link">
                            <Card className="summary-card pointer">
                                <CheckCircle size={20} className="summary-icon success" />
                                <div className="summary-val">{review?.summary?.routinesCompleted || 0}</div>
                                <div className="summary-lbl">Routines Done</div>
                            </Card>
                        </Link>
                        <Link to="/routines" className="summary-link">
                            <Card className="summary-card pointer">
                                <XCircle size={20} className="summary-icon danger" />
                                <div className="summary-val">{review?.summary?.routinesMissed || 0}</div>
                                <div className="summary-lbl">Missed</div>
                            </Card>
                        </Link>
                        <Link to="/expenses" className="summary-link">
                            <Card className="summary-card pointer">
                                <TrendingUp size={20} className="summary-icon accent" />
                                <div className="summary-val">₹{(review?.summary?.totalIncome || 0).toLocaleString()}</div>
                                <div className="summary-lbl">Income</div>
                            </Card>
                        </Link>
                        <Link to="/expenses" className="summary-link">
                            <Card className="summary-card pointer">
                                <DollarSign size={20} className="summary-icon warn" />
                                <div className="summary-val">₹{(review?.summary?.totalExpenses || 0).toLocaleString()}</div>
                                <div className="summary-lbl">Expenses</div>
                            </Card>
                        </Link>
                    </div>

                    {/* Reflection Inputs */}
                    <Card className="reflection-card">
                        <h2>Reflections</h2>

                        <div className="reflection-field">
                            <label>✅ What went well?</label>
                            <textarea
                                value={reflections.wentWell}
                                onChange={(e) => setReflections({ ...reflections, wentWell: e.target.value })}
                                placeholder="I maintained my study schedule..."
                                rows={3}
                            />
                        </div>

                        <div className="reflection-field">
                            <label>❌ What didn't go well?</label>
                            <textarea
                                value={reflections.didntGoWell}
                                onChange={(e) => setReflections({ ...reflections, didntGoWell: e.target.value })}
                                placeholder="I skipped two routines..."
                                rows={3}
                            />
                        </div>

                        <div className="reflection-field">
                            <label>🚀 Improvements for next week</label>
                            <textarea
                                value={reflections.improvements}
                                onChange={(e) => setReflections({ ...reflections, improvements: e.target.value })}
                                placeholder="I'll set reminders for morning routines..."
                                rows={3}
                            />
                        </div>

                        <button className="save-btn" onClick={saveReflections} disabled={saving}>
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save Reflections'}
                        </button>
                    </Card>
                </>
            ) : (
                <div className="history-list">
                    {history.length === 0 ? (
                        <div className="empty-state">
                            <ClipboardList size={48} />
                            <p>No past reviews yet.</p>
                        </div>
                    ) : (
                        history.map((r, i) => (
                            <Card key={i} className="history-card">
                                <div className="history-header">
                                    <span className="history-range">{formatDateRange(r.weekStart, r.weekEnd)}</span>
                                    <span className="history-stats">
                                        ✅ {r.summary?.routinesCompleted || 0} · ❌ {r.summary?.routinesMissed || 0}
                                    </span>
                                </div>
                                {r.reflections?.wentWell && (
                                    <p className="history-reflection">✅ {r.reflections.wentWell}</p>
                                )}
                                {r.reflections?.didntGoWell && (
                                    <p className="history-reflection">❌ {r.reflections.didntGoWell}</p>
                                )}
                                {r.reflections?.improvements && (
                                    <p className="history-reflection">🚀 {r.reflections.improvements}</p>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
