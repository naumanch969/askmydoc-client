import { DocumentStatus } from "@/lib/enums";

// Backend Model Interfaces
export interface User {
  _id: string;
  clerkId: string;
  email: string;
  createdAt: string;
}


export interface Document {
  _id: string;
  user: User | string;
  clerkId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  namespace: string;
  path: string;
  status: DocumentStatus;
  error: string | null;
  pageCount?: number;
  chunkCount: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageSource {
  page: number;
  content: string;
}

export interface Message {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    tokens?: number;
    processingTime?: number;
    sources?: MessageSource[];
  };
  createdAt: string;
  isStreaming?: boolean;
  isState?: boolean;
  state?: 'thinking' | 'generating';
}

export interface Session {
  _id: string;
  user: User | string;
  clerkId: string;
  document: Document | string;
  title?: string;
  messages: Message[];
  status: 'active' | 'archived';
  isPinned: boolean;
  metadata: {
    totalTokens: number;
    lastActivity: string;
  };
  createdAt: string;
  updatedAt: string;
}


// API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
  success: boolean;
}

export interface SocketMessage {
  sessionId: string;
  message: string;
  clerkId: string;
}

export interface SocketMessage {
  sessionId: string;
  message: string;
  clerkId: string;
}