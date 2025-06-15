"use client"

import { useState, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, Upload, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { documentApi, sessionApi, chatApi } from '@/api';
import type { Message, Session } from '@/lib/interfaces';
import { toast } from 'react-hot-toast';

export default function ChatPage() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
console.log('user', user);
  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await sessionApi.getAll();
      if (response.status === 200) {
        setSessions(response.data);
        if (response.data.length > 0 && !selectedSession) {
          setSelectedSession(response.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      toast.error('Failed to fetch sessions');
    }
  };

  const handleCreateSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionApi.create('');
      if (response.status === 200) {
        setSessions([response.data, ...sessions]);
        setSelectedSession(response.data._id);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
      toast.error('Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await sessionApi.delete(sessionId);
      if (response.status === 200) {
        setSessions(sessions.filter(session => session._id !== sessionId));
        if (selectedSession === sessionId) {
          setSelectedSession(sessions[0]?._id || null);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete session');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const docResponse = await documentApi.upload(file, user.id);
      if (docResponse.status === 200) {
        const sessionResponse = await sessionApi.create(docResponse.data._id);
        if (sessionResponse.status === 200) {
          setSessions([sessionResponse.data, ...sessions]);
          setSelectedSession(sessionResponse.data._id);
          toast.success('Document uploaded successfully');
        }
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    const message = newMessage;
    setNewMessage('');

    try {
      setIsStreaming(true);
      let fullResponse = '';

      await chatApi.streamMessage(selectedSession, message, (chunk) => {
        fullResponse += chunk;
        // Update the UI with the streaming response
        setSessions(prev => prev.map(session => 
          session._id === selectedSession
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  { 
                    role: 'user',
                    content: message,
                    createdAt: new Date().toISOString()
                  },
                  { 
                    role: 'assistant',
                    content: fullResponse,
                    createdAt: new Date().toISOString()
                  }
                ]
              }
            : session
        ));
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 space-y-2">
          <button
            onClick={handleCreateSession}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            New Chat
          </button>
          
          <label className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt"
              disabled={isUploading}
            />
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            Upload Document
          </label>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sessions.map(session => (
            <div
              key={session._id}
              className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 ${
                selectedSession === session._id ? 'bg-gray-800' : ''
              }`}
              onClick={() => setSelectedSession(session._id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium truncate">{session.title || 'New Chat'}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session._id);
                  }}
                  className="p-1 rounded hover:bg-gray-700 text-gray-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-400">
                {new Date(session.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {sessions
                .find(s => s._id === selectedSession)
                ?.messages.map((message: Message) => (
                  <div
                    key={message._id || message.createdAt}
                    className={`mb-4 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              {isStreaming && (
                <div className="text-left mb-4">
                  <div className="inline-block p-3 rounded-lg bg-gray-700 text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isStreaming && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={isStreaming}
                  className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isStreaming}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              <p>Select a chat or start a new conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
