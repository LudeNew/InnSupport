
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export const login = (username, password) => api.post('/token/', { username, password });
export const getProjects = () => api.get('/projects/');
export const getProject = (id) => api.get(`/projects/${id}/`);
export const createProject = (data) => api.post('/projects/', data);
export const getTickets = () => api.get('/tickets/');
export const getTicket = (id) => api.get(`/tickets/${id}/`);
export const createTicket = (data) => api.post('/tickets/', data);
export const updateTicket = (id, data) => api.patch(`/tickets/${id}/`, data);
export const getDashboardStats = () => api.get('/dashboard/');
export const getUsers = () => api.get('/users/');
export const getCurrentUser = () => api.get('/users/me/');

export const startTimer = (id, data) => api.post(`/tickets/${id}/start_timer/`, data);
export const stopTimer = (id) => api.post(`/tickets/${id}/stop_timer/`);

export const createComment = (data) => api.post('/comments/', data);
export const createNote = (data) => api.post('/notes/', data);
export const getWorkTypes = () => api.get('/worktypes/');
export const createWorkLog = (data) => api.post('/worklogs/', data);
export const getWorkLogs = () => api.get('/worklogs/');

// --- НОВЫЕ МЕТОДЫ ДЛЯ ВЛОЖЕНИЙ И УВЕДОМЛЕНИЙ ---
export const getNotifications = () => api.get('/notifications/');
export const markAllNotificationsRead = () => api.post('/notifications/mark_all_read/');
export const uploadTicketAttachment = (formData) => api.post('/attachments/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// --- НОВЫЕ МЕТОДЫ ДЛЯ МОДЕРИНИЗИРОВАННОГО ДАШБОРДА ---
export const getCompanyEvents = () => api.get('/events/');
export const createCompanyEvent = (data) => api.post('/events/', data);
export const getEventLabels = () => api.get('/event-labels/');

// --- МЕТОДЫ ДЛЯ СИСТЕМЫ ПРОФИЛЯ ---
export const getSkills = () => api.get('/skills/');
export const updateProfile = (formData) => api.patch('/users/me/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// --- МЕТОДЫ ДЛЯ РАБОТЫ С ЭТАПАМИ ---
export const getStages = (projectId) => api.get(`/stages/${projectId ? `?project=${projectId}` : ''}`);
export const getStage = (id) => api.get(`/stages/${id}/`);
export const createStage = (data) => api.post('/stages/', data);

export const updateStage = (id, data) => api.patch(`/stages/${id}/`, data);

export default api;