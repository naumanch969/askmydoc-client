import { Suspense } from 'react';
import ChatbotClient from './_components/chatbot-client';

export default function ChatbotPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatbotClient />
    </Suspense>
  );
}
