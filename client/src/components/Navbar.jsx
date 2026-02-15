import { Link, useLocation } from 'react-router-dom';
import { Home, Bell, Calendar, BookOpen, FileText, DollarSign, Menu, X, CheckSquare } from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/attendance', icon: CheckSquare, label: 'Attendance' },
        { path: '/routines', icon: Calendar, label: 'Routines' },
        { path: '/study', icon: BookOpen, label: 'Study' },
        { path: '/documents', icon: FileText, label: 'Documents' },
        { path: '/expenses', icon: DollarSign, label: 'Expenses' }
    ];

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h1 className="text-gradient-crimson">RoutineMaster</h1>
                </div>

                <div className="navbar-links desktop-nav">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`nav-link ${location.pathname === path ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>

                <div className="navbar-actions desktop-only">
                    {/* Global Bell Icon (Desktop Only) */}
                    <Link to="/reminders" className={`nav-link ${location.pathname === '/reminders' ? 'active' : ''}`} style={{ padding: '8px' }}>
                        <Bell size={20} />
                    </Link>

                    {/* Dedication Link */}
                    <Link to="/dedication" className="dedication-link">
                        <span className="sr-only">For Enakshi</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
