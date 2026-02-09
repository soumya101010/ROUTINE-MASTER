import { useEffect, useState } from 'react';
import { reminderAPI } from '../utils/api';
import { Bell } from 'lucide-react';
import './NotificationManager.css';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function NotificationManager() {
    const [permission, setPermission] = useState('default');
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const [lastCheckedMinute, setLastCheckedMinute] = useState(null);
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        // Check initial permission
        checkPermission();
    }, []);

    const checkPermission = async () => {
        if (isNative) {
            const status = await LocalNotifications.checkPermissions();
            setPermission(status.display);
            if (status.display !== 'granted') {
                setShowPermissionBanner(true);
            }
        } else if ('Notification' in window) {
            setPermission(Notification.permission);
            if (Notification.permission === 'default') {
                setShowPermissionBanner(true);
            }
        }
    };

    useEffect(() => {
        // Check for reminders every 10 seconds
        const intervalId = setInterval(() => {
            checkReminders();
        }, 10000);

        return () => clearInterval(intervalId);
    }, [permission, lastCheckedMinute]);

    const requestPermission = async () => {
        if (isNative) {
            try {
                const result = await LocalNotifications.requestPermissions();
                setPermission(result.display);
                if (result.display === 'granted') {
                    setShowPermissionBanner(false);
                    scheduleNotification({
                        title: 'Notifications Enabled',
                        body: 'You will now receive reminders!',
                        id: 99999
                    });
                }
            } catch (error) {
                console.error('Error requesting native permission:', error);
            }
        } else {
            if (!('Notification' in window)) {
                alert('This browser does not support desktop notification');
                return;
            }

            try {
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result === 'granted') {
                    setShowPermissionBanner(false);
                    new Notification('Notifications Enabled', {
                        body: 'You will now receive reminders!',
                        icon: '/icon-192.png'
                    });
                }
            } catch (error) {
                console.error('Error requesting permission:', error);
            }
        }
    };

    const checkReminders = async () => {
        if (permission !== 'granted') return;

        const now = new Date();
        const currentMinute = now.getMinutes();
        const currentHour = now.getHours();
        const currentDay = now.getDay();

        if (lastCheckedMinute === currentMinute) return;

        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        console.log(`Checking reminders for ${timeString}`);
        setLastCheckedMinute(currentMinute);

        try {
            const { data: reminders } = await reminderAPI.getAll();

            reminders.forEach(reminder => {
                const matchesDay = reminder.daysOfWeek.length === 0 || reminder.daysOfWeek.includes(currentDay);

                if (reminder.isActive !== false && reminder.time === timeString && matchesDay) {
                    scheduleNotification({
                        title: reminder.title,
                        body: reminder.description || 'Time for your reminder!',
                        id: dateToId(reminder._id) // simple hash or just use timestamp if needed, but ID is string
                    });
                }
            });

        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    };

    const dateToId = (str) => {
        // Simple hash to get an integer ID for LocalNotifications
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    };

    const scheduleNotification = async (reminder) => {
        if (isNative) {
            try {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: reminder.title,
                            body: reminder.body,
                            id: reminder.id,
                            schedule: { at: new Date(Date.now() + 1000) }, // Show roughly immediately
                            sound: 'beep.wav',
                            attachments: null,
                            actionTypeId: "",
                            extra: null
                        }
                    ]
                });
            } catch (e) {
                console.error("Native notification failed", e);
            }
        } else {
            // Web fallback
            if (Notification.permission === 'granted') {
                try {
                    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                        navigator.serviceWorker.ready.then(registration => {
                            registration.showNotification(reminder.title, {
                                body: reminder.body,
                                icon: '/icon-192.png',
                                vibrate: [200, 100, 200],
                                tag: `reminder-${reminder.id}`
                            });
                        });
                    } else {
                        new Notification(reminder.title, {
                            body: reminder.body,
                            icon: '/icon-192.png',
                            tag: `reminder-${reminder.id}`
                        });
                    }
                } catch (e) {
                    console.error("Notification trigger failed", e);
                }
            }
        }
    };

    if (!showPermissionBanner) return null;

    return (
        <div className="notification-banner">
            <div className="notification-content">
                <Bell size={20} />
                <span>Enable notifications to get reminders on time</span>
            </div>
            <button className="btn-enable" onClick={requestPermission}>
                Enable
            </button>
            <button className="btn-close" onClick={() => setShowPermissionBanner(false)}>
                ×
            </button>
        </div>
    );
}
