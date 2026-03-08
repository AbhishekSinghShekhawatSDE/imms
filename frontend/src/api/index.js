import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
    timeout: 5000,
});

// Auth interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('imms_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const machinesApi = {
    list: () => api.get('/machines'),
    get: (id) => api.get(`/machines/${id}`),
    updateStatus: (id, status) => api.patch(`/machines/${id}`, { status }),
    getReadings: (id, params) => api.get(`/machines/${id}/readings`, { params }),
};

export const alertsApi = {
    list: (params) => api.get('/alerts', { params }),
    acknowledge: (id, engineer) => api.patch(`/alerts/${id}/acknowledge`, { acknowledged_by: engineer }),
};

export const dashboardApi = {
    summary: () => api.get('/dashboard/summary'),
};

export const authApi = {
    login: (email, password) => api.post('/auth/login', { email, password }),
};

export default api;
