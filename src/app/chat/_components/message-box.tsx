"use client";

import { Message } from "@/lib/interfaces";
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface MessageBoxProps {
  messages: Message[];
}

const MessageBox: React.FC<MessageBoxProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages && messages?.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role == 'assistant' ? "justify-start" : "justify-end"}`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-lg ${message.role == "assistant"
              ? "bg-gray-200 text-gray-800"
              : "bg-blue-600 text-neutral"
              }`}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {message.isStreaming && (
              <div className="mt-1">
                <span className="animate-pulse">▌</span>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageBox;
