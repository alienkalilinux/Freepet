import axios from 'axios';

// В проде Vercel проксирует /api и /uploads на бэкенд (см. next.config.js),
// поэтому здесь всегда относительный путь — build-переменные не нужны.
export const API_BASE = '/api';

export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return path;
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  city?: string;
  is_blocked: boolean;
  is_verified: boolean;
  is_admin: boolean;
  oauth_provider?: string;
  created_at: string;
}

export interface Pet {
  id: number;
  user_id: number;
  name: string;
  species: string;
  breed: string | null;
  character: string | null;
  city: string | null;
  age: number | null;
  description: string;
  vaccination_info: string | null;
  health_issues: string | null;
  documents: string | null;
  image_url: string | null;
  status: string;
  moderation_status: string;
  rejection_reason: string | null;
  created_at: string;
  owner?: User;
}

export interface Booking {
  id: number;
  pet_id: number;
  user_id: number;
  status: string;
  created_at: string;
  pet?: Pet;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  booking_id: number | null;
  text: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export interface Conversation {
  user_id: number;
  username: string;
  pet_name: string | null;
  pet_id: number | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_admin_chat: boolean;
}

export interface Complaint {
  id: number;
  type: string;
  reporter_id: number;
  reporter_username: string;
  target_id: number;
  target_username: string;
  reason: string;
  comment: string | null;
  is_resolved: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export const authAPI = {
  register: (data: { username: string; email: string; phone?: string; city?: string; password: string }) =>
    api.post<Token>('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post<Token>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
  updateCity: (city: string) => api.post<User>('/auth/city', { city }),
  verifyEmail: (code: string) => api.post('/auth/verify', { code }),
  resendCode: () => api.post('/auth/resend-code'),
  changeEmail: (email: string) => api.post('/auth/change-email', { email }),
  sendPhoneCode: (phone: string) => api.post('/auth/send-phone-code', { phone }),
  verifyPhone: (code: string) => api.post('/auth/verify-phone', { code }),
  resendPhoneCode: () => api.post('/auth/resend-phone-code'),
  getMailruAuth: () => api.get<{ auth_url: string }>('/auth/mailru/auth'),
  oauthLogin: (data: { access_token: string; provider: string }) =>
    api.post<Token>('/auth/oauth-login', data),
};

export const petsAPI = {
  list: (params?: { species?: string; breed?: string; character?: string; city?: string; status?: string; search?: string; is_unknown?: boolean; other_breed?: boolean }) =>
    api.get<Pet[]>('/pets', { params }),
  get: (id: number) => api.get<Pet>(`/pets/${id}`),
  create: (formData: FormData) =>
    api.post<Pet>('/pets', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/pets/${id}`),
};

export const bookingsAPI = {
  create: (petId: number) => api.post<Booking>('/bookings', null, { params: { pet_id: petId } }),
  getMy: () => api.get<Booking[]>('/bookings/my'),
  cancel: (id: number) => api.delete(`/bookings/${id}`),
};

export const messagesAPI = {
  send: (data: { receiver_id: number; booking_id?: number; text: string }) =>
    api.post<Message>('/messages', data),
  getConversations: () => api.get<Conversation[]>('/messages/conversations'),
  getMessages: (userId: number) => api.get<Message[]>(`/messages/${userId}`),
  getUnreadCount: () => api.get<{ count: number }>('/messages/unread/count'),
  delete: (messageId: number) => api.delete(`/messages/${messageId}`),
  report: (data: { message_id: number; reason: string; comment?: string }) =>
    api.post('/messages/report', data),
  reportUser: (data: { reported_user_id: number; reason: string; comment?: string }) =>
    api.post('/messages/report-user', data),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get<User[]>('/admin/users'),
  getAllPets: () => api.get<Pet[]>('/admin/pets'),
  approvePet: (id: number) => api.post(`/admin/pets/${id}/approve`),
  rejectPet: (id: number) => api.post(`/admin/pets/${id}/reject`),
  blockUser: (id: number) => api.post(`/admin/users/${id}/block`),
  unblockUser: (id: number) => api.post(`/admin/users/${id}/unblock`),
  deletePet: (id: number) => api.delete(`/admin/pets/${id}`),
  getComplaints: () => api.get<Complaint[]>('/admin/complaints'),
  resolveComplaint: (type: string, id: number) => api.post(`/admin/complaints/${type}/${id}/resolve`),
  banFromComplaint: (type: string, id: number) => api.post(`/admin/complaints/${type}/${id}/ban`),
};

export default api;
