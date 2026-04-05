import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = BASE.endsWith('/api') ? BASE : `${BASE}/api`;

const API = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('invoiceflow_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Redirect to /login on 401 responses (skip for admin pages which use localStorage auth)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const path = window.location.pathname;
            const isAdminPage = path.startsWith('/admin');
            if (!isAdminPage) {
                localStorage.removeItem('invoiceflow_token');
                localStorage.removeItem('invoiceflow_user');
                if (path !== '/login') {
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
    resetPassword: (email, otp, newPassword) => API.post('/auth/reset-password', { email, otp, newPassword }),
    updateProfile: (data) => API.put('/auth/profile', data),
};

// ─── User API ─────────────────────────────────────────────────────────────────
export const userAPI = {
    getCompanies: () => API.get('/users/companies'),
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
    // ─── Circular Economy ────────────────────────────────────────────────
    confirm: (id) => API.put(`/invoices/${id}/confirm`),
    dispute: (id, reason) => API.put(`/invoices/${id}/dispute`, { reason }),
    fund: (id) => API.put(`/invoices/${id}/fund`),
    markPaid: (id) => API.put(`/invoices/${id}/mark-paid`),
    settle: (id) => API.put(`/invoices/${id}/settle`),
};

// ─── Factoring API ────────────────────────────────────────────────────────────
export const factoringAPI = {
    review: (id) => API.put(`/factoring/${id}/review`),
    approve: (id) => API.put(`/factoring/${id}/approve`),
    reject: (id, reason) => API.put(`/factoring/${id}/reject`, { rejectionReason: reason }),
    fund: (id, data) => API.post(`/factoring/${id}/fund`, data),
    getTransactions: (params) => API.get('/factoring/transactions', { params }),
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminAPI = {
    getStats: () => API.get('/admin/stats'),
    getUsers: (params) => API.get('/admin/users', { params }),
    verifyUser: (id) => API.put(`/admin/users/${id}/verify`),
    suspendUser: (id) => API.put(`/admin/users/${id}/suspend`),
    deleteUser: (id) => API.delete(`/admin/users/${id}`),
};

// ─── AI API ───────────────────────────────────────────────────────────────────
export const aiAPI = {
    extract: (formData) => API.post('/ai/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// ─── Feedback API ─────────────────────────────────────────────────────────────
export const feedbackAPI = {
    submit: (data) => axios.post(`${API_BASE}/feedback`, data),       // public — no auth
    getAll: (params) => API.get('/feedback', { params }),               // admin only
    markRead: (id) => API.put(`/feedback/${id}/read`),                 // admin only
    delete: (id) => API.delete(`/feedback/${id}`),                     // admin only
};

export default API;
