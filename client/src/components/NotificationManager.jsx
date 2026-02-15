import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { reminderAPI } from '../utils/api';
import { Bell, Info, RefreshCw, X } from 'lucide-react';
import './NotificationManager.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';

const createUniqueId = (idStr, suffix = '') => {
    const fullStr = `${idStr}-${suffix}`;
    let hash = 0;
    for (let i = 0; i < fullStr.length; i++) {
        const char = fullStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const formatTiming = (schedule) => {
    if (!schedule) return 'Unknown schedule';
    if (schedule.at) return new Date(schedule.at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (schedule.on) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const day = days[schedule.on.weekday - 1];
        const time = `${schedule.on.hour?.toString().padStart(2, '0')}:${schedule.on.minute?.toString().padStart(2, '0')}`;
        return `Every ${day} at ${time}`;
    }
    return 'One-off schedule';
};

export default function NotificationManager({ isServerAwake }) {
    const [permission, setPermission] = useState('default');
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
    const [pendingReminders, setPendingReminders] = useState([]);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const location = useLocation();
    const isNative = Capacitor.isNativePlatform();
    const isRemindersPage = location.pathname === '/reminders';

    const loadPendingAlarms = useCallback(async () => {
        if (!isNative) return;
        try {
            const { notifications } = await LocalNotifications.getPending();
            setPendingReminders(notifications || []);
        } catch (e) {
            console.error("Failed to load pending", e);
        }
    }, [isNative]);

    const syncScheduledNotifications = useCallback(async () => {
        if (!isNative || permission !== 'granted' || !isServerAwake) return;

        setSyncStatus('syncing');
        try {
            const response = await reminderAPI.getAll();
            const reminders = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            if (!Array.isArray(reminders)) throw new Error("Invalid format");

            const notificationsToSchedule = [];
            reminders.forEach(reminder => {
                if (reminder.isActive === false) return;
                const [h, m] = (reminder.time || '00:00').split(':').map(Number);

                if (reminder.date) {
                    const sDate = new Date(reminder.date);
                    sDate.setHours(h, m, 0, 0);
                    if (sDate > new Date()) {
                        notificationsToSchedule.push({
                            title: reminder.title,
                            body: reminder.description || 'Time for your reminder!',
                            id: createUniqueId(reminder._id, 'one-off'),
                            channelId: 'reminders',
                            schedule: { at: sDate, exact: true },
                            sound: null,
                            actionTypeId: 'OPEN_APP',
                            extra: { reminderId: reminder._id, type: 'dated' }
                        });
                    }
                } else {
                    const days = reminder.daysOfWeek?.length > 0 ? reminder.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
                    days.forEach(day => {
                        notificationsToSchedule.push({
                            title: reminder.title,
                            body: reminder.description || 'Reminder!',
                            id: createUniqueId(reminder._id, `day-${day}`),
                            channelId: 'reminders',
                            schedule: { on: { weekday: day + 1, hour: h, minute: m }, repeats: true, exact: true },
                            sound: null,
                            actionTypeId: 'OPEN_APP',
                            extra: { reminderId: reminder._id, day, type: 'repeating' }
                        });
                    });
                }
            });

            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel({ notifications: pending.notifications });
            }

            if (notificationsToSchedule.length > 0) {
                await LocalNotifications.schedule({ notifications: notificationsToSchedule });
                setSyncStatus('success');
            } else {
                setSyncStatus('idle');
            }
            loadPendingAlarms();
        } catch (error) {
            console.error('Sync failed', error);
            setSyncStatus('error');
        }
    }, [isNative, permission, isServerAwake, loadPendingAlarms]);

    // 1. Setup permissions and channels
    useEffect(() => {
        const init = async () => {
            if (isNative) {
                try {
                    const status = await LocalNotifications.checkPermissions();
                    setPermission(status.display);
                    if (status.display !== 'granted') setShowPermissionBanner(true);

                    await LocalNotifications.createChannel({
                        id: 'reminders',
                        name: 'Reminders',
                        importance: 5,
                        visibility: 1,
                        vibration: true
                    });
                } catch (e) {
                    console.error("Native init failed", e);
                }
                loadPendingAlarms();
            } else if ('Notification' in window) {
                setPermission(Notification.permission);
                if (Notification.permission === 'default') setShowPermissionBanner(true);
            }
        };
        init();
    }, [isNative, loadPendingAlarms]);

    // 2. Setup listeners (STABLE)
    useEffect(() => {
        if (!isNative) return;

        let appStateListener;
        const setup = async () => {
            try {
                if (App && typeof App.addListener === 'function') {
                    appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
                        if (isActive) syncScheduledNotifications();
                    });
                }
            } catch (e) { console.warn("App listener not available", e); }
        };
        setup();

        const handleSync = () => syncScheduledNotifications();
        window.addEventListener('sync-reminders', handleSync);

        return () => {
            if (appStateListener) appStateListener.remove();
            window.removeEventListener('sync-reminders', handleSync);
        };
    }, [isNative, syncScheduledNotifications]);

    // 3. Auto-sync trigger
    useEffect(() => {
        if (isServerAwake && permission === 'granted' && isNative) {
            syncScheduledNotifications();
        }
    }, [isServerAwake, permission, isNative, syncScheduledNotifications]);

    const requestPermission = async () => {
        if (isNative) {
            try {
                const result = await LocalNotifications.requestPermissions();
                setPermission(result.display);
                if (result.display === 'granted') {
                    setShowPermissionBanner(false);
                    syncScheduledNotifications();
                }
            } catch (e) { console.error("Permission request failed", e); }
        } else {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') setShowPermissionBanner(false);
        }
    };

    const scheduleTestNotification = async () => {
        if (!isNative) return;
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title: 'Test Notification',
                    body: 'Hardened system working!',
                    id: 88888,
                    schedule: { at: new Date(Date.now() + 10000), exact: true },
                    channelId: 'reminders'
                }]
            });
            alert("Scheduled for 10s. CLOSE APP NOW.");
            loadPendingAlarms();
        } catch (e) { alert("Test failed: " + e.message); }
    };

    if (!isNative) return null;

    return (
        <>
            {isRemindersPage && !showDiagnostics && !showPermissionBanner && permission === 'granted' && (
                <button className="floating-diag-trigger" onClick={() => { setShowDiagnostics(true); loadPendingAlarms(); }}>
                    <Bell size={24} />
                    {syncStatus === 'syncing' && <div className="diag-pulse" />}
                </button>
            )}

            {showPermissionBanner && (
                <div className={`notification-banner ${syncStatus}`}>
                    <div className="notification-content">
                        <Bell size={20} className={syncStatus === 'syncing' ? 'spin' : ''} />
                        <span>
                            {permission !== 'granted' ? "Enable notifications" :
                                syncStatus === 'syncing' ? "Syncing..." :
                                    syncStatus === 'error' ? "Sync failed" : "Reminders active"}
                        </span>
                    </div>
                    <div className="banner-actions">
                        {permission !== 'granted' ? (
                            <button className="btn-enable" onClick={requestPermission}>Enable</button>
                        ) : (
                            <button className="btn-icon" onClick={() => { setShowDiagnostics(true); loadPendingAlarms(); }}><Info size={18} /></button>
                        )}
                        <button className="btn-close" onClick={() => setShowPermissionBanner(false)}>×</button>
                    </div>
                </div>
            )}

            {showDiagnostics && (
                <div className="diagnostics-overlay" onClick={(e) => e.target === e.currentTarget && setShowDiagnostics(false)}>
                    <div className="diagnostics-modal">
                        <div className="diag-header">
                            <h3><Info size={20} /> System Alarms</h3>
                            <button className="close-diag" onClick={() => setShowDiagnostics(false)}><X size={20} /></button>
                        </div>
                        <div className="diag-content">
                            <div className="diag-stats">
                                <span>Pending: <strong>{pendingReminders.length}</strong></span>
                                <button className="refresh-diag" onClick={loadPendingAlarms}>
                                    <RefreshCw size={14} className={syncStatus === 'syncing' ? 'spin' : ''} /> Refresh
                                </button>
                            </div>
                            <div className="diag-list">
                                {pendingReminders.length === 0 ? (
                                    <p className="empty-diag">No alarms in system.</p>
                                ) : (
                                    pendingReminders.map(alarm => (
                                        <div key={alarm.id} className="diag-item">
                                            <div className="diag-title">{alarm.title}</div>
                                            <div className="diag-time">ID: {alarm.id} | {formatTiming(alarm.schedule)}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="diag-actions">
                                <button className="btn-test-wide" onClick={scheduleTestNotification}>Test Delivery (10s)</button>
                                <button className="btn-sync-wide" onClick={syncScheduledNotifications}>Force Sync</button>
                                <div className="battery-instructions">
                                    <h4>💡 Tip:</h4>
                                    <p>Disable "Battery Optimization" in Settings for this app.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
