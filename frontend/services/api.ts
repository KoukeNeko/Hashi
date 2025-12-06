import axios from 'axios';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthResponse, CreateGroupOptions, CreateUserOptions, CreateVmRequest, CronJob, FileItem, FirewallRule, GroupInfo, IsoFile, PasswordInfo, ServiceItem, SystemStatus, UserInfo, VM, VncInfo } from '@/types';

export const VirtService = {
  // VM 管理
  listVms: async () => {
    const response = await api.get<VM[]>('/virt/vms');
    return response.data;
  },
  createVm: async (request: CreateVmRequest) => {
    const response = await api.post<VM>('/virt/vms', request);
    return response.data;
  },
  deleteVm: async (name: string) => {
    await api.delete(`/virt/vms/${name}`);
  },
  controlVm: async (name: string, action: 'start' | 'stop' | 'force-stop' | 'reboot') => {
    await api.post(`/virt/vms/${name}/${action}`);
  },
  getVncInfo: async (name: string) => {
    const response = await api.get<VncInfo>(`/virt/vms/${name}/vnc-info`);
    return response.data;
  },
  
  // ISO 管理
  listIsoFiles: async () => {
    const response = await api.get<IsoFile[]>('/virt/iso');
    return response.data;
  },
  uploadIso: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<IsoFile>('/virt/iso', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0, // 禁用超時（大檔案上傳需要較長時間）
      onUploadProgress: (event) => {
        if (onProgress) {
          // 使用檔案大小作為 total（如果 event.total 未定義）
          const total = event.total || file.size;
          const progress = Math.round((event.loaded * 100) / total);
          onProgress(Math.min(progress, 99)); // 上傳完成前最多顯示 99%
        }
      }
    });
    if (onProgress) onProgress(100); // 上傳完成
    return response.data;
  },
  deleteIso: async (filename: string) => {
    await api.delete(`/virt/iso/${filename}`);
  }
};
  
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
  // ==================== 使用者查詢 ====================
  listUsers: async (): Promise<UserInfo[]> => {
    const response = await api.get<UserInfo[]>('/users');
    return response.data;
  },
  getUser: async (username: string): Promise<UserInfo> => {
    const response = await api.get<UserInfo>(`/users/${username}`);
    return response.data;
  },
  getPasswordInfo: async (username: string): Promise<PasswordInfo> => {
    const response = await api.get<PasswordInfo>(`/users/${username}/password-info`);
    return response.data;
  },
  getAvailableShells: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/users/shells');
    return response.data;
  },

  // ==================== 使用者管理 ====================
  createUser: async (options: CreateUserOptions) => {
    const response = await api.post('/users', options);
    return response.data;
  },
  deleteUser: async (username: string, removeHome: boolean = false, force: boolean = false) => {
    const response = await api.delete(`/users/${username}`, { params: { removeHome, force } });
    return response.data;
  },
  renameUser: async (username: string, newUsername: string) => {
    const response = await api.put(`/users/${username}/rename`, { newUsername });
    return response.data;
  },
  changeUid: async (username: string, uid: number) => {
    const response = await api.put(`/users/${username}/uid`, { uid });
    return response.data;
  },
  changePrimaryGroup: async (username: string, gid: number) => {
    const response = await api.put(`/users/${username}/primary-group`, { gid });
    return response.data;
  },
  changeHomeDir: async (username: string, homeDir: string, moveContents: boolean = false) => {
    const response = await api.put(`/users/${username}/home`, { homeDir, moveContents });
    return response.data;
  },
  changeShell: async (username: string, shell: string) => {
    const response = await api.put(`/users/${username}/shell`, { shell });
    return response.data;
  },
  changeGecos: async (username: string, gecos: string) => {
    const response = await api.put(`/users/${username}/gecos`, { gecos });
    return response.data;
  },

  // ==================== 密碼管理 ====================
  changePassword: async (username: string, password: string) => {
    const response = await api.put(`/users/${username}/password`, { password });
    return response.data;
  },
  deletePassword: async (username: string) => {
    const response = await api.delete(`/users/${username}/password`);
    return response.data;
  },
  expirePassword: async (username: string) => {
    const response = await api.post(`/users/${username}/expire-password`);
    return response.data;
  },
  setPasswordPolicy: async (username: string, policy: { minDays?: number; maxDays?: number; warnDays?: number; inactiveDays?: number }) => {
    const response = await api.put(`/users/${username}/password-policy`, policy);
    return response.data;
  },

  // ==================== 帳號鎖定 ====================
  lockUser: async (username: string) => {
    const response = await api.post(`/users/${username}/lock`);
    return response.data;
  },
  unlockUser: async (username: string) => {
    const response = await api.post(`/users/${username}/unlock`);
    return response.data;
  },
  setExpireDate: async (username: string, expireDate: string | null) => {
    const response = await api.put(`/users/${username}/expire-date`, { expireDate });
    return response.data;
  },

  // ==================== 群組查詢 ====================
  listGroups: async (): Promise<GroupInfo[]> => {
    const response = await api.get<GroupInfo[]>('/users/groups');
    return response.data;
  },
  getGroup: async (groupName: string): Promise<GroupInfo> => {
    const response = await api.get<GroupInfo>(`/users/groups/${groupName}`);
    return response.data;
  },
  getUserGroups: async (username: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/users/${username}/groups`);
    return response.data;
  },

  // ==================== 群組成員管理 ====================
  setUserGroups: async (username: string, groups: string[]) => {
    const response = await api.put(`/users/${username}/groups`, { groups });
    return response.data;
  },
  addUserToGroups: async (username: string, groups: string[]) => {
    const response = await api.post(`/users/${username}/groups`, { groups });
    return response.data;
  },

  // ==================== 群組管理 ====================
  createGroup: async (options: CreateGroupOptions) => {
    const response = await api.post('/users/groups', options);
    return response.data;
  },
  deleteGroup: async (groupName: string, force: boolean = false) => {
    const response = await api.delete(`/users/groups/${groupName}`, { params: { force } });
    return response.data;
  },
  renameGroup: async (groupName: string, newName: string) => {
    const response = await api.put(`/users/groups/${groupName}/rename`, { newName });
    return response.data;
  },
  changeGroupGid: async (groupName: string, gid: number) => {
    const response = await api.put(`/users/groups/${groupName}/gid`, { gid });
    return response.data;
  },
  setGroupMembers: async (groupName: string, members: string[]) => {
    const response = await api.put(`/users/groups/${groupName}/members`, { members });
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
  setGroupAdmins: async (groupName: string, admins: string[]) => {
    const response = await api.put(`/users/groups/${groupName}/admins`, { admins });
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
export const API_BASE_URL = '/api/v1';

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