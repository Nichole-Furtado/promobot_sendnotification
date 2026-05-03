import axios from 'axios';
import type {
  Product, Channel, Promotion, DashboardStats,
  CycleResult, BroadcastResult, LogEntry,
} from '../types';

export const api = axios.create({ baseURL: '/' });

export const getHealth = () => api.get('/actuator/health').then(r => r.data);

export const getDashboard = () => api.get<DashboardStats>('/api/dashboard').then(r => r.data);

export const listProducts = () => api.get<Product[]>('/api/products').then(r => r.data);
export const createProduct = (body: { asin: string; title: string; niche: string; targetDiscountPct: number }) =>
  api.post<Product>('/api/products', body).then(r => r.data);
export const toggleProduct = (id: number) => api.patch(`/api/products/${id}/toggle`);
export const deleteProduct = (id: number) => api.delete(`/api/products/${id}`);
export const runNow = () => api.post<CycleResult>('/api/products/run-now').then(r => r.data);

export const listPromotions = () => api.get<Promotion[]>('/api/promotions').then(r => r.data);

export const listChannels = () => api.get<Channel[]>('/api/channels').then(r => r.data);
export const createChannel = (body: { type: string; identifier: string }) =>
  api.post<Channel>('/api/channels', body).then(r => r.data);
export const toggleChannel = (id: number) => api.patch(`/api/channels/${id}/toggle`);
export const deleteChannel = (id: number) => api.delete(`/api/channels/${id}`);

export const broadcastNext = () => api.post<BroadcastResult>('/api/test/broadcast-next').then(r => r.data);

export const getLogs = (limit = 200) => api.get<LogEntry[]>(`/api/logs?limit=${limit}`).then(r => r.data);
