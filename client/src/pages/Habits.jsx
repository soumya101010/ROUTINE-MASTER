import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Plus, Trash2, Check } from 'lucide-react';
import Card from '../components/Card';
import { habitAPI } from '../utils/api';
import './Habits.css';

export default function Habits() {
    const navigate = useNavigate();
    const [habits, setHabits] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHabits();
    }, []);

    const loadHabits = async () => {
        try {
            const res = await habitAPI.getAll();
            setHabits(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createHabit = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        try {
            await habitAPI.create({ title: newTitle.trim() });
            setNewTitle('');
            setShowForm(false);
            loadHabits();
        } catch (err) {
            console.error(err);
            alert('Failed to add habit. Please try again.');
        }
    };

    const completeHabit = async (id) => {
        try {
            await habitAPI.complete(id);
            loadHabits();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteHabit = async (id) => {
        try {
            await habitAPI.delete(id);
            loadHabits();
        } catch (err) {
            console.error(err);
        }
    };

    const isCompletedToday = (habit) => {
        if (!habit.lastCompletedDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const last = new Date(habit.lastCompletedDate);
        last.setHours(0, 0, 0, 0);
        return last.getTime() === today.getTime();
    };

    return (
        <div className="habits-page">
            <button className="back-btn" onClick={() => navigate('/')}>
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            <h1 className="module-title text-gradient">Habit Streaks</h1>

            <button className="add-button" onClick={() => setShowForm(!showForm)}>
                <Plus size={18} />
                {showForm ? 'Cancel' : 'Add Habit'}
            </button>

            {showForm && (
                <Card className="habit-form-card">
                    <form onSubmit={createHabit}>
                        <input
                            type="text"
                            placeholder="e.g. Wake up on time"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="habit-input"
                            autoFocus
                        />
                        <button type="submit" className="submit-btn">Create Habit</button>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="loading-state">Loading habits...</div>
            ) : habits.length === 0 ? (
                <div className="empty-state">
                    <Flame size={48} />
                    <p>No habits yet. Start building your streaks!</p>
                </div>
            ) : (
                <div className="habits-list">
                    {habits.map(habit => {
                        const done = isCompletedToday(habit);
                        return (
                            <Card key={habit._id} className={`habit-card ${done ? 'completed' : ''}`}>
                                <div className="habit-main">
                                    <button
                                        className={`check-btn ${done ? 'checked' : ''}`}
                                        onClick={() => !done && completeHabit(habit._id)}
                                        disabled={done}
                                    >
                                        <Check size={18} />
                                    </button>
                                    <div className="habit-info">
                                        <h3 className={done ? 'done-text' : ''}>{habit.title}</h3>
                                        <div className="streak-row">
                                            <Flame size={14} className="flame-icon" />
                                            <span className="streak-num">{habit.currentStreak}</span>
                                            <span className="streak-label">day streak</span>
                                            <span className="streak-divider">·</span>
                                            <span className="streak-best">Best: {habit.longestStreak}</span>
                                        </div>
                                    </div>
                                    <button className="habit-delete" onClick={() => deleteHabit(habit._id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Visual streak dots — last 7 days */}
                                <div className="streak-dots">
                                    {Array.from({ length: 7 }).map((_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (6 - i));
                                        d.setHours(0, 0, 0, 0);
                                        const wasCompleted = habit.completedDates?.some(cd => {
                                            const cDate = new Date(cd);
                                            cDate.setHours(0, 0, 0, 0);
                                            return cDate.getTime() === d.getTime();
                                        });
                                        const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
                                        return (
                                            <div key={i} className="dot-col">
                                                <div className={`streak-dot ${wasCompleted ? 'filled' : ''}`} />
                                                <span className="dot-day">{dayLabel}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
