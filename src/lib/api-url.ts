// Use Vercel proxy in production to bypass CORS
export const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : '/api');
