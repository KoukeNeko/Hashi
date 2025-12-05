import axios from 'axios';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthResponse, CronJob, FileItem, FirewallRule, GroupInfo, ServiceItem, SystemStatus, UserInfo } from '@/types';

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

// 使用者管理 API
export const UserManagementService = {
  listUsers: async (): Promise<UserInfo[]> => {
    const response = await api.get<UserInfo[]>('/users');
    return response.data;
  },
  createUser: async (username: string, password: string, shell: string = '/bin/bash', createHome: boolean = true) => {
    const response = await api.post('/users', { username, password, shell, createHome: String(createHome) });
    return response.data;
  },
  deleteUser: async (username: string, removeHome: boolean = false) => {
    const response = await api.delete(`/users/${username}`, { params: { removeHome } });
    return response.data;
  },
  changePassword: async (username: string, password: string) => {
    const response = await api.put(`/users/${username}/password`, { password });
    return response.data;
  },
  changeShell: async (username: string, shell: string) => {
    const response = await api.put(`/users/${username}/shell`, { shell });
    return response.data;
  },
  listGroups: async (): Promise<GroupInfo[]> => {
    const response = await api.get<GroupInfo[]>('/users/groups');
    return response.data;
  },
  createGroup: async (name: string) => {
    const response = await api.post('/users/groups', { name });
    return response.data;
  },
  deleteGroup: async (groupName: string) => {
    const response = await api.delete(`/users/groups/${groupName}`);
    return response.data;
  },
  addMemberToGroup: async (groupName: string, username: string) => {
    const response = await api.post(`/users/groups/${groupName}/members`, { username });
    return response.data;
  },
  removeMemberFromGroup: async (groupName: string, username: string) => {
    const response = await api.delete(`/users/groups/${groupName}/members/${username}`);
    return response.data;
  },
  getUserGroups: async (username: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/users/${username}/groups`);
    return response.data;
  },
  setUserGroups: async (username: string, groups: string[]) => {
    const response = await api.put(`/users/${username}/groups`, { groups });
    return response.data;
  }
};

// localStorage 存儲使用者資訊的 key
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