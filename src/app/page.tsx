"use client"

import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { sessionApi } from "@/api";
import { toast } from "react-hot-toast";
import { Document, Session } from "@/lib/interfaces";
import FileUpload from "@/components/FileUpload";
import ChatBox from "@/components/ChatBox";

export default function Home() {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const handleDocumentUploaded = async (document: Document) => {
    setCurrentDocument(document);
    try {
      // Create a new session for the uploaded document
      const { data: session } = await sessionApi.create(document._id);
      setCurrentSession(session);
      toast.success('Document uploaded successfully!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to create chat session');
      } else {
        toast.error('Failed to create chat session');
      }
    }
  };

  const handleError = (error: string) => {
    console.log('error', error);
    toast.error(error);
  };

  return (
    <main className="h-screen overflow-hidden w-screen grid grid-cols-10 bg-gray-900 text-white">
      <div className="col-span-3 flex flex-col justify-between border-gray-700 border-r p-6">
        <div>
          <h1 className="text-2xl font-bold mb-6">Upload Document</h1>
          <FileUpload
            onDocumentUploaded={handleDocumentUploaded}
            onError={handleError}
          />
        </div>
        {currentDocument && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Current Document</h2>
            <p className="text-sm text-gray-400">{currentDocument.originalName}</p>
            <p className="text-xs text-gray-500 mt-1">
              Status: {currentDocument.status}
            </p>
          </div>
        )}
      </div>
      <div className="col-span-7 p-6 h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Chat with Document</h1>
          <UserButton />
        </div>
        {currentSession ? (
          <ChatBox
            sessionId={currentSession._id}
            onError={handleError}
          />
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-12rem)] bg-gray-800 rounded-lg">
            <p className="text-gray-400">
              Upload a document to start chatting
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
