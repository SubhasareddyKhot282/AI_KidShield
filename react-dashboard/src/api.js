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
