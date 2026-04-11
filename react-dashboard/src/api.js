import axios from 'axios';

const NODE_API = axios.create({
  baseURL: 'http://localhost:5001/api',
});

const FLASK_API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const fetchScreenshots = async (childEmail) => {
  const res = await NODE_API.get('/media/list', { params: { childEmail, kind: 'screenshot' } });
  return res.data;
};

export const fetchAudio = async (childEmail) => {
  const res = await NODE_API.get('/media/list', { params: { childEmail, kind: 'audio' } });
  return res.data;
};

export const fetchActivity = async () => {
  const res = await FLASK_API.get('/activity');
  return res.data;
};

export const fetchStats = async () => {
  const res = await FLASK_API.get('/stats');
  return res.data;
};

export const fetchAlerts = async (limit = 10) => {
  const res = await FLASK_API.get('/alerts', { params: { limit } });
  return res.data;
};

export const fetchTrend = async () => {
  const res = await FLASK_API.get('/trend');
  return res.data;
};

export const fetchCategoryBreakdown = async () => {
  const res = await FLASK_API.get('/category-breakdown');
  return res.data;
};

export const checkContent = async (text) => {
  const res = await FLASK_API.post('/analyze', { text });
  return res.data;
};

export const lockMedia = async (id, secretKey) => {
  const res = await NODE_API.post(`/media/${id}/lock`, { secretKey });
  return res.data;
};

export const deleteMedia = async (id, secretKey) => {
  const res = await NODE_API.delete(`/media/${id}`, { data: { secretKey } });
  return res.data;
};

export const registerUser = async (name, email, password, role) => {
  const res = await NODE_API.post('/auth/register', { name, email, password, role });
  return res.data;
};

export const loginUser = async (email, password, role) => {
  const res = await NODE_API.post('/auth/login', { email, password, role });
  return res.data;
};
