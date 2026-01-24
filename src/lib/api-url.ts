// Use Vercel proxy in production to bypass CORS, direct localhost for development
const LOCAL_API_URL = 'http://localhost:3001/api';

export const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? LOCAL_API_URL 
    : '/api');
