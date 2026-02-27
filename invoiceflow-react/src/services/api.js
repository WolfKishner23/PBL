import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
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

// Redirect to /login on 401 responses
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('invoiceflow_token');
            localStorage.removeItem('invoiceflow_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
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

export default API;
