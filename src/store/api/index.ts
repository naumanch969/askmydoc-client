import axios from "axios";
import { SERVER_URL } from "@/constants";
import type { Document, Message, Session, ApiResponse } from '@/lib/interfaces';

const API = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const FormDataAPI = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "multipart/form-data",
  },
});

API.interceptors.request.use(async (config) => {
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
FormDataAPI.interceptors.request.use(async (config) => {
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

////////////////////////////////////////////////////////// DOCUMENT ////////////////////////////////////////////////////////////
export const uploadDocument = (formData: FormData) => FormDataAPI.post<ApiResponse<Document>>(`/documents`, formData);
export const getAllDocuments = () => API.get<ApiResponse<Document[]>>(`/documents`);
export const getOneDocument = (id: string) => API.get<ApiResponse<Document>>(`/documents/${id}`);
export const deleteDocument = (id: string) => API.delete<ApiResponse<void>>(`/documents/${id}`);

////////////////////////////////////////////////////////// SESSION ////////////////////////////////////////////////////////////
export const createSession = (payload: { documentId: string }) => API.post<ApiResponse<Session>>(`/sessions`, payload);
export const getAllSessions = () => API.get<ApiResponse<Session[]>>(`/sessions`);
export const getOneSession = (sessionId: string) => API.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
export const updateSession = (sessionId: string, title: string) => API.put<ApiResponse<Session>>(`/sessions/${sessionId}`, { title });
export const pinSession = (sessionId: string) => API.put<ApiResponse<Session>>(`/sessions/${sessionId}/pin`);
export const deleteSession = (sessionId: string) => API.delete<ApiResponse<void>>(`/sessions/${sessionId}`);

////////////////////////////////////////////////////////// CHAT ////////////////////////////////////////////////////////////
export const sendMessage = (payload: { sessionId: string, message: string }) => API.post<ApiResponse<Message>>(`/sessions/${payload.sessionId}/messages`, { message: payload.message });
export const getMessageHistory = (sessionId: string) => API.get<ApiResponse<Message[]>>(`/sessions/${sessionId}/messages`);
export const streamMessage = async (sessionId: string, content: string, onChunk: (chunk: string) => void): Promise<void> => {
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
};
