// Backend Model Interfaces
export interface Document {
  _id: string;
  userId: string;
  clerkId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  namespace: string;
  path: string;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  error?: string;
  pageCount?: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    tokens?: number;
    processingTime?: number;
    sources?: Array<{
      page: number;
      content: string;
    }>;
  };
  createdAt: string;
}

export interface Session {
  _id: string;
  userId: string;
  clerkId: string;
  documentId: string;
  title?: string;
  messages: Message[];
  status: 'active' | 'archived';
  metadata: {
    totalTokens: number;
    lastActivity: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  createdAt: string;
}

// Frontend State Types
export interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  error: string | null;
}

export interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Component Props Types
export interface ChatBoxProps {
  sessionId: string;
  onMessageSent?: (message: Message) => void;
  onError?: (error: string) => void;
}

export interface FileUploadProps {
  onUploadComplete?: (document: Document) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export interface DocumentListProps {
  documents: Document[];
  onDocumentSelect: (document: Document) => void;
  onDocumentDelete: (documentId: string) => void;
  isLoading?: boolean;
}

export interface SessionListProps {
  sessions: Session[];
  onSessionSelect: (session: Session) => void;
  onSessionDelete: (sessionId: string) => void;
  isLoading?: boolean;
}

// Form Types
export interface UploadFormData {
  file: File;
  userId: string;
}

export interface ChatFormData {
  message: string;
  sessionId: string;
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Context Types
export interface AppContextType {
  user: User | null;
  documents: DocumentState;
  sessions: SessionState;
  currentSession: Session | null;
  setCurrentSession: (session: Session | null) => void;
  uploadDocument: (file: File) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

// Utility Types
export type DocumentStatus = 'pending' | 'processing' | 'indexed' | 'failed';
export type SessionStatus = 'active' | 'archived';
export type MessageRole = 'user' | 'assistant';
export type FileType = 'pdf' | 'docx' | 'txt';

// Theme Types
export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
    error: string;
    success: string;
  };
}

// Settings Types
export interface UserSettings {
  theme: Theme;
  notifications: boolean;
  autoSave: boolean;
  language: string;
}

// Analytics Types
export interface AnalyticsEvent {
  type: string;
  payload: {
    action: string;
    metadata?: Record<string, string | number | boolean>;
    timestamp: string;
  };
  timestamp: string;
  userId: string;
}

// Search Types
export interface SearchResult {
  documentId: string;
  pageNumber: number;
  content: string;
  score: number;
  highlights: string[];
}

export interface SearchQuery {
  query: string;
  filters?: {
    documentIds?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    pageRange?: {
      start: number;
      end: number;
    };
  };
  limit?: number;
  offset?: number;
}
