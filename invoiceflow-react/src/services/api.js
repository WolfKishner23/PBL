import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = BASE.endsWith('/api') ? BASE : `${BASE}/api`;

const API = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
});

// AI Service Direct URL (Optional: used if frontend needs to call AI directly)
const AI_BASE_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
const AI_API = axios.create({
    baseURL: AI_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request; also attach admin secret if admin session is active
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('invoiceflow_token') || localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    const adminName = localStorage.getItem('invoiceflow_admin');
    if (adminName) {
        config.headers['x-admin-secret'] = import.meta.env.VITE_ADMIN_SECRET || 'invoiceflow-admin-secret-2024';
    }
    return config;
});

// Redirect to /login on 401 responses (skip if admin session is active)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const isAdminSession = !!localStorage.getItem('invoiceflow_admin');
            if (!isAdminSession) {
                localStorage.removeItem('invoiceflow_token');
                localStorage.removeItem('invoiceflow_user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
    register: (data) => API.post('/auth/register', data),
    login: (data) => API.post('/auth/login', data),
    getMe: () => API.get('/auth/me'),
    forgot: (email) => API.post('/auth/forgot', { email }),
    updateProfile: (data) => API.put('/auth/profile', data),
};

// ─── Invoice API ──────────────────────────────────────────────────────────────
export const invoiceAPI = {
    getAll: (params) => API.get('/invoices', { params }),
    getOne: (id) => API.get(`/invoices/${id}`),
    create: (data) => API.post('/invoices', data),
    update: (id, data) => API.put(`/invoices/${id}`, data),
    delete: (id) => API.delete(`/invoices/${id}`),
    submit: (id) => API.post(`/invoices/${id}/submit`),
    uploadPDF: (id, formData) => API.post(`/invoices/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    confirm: (id) => API.post(`/invoices/${id}/confirm`),
    getRiskAssessment: (data) => API.post('/invoices/risk-assessment', data),
};

// ─── Factoring API ────────────────────────────────────────────────────────────
export const factoringAPI = {
    review: (id) => API.put(`/factoring/${id}/review`),
    approve: (id) => API.put(`/factoring/${id}/approve`),
    reject: (id, reason) => API.put(`/factoring/${id}/reject`, { rejectionReason: reason }),
    fund: (id, data) => API.post(`/factoring/${id}/fund`, data),
    getTransactions: (params) => API.get('/factoring/transactions', { params }),
    pay: (id) => API.post(`/factoring/${id}/pay`),
    settle: (id) => API.post(`/factoring/${id}/settle`),
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminAPI = {
    getStats: () => API.get('/admin/stats'),
    getUsers: (params) => API.get('/admin/users', { params }),
    getInvoices: (params) => API.get('/admin/invoices', { params }),
    verifyUser: (id) => API.put(`/admin/users/${id}/verify`),
    suspendUser: (id) => API.put(`/admin/users/${id}/suspend`),
    deleteUser: (id) => API.delete(`/admin/users/${id}`),
    getFeedbacks: () => API.get('/feedback'),
    markFeedbackRead: (id) => API.put(`/feedback/${id}/read`),
    deleteFeedback: (id) => API.delete(`/feedback/${id}`),
};

// ─── AI API ───────────────────────────────────────────────────────────────────
export const aiAPI = {
    extract: (formData) => API.post('/ai/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// ─── Notification API ──────────────────────────────────────────────────────────
export const notificationAPI = {
    getAll: () => API.get('/notifications'),
    markAsRead: (id) => API.put(`/notifications/${id}/read`),
    clear: () => API.delete('/notifications/clear'),
};

// ─── Wallet API ───────────────────────────────────────────────────────────────
export const walletAPI = {
    getHistory: () => API.get('/wallet')
};

export default API;
