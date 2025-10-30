import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
});

export const fetchMatches = (status) => {
  const params = status ? { status } : {};
  return api.get('/matches', { params }).then((res) => res.data);
};

export const fetchMatchById = (id) => {
  return api.get(`/matches/${id}`).then((res) => res.data);
};

export const fetchLiveMatches = () => {
  return api.get('/live-matches').then((res) => res.data);
};

export const fetchLiveScore = (matchId, options = {}) => {
  const { params } = options;
  return api.get(`/live-score/${matchId}`, { params }).then((res) => res.data);
};

export default api;
