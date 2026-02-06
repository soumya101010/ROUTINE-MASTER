# RoutineMaster

A premium dark-mode web application for managing your daily life with style.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🔔 **Medication & Timed Reminders** - Never miss your vitamins or important tasks
- 📅 **Daily Routine Builder** - Create templates for different shift types
- 📚 **Hierarchical Study Tracker** - Organize studies by Subject → Chapter → Topic
- 📄 **Secure Document Storage** - Upload and categorize important files
- 💰 **Expense Tracker** - Track spending with beautiful charts

## 🎨 Design Highlights

- **Dark Mode First** - Premium midnight blue theme
- **Glassmorphism** - Frosted glass effects throughout
- **GSAP Animations** - Physics-based "gravity" effects on page load
- **Responsive** - Beautiful on desktop and mobile
- **Modern Stack** - React, Node.js, MongoDB

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or connection string)

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd "d:\NEW PROJECT"
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if not already running)
   ```bash
   mongod
   ```

2. **Start Backend Server** (in `server` directory)
   ```bash
   npm start
   ```
   Server will run on `http://localhost:5000`

3. **Start Frontend** (in `client` directory, new terminal)
   ```bash
   npm run dev
   ```
   App will open at `http://localhost:5173`

## 📁 Project Structure

```
├── server/                 # Backend (Node.js + Express)
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── uploads/           # File storage
│   └── server.js          # Entry point
│
└── client/                # Frontend (React + Vite)
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page components
    │   ├── utils/         # API utilities
    │   └── index.css      # Design system
    └── package.json
```

## 🎯 Current Status

### ✅ Completed
- Dashboard with animated cards
- Reminders module (fully functional)
- Expense tracker with charts (fully functional)
- Backend API for all modules
- Responsive design
- GSAP animations

### 🚧 In Progress
- Routines builder (placeholder)
- Study tracker (placeholder)
- Document storage (placeholder)

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- React Router
- GSAP (animations)
- Recharts (data visualization)
- Lucide React (icons)
- Axios

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Multer (file uploads)
- CORS

## 📖 API Documentation

### Reminders
- `GET /api/reminders` - Get all reminders
- `POST /api/reminders` - Create reminder
- `PATCH /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/summary/:year/:month` - Monthly summary
- `POST /api/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense

*(See full API docs in `/server/routes`)*

## 🎨 Design System

### Colors
- **Primary**: `#00d4ff` (Cyan)
- **Secondary**: `#7c3aed` (Purple)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Danger**: `#ef4444` (Red)

### Components
- Glassmorphic cards
- Animated buttons with ripple effects
- Responsive navigation
- Custom scrollbars

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📝 License

MIT License - feel free to use this project as you wish.

## 🙏 Acknowledgments

- Design inspiration from modern habit trackers
- GSAP for amazing animations
- The React and Node.js communities

---

**Built with ❤️ using React, Node.js, and MongoDB**
