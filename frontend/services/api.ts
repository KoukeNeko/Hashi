import axios from 'axios';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SystemStatus } from '@/types';

// WebSocket 連線函式
export const connectWebSocket = (onMessageReceived: (status: SystemStatus) => void) => {
  const client = new Client({
    // 使用 SockJS 建立連線工廠
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    
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