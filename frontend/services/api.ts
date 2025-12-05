import axios from 'axios';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthResponse, CronJob, FileItem, FirewallRule, ServiceItem, SystemStatus, UserInfo } from '@/types';

// 認證相關 API
export const AuthService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { username, password });
    return response.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  validateSession: async (username: string): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/auth/validate', { params: { username } });
    return response.data;
  }
};

// localStorage 存儲用戶資訊的 key
const USER_STORAGE_KEY = 'hashi_user';

export const SessionStorage = {
  getUser: (): UserInfo | null => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },
  setUser: (user: UserInfo): void => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },
  clearUser: (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

export const FirewallService = {
  getStatus: async () => {
    const response = await api.get<{ enabled: boolean }>('/firewall/status');
    return response.data.enabled;
  },
  setStatus: async (enabled: boolean) => {
    await api.post('/firewall/status', null, { params: { enabled } });
  },
  getRules: async () => {
    const response = await api.get<FirewallRule[]>('/firewall');
    return response.data;
  },
  addRule: async (port: string, protocol: string) => {
    // 傳送 Query Params
    await api.post(`/firewall/allow`, null, { params: { port, protocol } });
  },
  deleteRule: async (index: number) => {
    await api.delete(`/firewall/${index}`);
  }
};

export const CronService = {
  listJobs: async () => {
    const response = await api.get<CronJob[]>('/cron');
    return response.data;
  },
  saveJobs: async (jobs: CronJob[]) => {
    await api.post('/cron', jobs);
  }
};

export const SystemdService = {
  listServices: async () => {
    const response = await api.get<ServiceItem[]>('/services');
    return response.data;
  },
  controlService: async (name: string, action: 'start' | 'stop' | 'restart') => {
    await api.post(`/services/${name}/${action}`);
  }
};

export const FileService = {
  listFiles: async (path: string = '/') => {
    // 透過 query param 傳遞 path
    const response = await api.get<FileItem[]>('/files/list', {
      params: { path }
    });
    return response.data;
  },

  getFileContent: async (path: string) => {
    const response = await api.get<string>('/files/content', {
      params: { path },
      responseType: 'text' // 重要：告訴 Axios 回傳的是純文字，不是 JSON
    });
    return response.data;
  },

  saveFileContent: async (path: string, content: string) => {
    await api.post('/files/content', { path, content });
  },

  deleteFile: async (path: string) => {
    await api.delete('/files/delete', { params: { path } });
  }
};


// WebSocket 連線函式
export const connectWebSocket = (onMessageReceived: (status: SystemStatus) => void) => {
  const client = new Client({
    // 使用 SockJS 建立連線工廠 (透過 Vite proxy)
    webSocketFactory: () => new SockJS('/ws'),
    
    // 連線成功時的回呼
    onConnect: () => {
      console.log('Connected to WebSocket');
      
      // 訂閱後端的推播頻道
      client.subscribe('/topic/status', (message) => {
        if (message.body) {
          const status: SystemStatus = JSON.parse(message.body);
          onMessageReceived(status);
        }
      });
    },
    
    // 錯誤處理
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
  });

  client.activate(); // 啟動連線
  return client; // 回傳 client 實例以便之後斷線用
};

// 設定後端的基礎 URL (透過 Vite proxy)
const API_BASE_URL = '/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Docker 相關的 API 服務
export const DockerService = {
    // 獲取容器列表
    getContainers: async () => {
        const response = await api.get('/docker/containers');
        return response.data;
    },

    // 啟動
    startContainer: async (id: string) => {
        return api.post(`/docker/containers/${id}/start`);
    },

    // 停止
    stopContainer: async (id: string) => {
        return api.post(`/docker/containers/${id}/stop`);
    },

    // 重啟
    restartContainer: async (id: string) => {
        return api.post(`/docker/containers/${id}/restart`);
    }
};

// 系統監控相關 API
export const DashboardService = {
    getSystemStatus: async () => {
        const response = await api.get('/dashboard/status');
        return response.data;
    }
};