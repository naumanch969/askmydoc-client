"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectError: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectError: null,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    // Define the socket server URL
    const socketUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    console.log("Attempting to connect to socket server:", socketUrl);

    // Connect to the server with explicit options
    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"], // Try WebSocket first, fall back to polling
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // 20 seconds timeout
    });

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Connected to socket server with ID:", socketInstance.id);
      setIsConnected(true);
      setConnectError(null);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setConnectError(err.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from socket server. Reason:", reason);
      setIsConnected(false);
    });

    socketInstance.on("error", (err) => {
      console.error("Socket error:", err);
    });

    // Store the socket instance
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectError }}>
      {children}
    </SocketContext.Provider>
  );
};
