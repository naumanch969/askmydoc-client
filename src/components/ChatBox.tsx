"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { chatApi } from '@/api';
import type { Message } from '@/interfaces';

interface ChatBoxProps {
    sessionId: string;
    onMessageSent?: (message: Message) => void;
    onError?: (error: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ sessionId, onMessageSent, onError }) => {

    //////////////////////////////////////////////////////////// VARIABLES ////////////////////////////////////////////////////////////////
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    //////////////////////////////////////////////////////////// USE EFFECT ////////////////////////////////////////////////////////////////
    // Load chat history
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const { data } = await chatApi.getHistory(sessionId);
                setMessages(data);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    onError?.(error.message);
                } else if (typeof error === 'string') {
                    onError?.(error);
                } else {
                    onError?.('Failed to load chat history');
                }
            }
        };

        if (sessionId) {
            loadHistory();
        }
    }, [sessionId, onError]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingMessage]);

    //////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            _id: Date.now().toString(), // Temporary ID
            sessionId,
            role: 'user',
            content: input,
            createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setStreamingMessage('');

        try {

            const response = await chatApi.sendMessage(sessionId, input);
            console.log('response', response);

            // Start streaming response
            await chatApi.streamMessage(sessionId, input, (chunk) => {
                setStreamingMessage(prev => prev + chunk);
            });

            // Add the complete message to the chat
            const botMessage: Message = {
                _id: Date.now().toString(), // Temporary ID
                sessionId,
                role: 'assistant',
                content: streamingMessage,
                createdAt: new Date().toISOString(),
            };

            setMessages(prev => [...prev, botMessage]);
            onMessageSent?.(botMessage);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Failed to send message';
            onError?.(errorMessage);
        } finally {
            setIsLoading(false);
            setStreamingMessage('');
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    //////////////////////////////////////////////////////////// RENDER ////////////////////////////////////////////////////////////////
    return (
        <div className="flex flex-col h-[calc(100vh-9vh)] bg-gray-800 rounded-lg shadow-xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Start a conversation with your document
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-100'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                {streamingMessage && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-700 text-gray-100">
                            {streamingMessage}
                            <span className="animate-pulse">▋</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-gray-700 p-4">
                <div className="flex space-x-4">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;