import { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import GravityContainer from '../components/GravityContainer';
import Card from '../components/Card';
import { attendanceAPI } from '../utils/api';
import './Reminders.css'; // Reusing Reminders CSS for consistency

export default function Attendance() {
    const [stats, setStats] = useState({ totalClasses: 0, theory: 0, practical: 0, present: 0, absent: 0 });
    const [attendanceList, setAttendanceList] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        type: 'theory',
        status: 'present'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await attendanceAPI.getAll(1, 100);
            setAttendanceList(response.data.data || []);
            setStats(response.data.stats || { totalClasses: 0, theory: 0, practical: 0, present: 0, absent: 0 });
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await attendanceAPI.create(formData);
            setShowForm(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                subject: '',
                type: 'theory',
                status: 'present'
            });
            loadData(); // Reload to update stats and list
        } catch (error) {
            console.error('Error creating attendance record:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await attendanceAPI.delete(id);
            loadData();
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    };

    const getAttendancePercentage = () => {
        if (stats.totalClasses === 0) return 0;
        return ((stats.present / stats.totalClasses) * 100).toFixed(1);
    };

    return (
        <div className="reminders-page"> {/* Reusing layout class */}
            <div className="page-header">
                <h1 className="text-gradient">Attendance Tracker</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={20} />
                    Log Class
                </button>
            </div>

            <GravityContainer className="summary-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                <Card className="summary-card">
                    <div className="summary-content">
                        <h4>Attendance Rate</h4>
                        <h2 style={{ color: Number(getAttendancePercentage()) >= 75 ? '#10b981' : '#ef4444' }}>
                            {getAttendancePercentage()}%
                        </h2>
                    </div>
                </Card>
                <Card className="summary-card">
                    <div className="summary-content">
                        <h4>Total Classes</h4>
                        <h2>{stats.totalClasses}</h2>
                    </div>
                </Card>
                <Card className="summary-card">
                    <div className="summary-content">
                        <h4>Breakdown</h4>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            Theory: {stats.theory} | Practical: {stats.practical}
                        </p>
                    </div>
                </Card>
            </GravityContainer>

            {showForm && (
                <Card className="reminder-form">
                    <h3>Log Class Attendance</h3>
                    <form onSubmit={handleSubmit}>
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
                            <label>Subject</label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="e.g. Mathematics, Physics Lab"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="theory">Theory Class</option>
                                <option value="practical">Practical / Lab</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Save Record
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            <GravityContainer className="reminders-grid">
                {attendanceList.map((record) => (
                    <Card key={record._id} className="reminder-card" style={{ borderLeft: record.status === 'present' ? '4px solid #10b981' : '4px solid #ef4444' }}>
                        <div className="reminder-header">
                            <div className="reminder-icon">
                                <BookOpen size={24} style={{ color: record.type === 'theory' ? '#8b5cf6' : '#f59e0b' }} />
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => handleDelete(record._id)}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3>{record.subject}</h3>
                        <div className="reminder-meta">
                            <div className="meta-item">
                                <Calendar size={16} />
                                <span>{new Date(record.date).toLocaleDateString()}</span>
                            </div>
                            <span className="reminder-type" style={{ textTransform: 'capitalize' }}>{record.type}</span>
                        </div>
                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', color: record.status === 'present' ? '#10b981' : '#ef4444' }}>
                            {record.status === 'present' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{record.status}</span>
                        </div>
                    </Card>
                ))}
            </GravityContainer>

            {attendanceList.length === 0 && !showForm && (
                <div className="empty-state">
                    <BookOpen size={64} className="text-gradient" />
                    <h3>No attendance records</h3>
                    <p>Start logging your classes to track attendance</p>
                </div>
            )}
        </div>
    );
}
