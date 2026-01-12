const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const getMultipartHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      console.log('API: Attempting login to:', `${API_URL}/auth/login`);
      console.log('API: Email:', email);
      
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      console.log('API: Response status:', res.status);
      console.log('API: Response ok:', res.ok);
      
      const data = await res.json();
      console.log('API: Response data:', data);
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      return data;
    },
    googleLogin: async (credential: string) => {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login failed');
      }
      return data;
    }
  },

  cases: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/cases`, { headers: getAuthHeaders() });
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/cases`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/cases/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/cases/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    }
  },

  contacts: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/contacts`, { headers: getAuthHeaders() });
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/contacts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/contacts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    }
  },

  staff: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/staff`, { headers: getAuthHeaders() });
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/staff`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/staff/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/staff/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    }
  },

  invoices: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/invoices`, { headers: getAuthHeaders() });
      return res.json();
    },
    create: async (data: any, file?: File) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      if (file) formData.append('file', file);
      
      const res = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: getMultipartHeaders(),
        body: formData
      });
      return res.json();
    },
    update: async (id: string, data: any, file?: File) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      if (file) formData.append('file', file);
      
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: getMultipartHeaders(),
        body: formData
      });
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    },
    getDownloadUrl: async (id: string) => {
      const res = await fetch(`${API_URL}/invoices/${id}/download-url`, {
        headers: getAuthHeaders()
      });
      return res.json();
    }
  },

  documents: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/documents`, { headers: getAuthHeaders() });
      return res.json();
    },
    upload: async (file: File, data: any) => {
      const formData = new FormData();
      formData.append('file', file);
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      const res = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: getMultipartHeaders(),
        body: formData
      });
      return res.json();
    },
    getDownloadUrl: async (id: string) => {
      const res = await fetch(`${API_URL}/documents/${id}/download-url`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    }
  },

  admin: {
    clearAllData: async () => {
      const res = await fetch(`${API_URL}/admin/clear-all-data`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    },
    getStats: async () => {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },
    getUsers: async () => {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: getAuthHeaders()
      });
      return res.json();
    },
    createUser: async (data: any) => {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    deleteUser: async (id: string) => {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    }
  },

  tasks: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/tasks`, { headers: getAuthHeaders() });
      return res.json();
    },
    getMyTasks: async () => {
      const res = await fetch(`${API_URL}/tasks/my-tasks`, { headers: getAuthHeaders() });
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.json();
    },
    addComment: async (taskId: string, comment: string) => {
      const res = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comment })
      });
      return res.json();
    },
    getComments: async (taskId: string) => {
      const res = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
        headers: getAuthHeaders()
      });
      return res.json();
    }
  }
};
