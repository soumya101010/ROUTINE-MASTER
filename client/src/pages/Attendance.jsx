import { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, BookOpen, CheckCircle, XCircle, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Card from '../components/Card';
import { attendanceAPI } from '../utils/api';
import { formatMonthYear, getPreviousMonth, getNextMonth } from '../utils/dateHelpers';
import './Attendance.css';

export default function Attendance() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState([]);
    const [subjectStats, setSubjectStats] = useState([]);
    const [overallStats, setOverallStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // View state: 'summary' or 'detail'
    const [view, setView] = useState('summary');
    const [selectedSubject, setSelectedSubject] = useState(null);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        type: 'theory',
        status: 'present'
    });

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            console.log('Fetching attendance for', year, month);
            const res = await attendanceAPI.getMonthly(year, month);
            console.log('Attendance response:', res.data);

            setRecords(Array.isArray(res.data?.records) ? res.data.records : []);
            setSubjectStats(Array.isArray(res.data?.subjectStats) ? res.data.subjectStats : []);
            setOverallStats(res.data?.overallStats || null);
        } catch (err) {
            console.error('Attendance load error:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);
            setError(`Failed to load attendance data. ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Month navigation
    const handlePrevMonth = () => {
        setCurrentDate(getPreviousMonth(currentDate));
        setView('summary');
        setSelectedSubject(null);
    };
    const handleNextMonth = () => {
        setCurrentDate(getNextMonth(currentDate));
        setView('summary');
        setSelectedSubject(null);
    };

    // Subject drill-down
    const openSubjectDetail = (subjectName) => {
        setSelectedSubject(subjectName);
        setView('detail');
    };
    const backToSummary = () => {
        setView('summary');
        setSelectedSubject(null);
    };

    // Form logic
    const uniqueSubjects = [...new Set(records.map(r => r.subject).filter(Boolean))];

    const handleSubjectSelect = (subject) => {
        setFormData({ ...formData, subject });
        setFormStep(2);
    };
    const handleTypeSelect = (type) => {
        setFormData({ ...formData, type });
        setFormStep(3);
    };
    const handleStatusSelect = async (status) => {
        const finalData = { ...formData, status };
        setFormData(finalData);
        await submitAttendance(finalData);
    };

    const submitAttendance = async (data) => {
        try {
            await attendanceAPI.create(data);
            resetForm();
            loadData();
        } catch (err) {
            console.error('Error creating record:', err);
            alert('Failed to log attendance.');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setFormStep(1);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            subject: '',
            type: 'theory',
            status: 'present'
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await attendanceAPI.delete(id);
            loadData();
        } catch (err) {
            console.error('Error deleting:', err);
            alert('Failed to delete record.');
        }
    };

    // Helper: calculate percentage safely
    const pct = (present, total) => total > 0 ? ((present / total) * 100).toFixed(1) : '—';

    // Loading state
    if (loading) {
        return (
            <div className="attendance-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="attendance-page" style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>{error}</h3>
                <button className="btn btn-primary" onClick={loadData}>Retry</button>
            </div>
        );
    }

    // --- Subject Detail View (Level 3) ---
    if (view === 'detail' && selectedSubject) {
        const stat = subjectStats.find(s => s._id === selectedSubject);
        const subjectRecords = records.filter(r => r.subject === selectedSubject);

        return (
            <div className="attendance-page">
                <button className="back-btn" onClick={backToSummary}>
                    <ArrowLeft size={20} />
                    Back to Summary
                </button>

                <h2 className="detail-subject-title">{selectedSubject}</h2>
                <p className="detail-month-label">{formatMonthYear(currentDate)}</p>

                {stat && (
                    <div className="detail-stats-row">
                        <div className="detail-stat">
                            <span className="detail-stat-label">Theory</span>
                            <span className="detail-stat-value">{pct(stat.theoryPresent, stat.theoryClasses)}%</span>
                            <span className="detail-stat-count">{stat.theoryPresent}/{stat.theoryClasses}</span>
                        </div>
                        <div className="detail-stat">
                            <span className="detail-stat-label">Practical</span>
                            <span className="detail-stat-value">{pct(stat.practicalPresent, stat.practicalClasses)}%</span>
                            <span className="detail-stat-count">{stat.practicalPresent}/{stat.practicalClasses}</span>
                        </div>
                        <div className="detail-stat">
                            <span className="detail-stat-label">Overall</span>
                            <span className={`detail-stat-value ${(stat.totalPresent / stat.totalClasses) * 100 >= 75 ? 'text-green' : 'text-red'}`}>
                                {pct(stat.totalPresent, stat.totalClasses)}%
                            </span>
                            <span className="detail-stat-count">{stat.totalPresent}/{stat.totalClasses}</span>
                        </div>
                    </div>
                )}

                <h3 className="section-heading">Date-wise Logs</h3>

                {subjectRecords.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={48} />
                        <h3>No logs for this subject</h3>
                    </div>
                ) : (
                    <div className="logs-section">
                        {subjectRecords.map((record) => (
                            <Card key={record._id} className="log-card">
                                <div className="log-content">
                                    <div className="log-header">
                                        <span className="log-date">
                                            <Calendar size={14} />
                                            {new Date(record.date).toLocaleDateString('en-GB')}
                                        </span>
                                        <button className="delete-btn" onClick={() => handleDelete(record._id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="log-meta">
                                        <span className={`type-badge ${record.type}`}>
                                            {record.type === 'practical' ? 'Practical' : 'Theory'}
                                        </span>
                                        <span className={`status-indicator ${record.status}`}>
                                            {record.status === 'present' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                            {record.status === 'present' ? 'Present' : 'Absent'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- Summary View (Level 1 + 2) ---
    return (
        <div className="attendance-page">
            <div className="page-header">
                <h1 className="module-title text-gradient">Attendance Tracker</h1>
            </div>

            <button className="btn btn-primary add-button" onClick={() => setShowForm(!showForm)}>
                <Plus size={20} />
                Log Class
            </button>

            {/* Log Class Form */}
            {showForm && (
                <Card className="attendance-form">
                    <div className="form-steps">
                        {formStep === 1 && (
                            <div className="step-content">
                                <h3>Select Date & Subject</h3>
                                <div className="date-input-container">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="date-picker-input"
                                    />
                                </div>

                                <h4>Subject</h4>
                                <div className="subject-grid">
                                    {uniqueSubjects.length > 0 ? (
                                        uniqueSubjects.map(sub => (
                                            <button key={sub} className="btn btn-secondary" onClick={() => handleSubjectSelect(sub)}>
                                                {sub}
                                            </button>
                                        ))
                                    ) : (
                                        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No subjects yet. Enter one below.</p>
                                    )}
                                    <div className="custom-subject">
                                        <input
                                            type="text"
                                            placeholder="Or enter new subject..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.target.value) handleSubjectSelect(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {formStep === 2 && (
                            <div className="step-content">
                                <h3>Select Type</h3>
                                <div className="type-buttons">
                                    <button className="btn btn-secondary" onClick={() => handleTypeSelect('theory')}>
                                        <BookOpen size={20} /> Theory
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => handleTypeSelect('practical')}>
                                        <CheckCircle size={20} /> Practical
                                    </button>
                                </div>
                                <button className="btn-link" onClick={() => setFormStep(1)}>Back</button>
                            </div>
                        )}

                        {formStep === 3 && (
                            <div className="step-content">
                                <h3>Select Status</h3>
                                <div className="status-buttons">
                                    <button className="btn btn-success" onClick={() => handleStatusSelect('present')}>
                                        <CheckCircle size={20} /> Present
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleStatusSelect('absent')}>
                                        <XCircle size={20} /> Absent
                                    </button>
                                </div>
                                <button className="btn-link" onClick={() => setFormStep(2)}>Back</button>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Level 1: Month Navigator */}
            <div className="month-navigator">
                <button className="nav-btn" onClick={handlePrevMonth}>
                    <ChevronLeft size={24} />
                </button>
                <h2>{formatMonthYear(currentDate)}</h2>
                <button className="nav-btn" onClick={handleNextMonth}>
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Overall Stats Bar */}
            {overallStats && overallStats.totalClasses > 0 && (
                <div className="overall-bar">
                    <span className="overall-rate">{overallStats.attendanceRate}%</span>
                    <span className="overall-label">
                        {overallStats.totalPresent}/{overallStats.totalClasses} classes
                        &nbsp;·&nbsp; Theory: {overallStats.theoryClasses} &nbsp;·&nbsp; Practical: {overallStats.practicalClasses}
                    </span>
                </div>
            )}

            {/* Level 2: Subject Cards */}
            {subjectStats.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={48} />
                    <h3>No Attendance Records</h3>
                    <p>Log your first class for {formatMonthYear(currentDate)}.</p>
                </div>
            ) : (
                <div className="subject-cards-grid">
                    {subjectStats.map((stat) => {
                        const theoryPct = stat.theoryClasses > 0 ? ((stat.theoryPresent / stat.theoryClasses) * 100).toFixed(1) : null;
                        const practPct = stat.practicalClasses > 0 ? ((stat.practicalPresent / stat.practicalClasses) * 100).toFixed(1) : null;
                        const totalPct = stat.totalClasses > 0 ? ((stat.totalPresent / stat.totalClasses) * 100).toFixed(1) : 0;
                        const isGood = parseFloat(totalPct) >= 75;

                        return (
                            <Card
                                key={stat._id}
                                className="subject-card"
                                onClick={() => openSubjectDetail(stat._id)}
                            >
                                <div className="subject-card-header">
                                    <h3 className="subject-name">{stat._id}</h3>
                                    <span className={`total-badge ${isGood ? 'good' : 'low'}`}>
                                        {totalPct}%
                                    </span>
                                </div>

                                <div className="subject-card-body">
                                    {theoryPct !== null && (
                                        <div className="pct-row">
                                            <span className="pct-label">Theory</span>
                                            <div className="pct-bar-bg">
                                                <div className="pct-bar-fill theory" style={{ width: `${theoryPct}%` }} />
                                            </div>
                                            <span className="pct-value">{theoryPct}%</span>
                                        </div>
                                    )}
                                    {practPct !== null && (
                                        <div className="pct-row">
                                            <span className="pct-label">Practical</span>
                                            <div className="pct-bar-bg">
                                                <div className="pct-bar-fill practical" style={{ width: `${practPct}%` }} />
                                            </div>
                                            <span className="pct-value">{practPct}%</span>
                                        </div>
                                    )}
                                </div>

                                <div className="subject-card-footer">
                                    <span className="class-count">{stat.totalPresent}/{stat.totalClasses} classes attended</span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
