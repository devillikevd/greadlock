export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const baseUrl = API_BASE_URL.replace(/\/$/, '');
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ||
  (baseUrl.startsWith('https://')
    ? baseUrl.replace(/^https:/, 'wss:')
    : baseUrl.replace(/^http:/, 'ws:'));
