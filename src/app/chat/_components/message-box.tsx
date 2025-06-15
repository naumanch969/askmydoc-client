"use client";

import React from "react";
import { Message } from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MessageBoxProps {
    messages: Message[];
}

const MessageBox = ({ messages }: MessageBoxProps) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
                <div
                    key={message._id}
                    className={cn(
                        "flex w-full",
                        message.role === "user" ? "justify-end" : "justify-start"
                    )}
                >
                    <div
                        className={cn(
                            "rounded-lg px-4 py-2 max-w-[80%]",
                            message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : message.isState
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-secondary text-secondary-foreground"
                        )}
                    >
                        {message.isState ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{message.content}</span>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap">
                                {message.content}
                                {message.isStreaming && (
                                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MessageBox;
