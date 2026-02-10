import { useEffect, useState } from 'react';
import { Plus, Trash2, Bell, Clock, Calendar } from 'lucide-react';
import GravityContainer from '../components/GravityContainer';
import Card from '../components/Card';
import { reminderAPI } from '../utils/api';
import './Reminders.css';

export default function Reminders() {
    const [reminders, setReminders] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'general',
        time: '',
        daysOfWeek: [],
        isActive: true
    });

    useEffect(() => {
        loadReminders();
    }, []);

    const loadReminders = async () => {
        try {
            const response = await reminderAPI.getAll();
            const data = response.data.data || response.data;
            setReminders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading reminders:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await reminderAPI.create(formData);
            setShowForm(false);
            setFormData({
                title: '',
                description: '',
                type: 'general',
                time: '',
                daysOfWeek: [],
                isActive: true
            });
            // Update local state without refetching
            setReminders(prev => [...prev, response.data]);
        } catch (error) {
            console.error('Error creating reminder:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this reminder?')) return;
        try {
            await reminderAPI.delete(id);
            // Update local state without refetching
            setReminders(prev => prev.filter(r => r._id !== id));
        } catch (error) {
            console.error('Error deleting reminder:', error);
        }
    };

    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day]
        }));
    };

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="reminders-page">
            <div className="page-header">
                <h1 className="text-gradient">Reminders</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={20} />
                    Add Reminder
                </button>
            </div>

            {showForm && (
                <Card className="reminder-form">
                    <h3>New Reminder</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="general">General</option>
                                <option value="medication">Medication</option>
                                <option value="meal">Meal-related</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Date (Optional)</label>
                            <input
                                type="date"
                                value={formData.date || ''}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Time</label>
                            <div className="time-input-wrapper">
                                <Clock size={18} className="time-icon" />
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>


                        <div className="form-group">
                            <label>Days of Week (Repeats)</label>
                            <div className="days-selector">
                                {days.map((day, index) => (
                                    <button
                                        key={day}
                                        type="button"
                                        className={`day-btn ${formData.daysOfWeek.includes(index) ? 'active' : ''}`}
                                        onClick={() => toggleDay(index)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Create Reminder
                            </button>
                        </div>
                    </form>
                </Card>
            )
            }

            <GravityContainer className="reminders-grid">
                {reminders.map((reminder) => (
                    <Card key={reminder._id} className="reminder-card">
                        <div className="reminder-header">
                            <div className="reminder-icon">
                                <Bell size={24} style={{ color: reminder.type === 'medication' ? '#10b981' : '#00d4ff' }} />
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => handleDelete(reminder._id)}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3>{reminder.title}</h3>
                        {reminder.description && <p>{reminder.description}</p>}
                        <div className="reminder-meta">
                            <div className="meta-item">
                                <Clock size={16} />
                                <span>{reminder.time}</span>
                            </div>
                            {reminder.date && (
                                <div className="meta-item">
                                    <Calendar size={16} />
                                    <span>{new Date(reminder.date).toLocaleDateString()}</span>
                                </div>
                            )}
                            <span className="reminder-type">{reminder.type}</span>
                        </div>
                        {reminder.daysOfWeek.length > 0 && (
                            <div className="reminder-days">
                                {reminder.daysOfWeek.map(day => (
                                    <span key={day} className="day-badge">{days[day]}</span>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}
            </GravityContainer>

            {
                reminders.length === 0 && !showForm && (
                    <div className="empty-state">
                        <Bell size={64} className="text-gradient" />
                        <h3>No reminders yet</h3>
                        <p>Create your first reminder to get started</p>
                    </div>
                )
            }
        </div >
    );
}
