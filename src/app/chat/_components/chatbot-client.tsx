"use client";

import React, { FormEvent, useState, useEffect } from "react";
import MessageBox from "./message-box";
import ChatbotSidebar from "./chatbot-sidebar";
import ChatbotNavbar from "./chatbot-header";
import { Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "../context/SocketContext";
import { Message, SocketMessage } from "@/lib/interfaces";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { getOneSession } from "@/store/reducers/sessionSlice";
import DefaultScreen from "./default-screen";
import { AppDispatch } from "@/store/store";
import { getMessageHistory } from "@/store/reducers/chatSlice";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

interface SocketError {
    message: string;
    timestamp: string;
}

const ChatbotClient = () => {
    ///////////////////////////////////////////////////////////// VARIABLES /////////////////////////////////////////////////////////////////////
    const initialMessage: Message[] = [];
    const { user } = useUser();
    const searchParams = useSearchParams();
    const chatId = searchParams.get('id')
    const dispatch = useDispatch<AppDispatch>()

    ///////////////////////////////////////////////////////////// STATES /////////////////////////////////////////////////////////////////////
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>(initialMessage);
    const [loading, setLoading] = useState({ fetch: false, submit: false });
    const [sessionId, setSessionId] = useState<string>(chatId || '');
    const [debugInfo, setDebugInfo] = useState<string>("");

    const { socket, isConnected, connectError } = useSocket();

    ///////////////////////////////////////////////////////////// USE EFFECTS /////////////////////////////////////////////////////////////////////
    // Get Chat Session
    useEffect(() => {
        if (!sessionId) return;
        setLoading(pre => ({ ...pre, fetch: true }))
        dispatch(getOneSession(sessionId))
            .then(() => {
                // Join the socket room for this session
                if (socket && isConnected) {
                    socket.emit('join_session', sessionId);
                }
            })
            .finally(() => setLoading(pre => ({ ...pre, fetch: false })))
    }, [sessionId, dispatch, socket, isConnected]);

    // Get Messages
    useEffect(() => {
        if (!sessionId) return;
        setLoading(pre => ({ ...pre, fetch: true }))
        dispatch(getMessageHistory(sessionId))
            .then((action) => {
                setMessages(action.payload as Message[]);
            })
            .finally(() => setLoading(pre => ({ ...pre, fetch: false })))
    }, [sessionId, dispatch])

    // Add debug info when socket connection status changes
    useEffect(() => {
        if (connectError) {
            setDebugInfo(`Connection error: ${connectError}`);
        } else if (isConnected) {
            setDebugInfo(`Connected with socket ID: ${socket?.id}`);
        } else {
            setDebugInfo("Disconnected or connecting...");
        }
    }, [isConnected, connectError, socket?.id]);

    // Backend events listening
    useEffect(() => {
        if (!socket) return;

        // Listen for receive_message event
        socket.on("receive_message", (data: { message: string; timestamp: string }) => {
            console.log("Message received:", data);
            const newMessage: Message = {
                _id: Date.now().toString(),
                role: "assistant",
                content: data.message,
                createdAt: data.timestamp,
                isStreaming: false,
            };
            setMessages((prev) => [...prev, newMessage]);
            setLoading(pre => ({ ...pre, submit: false }));
        });

        // Listen for system messages
        socket.on("system_message", (data: { message: string; timestamp: string }) => {
            console.log("System message:", data);
            const systemMessage: Message = {
                _id: Date.now().toString(),
                role: "assistant",
                content: data.message,
                createdAt: data.timestamp,
                isStreaming: false,
            };
            setMessages((prev) => [...prev, systemMessage]);
        });

        // Listen for errors
        socket.on("error", (error: SocketError) => {
            console.error("Socket error:", error);
            setDebugInfo(`Socket error: ${error.message}`);
            const errorMessage: Message = {
                _id: "error_" + Date.now(),
                role: "assistant",
                content: error.message,
                createdAt: error.timestamp,
                isStreaming: false,
            };
            setMessages((prev) => [...prev, errorMessage]);
            setLoading(pre => ({ ...pre, submit: false }));
        });

        return () => {
            socket.off("receive_message");
            socket.off("system_message");
            socket.off("error");
        };
    }, [socket]);

    ///////////////////////////////////////////////////////////// FUNCTIONS /////////////////////////////////////////////////////////////////////
    const onSendMessage = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {return toast.error("Please log in first.");}
        if (message.trim() === "" || !socket || !isConnected || loading.submit || loading.fetch) return;

        setLoading(pre => ({ ...pre, submit: true }));

        const userMessage = message.trim();
        console.log(`Sending message: "${userMessage}" with sessionId: ${sessionId}`);

        // Add user message to UI immediately
        const userMessageObj: Message = {
            _id: Date.now().toString(),
            role: "user",
            content: userMessage,
            createdAt: new Date().toISOString(),
            isStreaming: false,
        };
        setMessages((prev) => [...prev, userMessageObj]);

        const messageToSend: SocketMessage = {
            sessionId: sessionId,
            message: userMessage,
            clerkId: user?.id
        }
        // Send message through socket
        socket.emit("send_message", messageToSend);

        setMessage("");
    };

    ///////////////////////////////////////////////////////////// RENDER /////////////////////////////////////////////////////////////////////
    return (
        <div className="flex gap-4 h-screen w-full">
            {/* Sidebar */}
            <div className="grid grid-cols-12 w-full">
                <ChatbotSidebar
                    setSessionId={setSessionId}
                    sessionId={sessionId}
                />

                {/* Chat Area */}
                <div className="col-span-8 lg:col-span-9 xl:col-span-10 flex-1 flex flex-col h-full w-full bg-gray-100 overflow-hidden rounded-md shadow-md border">
                    <ChatbotNavbar />

                    <form
                        onSubmit={onSendMessage}
                        style={{ height: "calc(100vh - 64px)" }}
                        className="max-w-5xl w-full mx-auto flex flex-1 flex-col px-4"
                    >
                        {/* Debug info */}
                        {debugInfo && (
                            <div className="bg-yellow-100 text-yellow-800 p-2 mb-2 rounded text-xs">
                                Debug: {debugInfo}
                            </div>
                        )}

                        {messages?.length === 0 ? (
                            <DefaultScreen />
                        ) : (
                            <MessageBox messages={messages} />
                        )}

                        <div className="w-full flex flex-col justify-center items-center gap-2 mb-2">
                            <div className="flex flex-col items-center p-2 mx-auto bg-neutral w-[50rem] border rounded-2xl">
                                <input
                                    type="text"
                                    className="flex-1 p-2 border-none outline-none rounded-lg w-full"
                                    placeholder={isConnected ? "Type a message..." : "Connecting..."}
                                    autoFocus={true}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={!isConnected || loading.submit}
                                />
                                <div className="flex justify-between items-center w-full">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="p-1 rounded-full"
                                    >
                                        <Plus />
                                    </Button>
                                    <Button
                                        size="icon"
                                        type="submit"
                                        className="p-1"
                                        disabled={!isConnected || loading.submit || loading.fetch}
                                    >
                                        <Send />
                                    </Button>
                                </div>
                            </div>
                            <span className="text-secondary-foreground text-xs">
                                {!isConnected
                                    ? `Connecting to server... ${connectError ? `(Error: ${connectError})` : ""}`
                                    : "LegalEase can make mistakes. Check important info."}
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatbotClient;
