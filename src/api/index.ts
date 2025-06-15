import axios from "axios";
import { SERVER_URL } from "@/constants";
import type { Document, Message, Session, ApiResponse } from '@/interfaces';

declare global {
    interface Window {
        Clerk?: {
            session?: {
                getToken: () => Promise<string | null>;
                id: string;
            };
        };
    }
}

// API Client
const api = axios.create({
    baseURL: `${SERVER_URL}`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    const clerk = window.Clerk;
    if (clerk?.session) {
        const token = await clerk.session.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            config.headers['x-session-id'] = clerk.session.id;
        }
    }
    return config;
});

// Document APIs
export const documentApi = {
    upload: async (file: File, userId: string): Promise<ApiResponse<Document>> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        const { data } = await api.post('/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    getAll: async (): Promise<ApiResponse<Document[]>> => {
        const { data } = await api.get('/documents');
        return data;
    },

    getOne: async (id: string): Promise<ApiResponse<Document>> => {
        const { data } = await api.get(`/documents/${id}`);
        return data;
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
        const { data } = await api.delete(`/documents/${id}`);
        return data;
    },
};

// Session APIs
export const sessionApi = {
    create: async (documentId: string): Promise<ApiResponse<Session>> => {
        const { data } = await api.post('/sessions', { documentId });
        return data;
    },

    getAll: async (): Promise<ApiResponse<Session[]>> => {
        const { data } = await api.get('/sessions');
        return data;
    },

    getOne: async (sessionId: string): Promise<ApiResponse<Session>> => {
        const { data } = await api.get(`/sessions/${sessionId}`);
        return data;
    },

    update: async (sessionId: string, title: string): Promise<ApiResponse<Session>> => {
        const { data } = await api.patch(`/sessions/${sessionId}`, { title });
        return data;
    },

    delete: async (sessionId: string): Promise<ApiResponse<void>> => {
        const { data } = await api.delete(`/sessions/${sessionId}`);
        return data;
    },
};

// Chat APIs
export const chatApi = {
    sendMessage: async (sessionId: string, message: string): Promise<ApiResponse<Message>> => {
        const { data } = await api.post(`/sessions/${sessionId}/messages`, { message });
        return data;
    },

    getHistory: async (sessionId: string): Promise<ApiResponse<Message[]>> => {
        const { data } = await api.get(`/sessions/${sessionId}/messages`);
        return data;
    },

    // Streaming message response
    streamMessage: async (sessionId: string, content: string, onChunk: (chunk: string) => void): Promise<void> => {
        const response = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/messages/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ content }),
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            onChunk(chunk);
        }
    },
};

const exportedApis = {
    documentApi,
    sessionApi,
    chatApi,
};

export default exportedApis;
