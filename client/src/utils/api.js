import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 second timeout for Render free tier cold starts
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // If timeout or network error, provide clearer message
        if (error.code === 'ECONNABORTED') {
            error.message = 'Request timed out. Please check your connection.';
        }
        return Promise.reject(error);
    }
);

// Reminders
export const reminderAPI = {
    getAll: (page = 1, limit = 1000, filters = {}) => {
        let query = `/reminders?page=${page}&limit=${limit}`;
        if (filters.isActive !== undefined) query += `&isActive=${filters.isActive}`;
        return api.get(query);
    },
    create: (data) => api.post('/reminders', data),
    update: (id, data) => api.patch(`/reminders/${id}`, data),
    delete: (id) => api.delete(`/reminders/${id}`)
};

// Routines
export const routineAPI = {
    getAll: (page = 1, limit = 1000) => api.get(`/routines?page=${page}&limit=${limit}`),
    create: (data) => api.post('/routines', data),
    update: (id, data) => api.patch(`/routines/${id}`, data),
    delete: (id) => api.delete(`/routines/${id}`)
};

// Study Items
export const studyAPI = {
    getAll: () => api.get('/study'),
    getChildren: (id) => api.get(`/study/${id}/children`),
    create: (data) => api.post('/study', data),
    update: (id, data) => api.patch(`/study/${id}`, data),
    batchUpdate: (updates) => api.patch('/study/batch', { updates }),
    delete: (id) => api.delete(`/study/${id}`)
};

// Expenses
export const expenseAPI = {
    getAll: (page = 1, limit = 20) => api.get(`/expenses?page=${page}&limit=${limit}`),
    getDashboardStats: () => api.get('/expenses/dashboard-stats'),
    getSummary: (year, month) => api.get(`/expenses/summary/${year}/${month}`),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.patch(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`)
};

// Documents
export const documentAPI = {
    getAll: (page = 1, limit = 20) => api.get(`/documents?page=${page}&limit=${limit}`),
    upload: (formData) => api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.patch(`/documents/${id}`, data),
    delete: (id) => api.delete(`/documents/${id}`)
};

// Attendance
export const attendanceAPI = {
    getAll: (page = 1, limit = 20) => api.get(`/attendance?page=${page}&limit=${limit}`),
    create: (data) => api.post('/attendance', data),
    delete: (id) => api.delete(`/attendance/${id}`)
};

export default api;
