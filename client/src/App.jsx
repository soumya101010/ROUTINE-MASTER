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

function App() {
  return (
    <Router>
      <div className="app">
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
