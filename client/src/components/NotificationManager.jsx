import { useEffect, useState } from 'react';
import { reminderAPI } from '../utils/api';
import { Bell } from 'lucide-react';
import './NotificationManager.css';

export default function NotificationManager() {
    const [permission, setPermission] = useState('default');
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const [lastCheckedMinute, setLastCheckedMinute] = useState(null);

    useEffect(() => {
        // Check initial permission
        if ('Notification' in window) {
            setPermission(Notification.permission);
            if (Notification.permission === 'default') {
                setShowPermissionBanner(true);
            }
        }
    }, []);

    useEffect(() => {
        // Check for reminders every 10 seconds
        const intervalId = setInterval(() => {
            checkReminders();
        }, 10000);

        return () => clearInterval(intervalId);
    }, [permission, lastCheckedMinute]); // Re-run if these change

    const requestPermission = async () => {
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
    };

    const checkReminders = async () => {
        if (permission !== 'granted') return;

        const now = new Date();
        const currentMinute = now.getMinutes();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday

        // avoid double checking in the same minute
        if (lastCheckedMinute === currentMinute) return;

        // Format current time as HH:MM
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        console.log(`Checking reminders for ${timeString} on day ${currentDay}`);
        setLastCheckedMinute(currentMinute);

        try {
            const { data: reminders } = await reminderAPI.getAll();

            reminders.forEach(reminder => {
                // Check if active, matches time, and matches day (if days specified)
                // If daysOfWeek is empty, assume it triggers every day (or maybe handling logic needs to be verified? 
                // In Reminders.jsx: formData.daysOfWeek is array. Empty array usually means no repeat or one-off? 
                // Let's assume empty array = one-off or everyday? 
                // Looking at user UI, they select days.
                // If the user selects specific days, we check. If they select NOTHING, maybe it shouldn't fire?
                // Or maybe it fires once? But we don't track "fired" state for one-offs yet.
                // For now, let's assume empty daysOfWeek means "Daily" or handle explicit matches.
                // The Reminders.jsx logic shows "days" badges only if length > 0.

                const matchesDay = reminder.daysOfWeek.length === 0 || reminder.daysOfWeek.includes(currentDay);

                if (reminder.isActive !== false && reminder.time === timeString && matchesDay) {
                    showNotification(reminder);
                }
            });

        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    };

    const showNotification = (reminder) => {
        // Double check permission (redundant but safe)
        if (Notification.permission === 'granted') {
            try {
                // Use service worker registration if available for better mobile support
                if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(reminder.title, {
                            body: reminder.description || 'Time for your reminder!',
                            icon: '/icon-192.png',
                            vibrate: [200, 100, 200],
                            tag: `reminder-${reminder._id}` // Prevent duplicate notifications
                        });
                    });
                } else {
                    // Fallback to standard API
                    new Notification(reminder.title, {
                        body: reminder.description || 'Time for your reminder!',
                        icon: '/icon-192.png',
                        tag: `reminder-${reminder._id}`
                    });
                }
            } catch (e) {
                console.error("Notification trigger failed", e);
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
