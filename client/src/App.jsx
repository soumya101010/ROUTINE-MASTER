import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Reminders from './pages/Reminders';
import Routines from './pages/Routines';
import Study from './pages/Study';
import Documents from './pages/Documents';
import Expenses from './pages/Expenses';
import Dedication from './pages/Dedication';
import './App.css';

import { useEffect } from 'react';
import api from './utils/api';

import NotificationManager from './components/NotificationManager';

function App() {
  useEffect(() => {
    // Ping the server to wake it up if it's sleeping (Render free tier)
    const wakeUpServer = async () => {
      try {
        await api.get('/health');
        console.log('Server is awake');
      } catch (error) {
        console.log('Waking up server...', error);
      }
    };
    wakeUpServer();
  }, []);
  return (
    <Router>
      <div className="app">
        <NotificationManager />
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/routines" element={<Routines />} />
            <Route path="/study" element={<Study />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/dedication" element={<Dedication />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
