import axios from 'axios';

const isElectron = navigator.userAgent.toLowerCase().includes('electron');
const baseURL = isElectron ? 'http://localhost:8001' : '';

console.log('📡 baseURL =', baseURL); // 👈 Confirm in devtools

const api = axios.create({
  baseURL,
  timeout: 15000,
});

export const getConfig = () => api.get('/config');
export const updateConfig = (data: any) => api.post('/config', data);
export const runReindex = () => api.post('/reindex', {}, { timeout: 60000 });
export const runSearch = (query: string) => {
  return api.get('http://localhost:8001/search', { params: { q: query } });
};
export const openFolder = (path: string) => {
  return api.post('/open-folder', { path });
};