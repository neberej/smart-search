import axios from 'axios';

export const getConfig = () => axios.get('/config');
export const updateConfig = (data: any) => axios.post('/config', data);
export const runReindex = () => axios.post('/reindex', {}, { timeout: 60000 });
export const runSearch = (query: string) =>
  axios.get('/search', {
    params: { q: query },
    timeout: 15000,
  });
