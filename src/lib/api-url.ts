// Use environment variable if set, otherwise use production Railway backend
const PRODUCTION_API_URL = 'https://legaltrack-production.up.railway.app/api';
const LOCAL_API_URL = 'http://localhost:3001/api';

export const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? LOCAL_API_URL 
    : PRODUCTION_API_URL);
