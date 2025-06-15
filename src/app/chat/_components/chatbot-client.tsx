"use client";

import React, { FormEvent, useState, useEffect } from "react";
import MessageBox from "./message-box";
import ChatbotSidebar from "./chatbot-sidebar";
import ChatbotNavbar from "./chatbot-header";
import { Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "../context/SocketContext";
import { Message, Session } from "@/lib/interfaces";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { getOneSession } from "@/store/reducers/sessionSlice";
import DefaultScreen from "./default-screen";
import { AppDispatch } from "@/store/store";
import { getMessageHistory } from "@/store/reducers/chatSlice";
import { useUser } from "@clerk/nextjs";

const ChatbotClient = () => {

    ///////////////////////////////////////////////////////////// VARIABLES /////////////////////////////////////////////////////////////////////
    const initialMessage: Message[] = [];
    const { user } = useUser();
    const searchParams = useSearchParams();
    const chatId = searchParams.get('id')
    const dispatch = useDispatch<AppDispatch>()

    ///////////////////////////////////////////////////////////// STATES /////////////////////////////////////////////////////////////////////
    const [message, setMessage] = useState("");
    const [selectedChat, setSelectedChat] = useState<Session | null>(null);
    const [messages, setMessages] = useState<Message[]>(initialMessage);
    const [loading, setLoading] = useState({ fetch: false, submit: false });
    const [sessionId, setSessionId] = useState<string>(chatId || '');
    const [debugInfo, setDebugInfo] = useState<string>("");

    const { socket, isConnected, connectError } = useSocket();

    useEffect(() => { console.log('messages', messages) }, [messages])

    ///////////////////////////////////////////////////////////// USE EFFECTS /////////////////////////////////////////////////////////////////////
    // Get Chat Session
    useEffect(() => {
        // get selected chat detail
        if (!sessionId) return;
        setLoading(pre => ({ ...pre, fetch: true }))
        dispatch(getOneSession(sessionId))
            .then(({ payload }) => {
                setSelectedChat(payload)
            })
            .finally(() => setLoading(pre => ({ ...pre, fetch: false })))
    }, [sessionId, dispatch]);

    // Get Messages
    useEffect(() => {
        // get messages
        if (!sessionId) return;
        setLoading(pre => ({ ...pre, fetch: true }))
        dispatch(getMessageHistory(sessionId))
            .then(({ payload }) => {
                setMessages(payload)
                console.log('payload', payload)
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

        // Listen for session start response
        socket.on("session_started", (data: any) => {
            console.log("Session started:", data);
            setSessionId(data.sessionId);
            setDebugInfo(`Session started with ID: ${data.sessionId}`);

            // Update the route with the session ID as a query parameter without reloading the page
            const url = new URL(window.location.href);
            url.searchParams.set("id", data.sessionId);
            window.history.pushState({}, "", url.toString());

            // If there are previous messages in this session, load them
            if (data.messages && data.messages.length > 0) {
                const formattedMessages = data.messages.map((msg: any) => ({
                    id: msg._id,
                    isBot: msg.sender === "bot",
                    text: msg.content,
                }));
                setMessages(formattedMessages);
            }
        });

        // Listen for message responses
        socket.on("message_received", (newMessage: Message) => {
            console.log("Message received:", newMessage);
            setMessages((prev) => [...prev, newMessage]);
        });

        // Listen for streaming updates
        socket.on("message_stream", (data: { id: string, content: string, done: boolean }) => {
            console.log("Message stream update:", data);
            const { id: messageId, content, done } = data;

            setMessages((prev) =>
                prev.map((msg) => String(msg._id) === String(messageId) ? { ...msg, content, isStreaming: !done } : msg)
            );

            if (done) {
                setLoading(pre => ({ ...pre, submit: false }));
            }
        });

        // Listen for errors
        socket.on("error", (error: any) => {
            console.error("Socket error:", error);
            setDebugInfo(`Socket error: ${JSON.stringify(error)}`);
            const message: Message = {
                _id: "error_" + Date.now(),
                role: "assistant",
                content: "Sorry, there was an error processing your request.",
                createdAt: Date.now().toString(),
                isStreaming: false,
            }
            setMessages((prev) => [
                ...prev, message,
            ]);
            setLoading(pre => ({ ...pre, submit: false }));
        });

        return () => {
            socket.off("session_started");
            socket.off("message_received");
            socket.off("message_stream");
            socket.off("error");
        };
    }, [socket]);


    ///////////////////////////////////////////////////////////// FUNCTIONS /////////////////////////////////////////////////////////////////////
    const onSendMessage = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (message.trim() === "" || !socket || !isConnected || loading.submit || loading.fetch)
            return;

        setLoading(pre => ({ ...pre, submit: true }));

        // Get user message for sending
        const userMessage = message.trim();

        // Always log what we're about to send
        console.log(`Sending message: "${userMessage}" ${sessionId ? `with sessionId: ${sessionId}` : "without session"}`);

        // If no sessionId yet, we need to start a new chat
        if (!sessionId) {
            // Using a test user ID (replace with actual authentication)
            const userId = user?.id; // Replace with actual user ID

            console.log("Starting new chat session for user:", userId);
            setDebugInfo(`Starting new chat for user: ${userId}`);

            // Emit start_chat event
            socket.emit("start_chat", { userId });

            // Add user message to UI immediately
            // const userMsgId = Date.now().toString();
            // setMessages((prev) => [
            //   ...prev,
            //   { id: userMsgId, isBot: false, text: userMessage },
            // ]);

            setMessage("");

            // Wait for session to start before sending the message
            const onSessionStarted = (data: { sessionId: string }) => {
                console.log("Got session, now sending message:", userMessage);
                setDebugInfo(`Sending message with new session: ${data.sessionId}`);

                // Now we have sessionId, send the message
                socket.emit("chat_message", {
                    sessionId: data.sessionId,
                    message: userMessage,
                });

                // Remove this one-time listener
                socket.off("session_started", onSessionStarted);
            };

            socket.on("session_started", onSessionStarted);
        } else {
            // We already have a session, send message directly
            console.log("Sending message with existing session:", sessionId);
            setDebugInfo(`Sending message with existing session: ${sessionId}`);

            socket.emit("chat_message", {
                sessionId: sessionId,
                message: userMessage,
            });

            // Add user message to UI immediately
            // setMessages((prev) => [
            //   ...prev,
            //   { id: Date.now().toString(), isBot: false, text: userMessage },
            // ]);

            setMessage("");
        }
    };

    ///////////////////////////////////////////////////////////// RENDER /////////////////////////////////////////////////////////////////////
    return (
        <div className="flex gap-4 h-screen w-full">
            {/* Sidebar */}
            <div className="grid grid-cols-12 w-full">
                <ChatbotSidebar
                    setSessionId={setSessionId}
                    setSelectedChat={setSelectedChat}
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

                        {
                            messages?.length == 1
                                ?
                                <DefaultScreen />
                                :
                                <MessageBox messages={messages} />
                        }


                        <div className="w-full flex flex-col justify-center items-center gap-2 mb-2">
                            <div className="flex flex-col items-center p-2 mx-auto bg-neutral w-[50rem] border rounded-2xl">
                                <input
                                    type="text"
                                    className="flex-1 p-2 border-none outline-none rounded-lg w-full"
                                    placeholder={
                                        isConnected ? "Type a message..." : "Connecting..."
                                    }
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
                                    ? `Connecting to server... ${connectError ? `(Error: ${connectError})` : ""
                                    }`
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
