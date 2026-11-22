import api from './api';

export interface AdminRegisterData {
  name: string;
  email: string;
  username?: string;
  phone?: string;
  password: string;
}

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/admin/auth/login', { email, password });
    return res.data;
  },
  register: async (data: AdminRegisterData) => {
    const res = await api.post('/admin/auth/register', data);
    return res.data;
  },
  logout: async () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },
};

export const eventService = {
  getAll: () => api.get('/admin/events').then(r => r.data),
  getById: (id: number) => api.get(`/admin/events/${id}`).then(r => r.data),
  create: (data: FormData) => api.post('/admin/events', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update: (id: number, data: FormData) => api.put(`/admin/events/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  setStatus: (id: number, status: 'open' | 'closed') => api.patch(`/admin/events/${id}/status`, { status }).then(r => r.data),
  delete: (id: number) => api.delete(`/admin/events/${id}`).then(r => r.data),
};

export const artistService = {
  getAll: () => api.get('/admin/artists').then(r => r.data),
  getById: (id: number) => api.get(`/admin/artists/${id}`).then(r => r.data),
  create: (data: FormData) => api.post('/admin/artists', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update: (id: number, data: FormData) => api.put(`/admin/artists/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  delete: (id: number) => api.delete(`/admin/artists/${id}`).then(r => r.data),
};

export const ticketCategoryService = {
  getByEvent: (eventId: number) => api.get(`/admin/events/${eventId}/categories`).then(r => r.data),
  create: (eventId: number, data: object) => api.post(`/admin/events/${eventId}/categories`, data).then(r => r.data),
  update: (id: number, data: object) => api.put(`/admin/categories/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/admin/categories/${id}`).then(r => r.data),
};

export const orderService = {
  getAll: () => api.get('/admin/orders').then(r => r.data),
  getById: (id: number) => api.get(`/admin/orders/${id}`).then(r => r.data),
};

export const paymentService = {
  getAll: () => api.get('/admin/payments').then(r => r.data),
  verify: (id: number) => api.patch(`/admin/payments/${id}/verify`).then(r => r.data),
  reject: (id: number) => api.patch(`/admin/payments/${id}/reject`).then(r => r.data),
};

export const dashboardService = {
  getSummary: () => api.get('/admin/dashboard').then(r => r.data),
};
