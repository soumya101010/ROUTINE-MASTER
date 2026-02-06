import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json'
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
    getAll: () => api.get('/reminders'),
    create: (data) => api.post('/reminders', data),
    update: (id, data) => api.patch(`/reminders/${id}`, data),
    delete: (id) => api.delete(`/reminders/${id}`)
};

// Routines
export const routineAPI = {
    getAll: () => api.get('/routines'),
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
    getAll: () => api.get('/expenses'),
    getSummary: (year, month) => api.get(`/expenses/summary/${year}/${month}`),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.patch(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`)
};

// Documents
export const documentAPI = {
    getAll: () => api.get('/documents'),
    upload: (formData) => api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.patch(`/documents/${id}`, data),
    delete: (id) => api.delete(`/documents/${id}`)
};

export default api;
