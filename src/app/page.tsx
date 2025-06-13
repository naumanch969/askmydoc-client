import ChatBox from "@/components/ChatBox";
import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <main className="min-h-screen w-screen flex bg-gray-900 text-white">
      <div className="flex-[3] border-gray-700 border-r p-6">
        <h1 className="text-2xl font-bold mb-6">Upload Document</h1>
        <FileUpload />
      </div>
      <div className="flex-[7] p-6">
        <h1 className="text-2xl font-bold mb-6">Chat with Document</h1>
        <ChatBox />
      </div>
    </main>
  );
}
