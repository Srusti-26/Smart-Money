import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const CATEGORIES = ['Food','Rent','Travel','Shopping','Bills','Entertainment','Healthcare','Education','EMI','Investment','Salary','Others'];

export const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Rent: '#ef4444',
  Travel: '#06b6d4',
  Shopping: '#8b5cf6',
  Bills: '#f97316',
  Entertainment: '#ec4899',
  Healthcare: '#22d3a5',
  Education: '#4f8eff',
  EMI: '#dc2626',
  Investment: '#16a34a',
  Salary: '#22d3a5',
  Others: '#6b7280',
};

export const CATEGORY_ICONS = {
  Food: '🍕', Rent: '🏠', Travel: '✈️', Shopping: '🛍️',
  Bills: '⚡', Entertainment: '🎬', Healthcare: '💊',
  Education: '📚', EMI: '💳', Investment: '📈', Salary: '💰', Others: '📦'
};

export default api;
