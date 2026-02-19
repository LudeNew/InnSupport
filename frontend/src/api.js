
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export const login = (username, password) => api.post('/token/', { username, password });

export const getProjects = () => api.get('/projects/');
export const createProject = (data) => api.post('/projects/', data);
export const getTickets = (filters) => api.get('/tickets/', { params: filters });
export const getTicket = (id) => api.get(`/tickets/${id}/`);
export const createTicket = (data) => api.post('/tickets/', data);
export const updateTicket = (id, data) => api.patch(`/tickets/${id}/`, data);
export const getUsers = () => api.get('/users/');
export const getTags = () => api.get('/tags/');

export const getDashboardStats = () => api.get('/dashboard/');
export const getWorkLogs = () => api.get('/worklogs/');
export const logWork = (data) => api.post('/worklogs/', data);

export const startTimer = (ticketId) => api.post(`/tickets/${ticketId}/start_timer/`);
export const stopTimer = (ticketId) => api.post(`/tickets/${ticketId}/stop_timer/`);

export default api;
