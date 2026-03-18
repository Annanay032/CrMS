import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

export const getCreators = () => api.get('/users?role=CREATOR').then(r => r.data);
export const getBrands = () => api.get('/users?role=BRAND').then(r => r.data);
export const getCampaigns = () => api.get('/campaigns').then(r => r.data);
export const createCampaign = (data: unknown) => api.post('/campaigns', data).then(r => r.data);
export const getContent = () => api.get('/content').then(r => r.data);
export const createContent = (data: unknown) => api.post('/content', data).then(r => r.data);
export const getAgents = () => api.get('/agents').then(r => r.data);
export const runAgent = (data: unknown) => api.post('/agents/run', data).then(r => r.data);
export const getAgentTasks = () => api.get('/agents/tasks').then(r => r.data);
export const getMatches = (campaignId: string) => api.get(`/matching/${campaignId}`).then(r => r.data);
export const runMatching = (campaignId: string) => api.post(`/matching/${campaignId}/run`).then(r => r.data);

export default api;
