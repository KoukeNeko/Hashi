import axios from 'axios';

// 設定後端的基礎 URL
const API_BASE_URL = 'http://localhost:8080/api/v1';

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