import React, { Dispatch, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { Document, Session } from "@/lib/interfaces";
import { deleteSession, getAllSessions, pinSession, updateSession } from "@/store/reducers/sessionSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SetStateAction } from "jotai";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/alert-modal";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { socket } from "@/lib/socket";
import { Progress } from "@/components/ui/progress";

interface ChatSidebarProps {
  setSessionId: Dispatch<SetStateAction<string>>
  sessionId: string
}

interface SidebarChatItem {
  section: string,
  items: Session[]
}

interface ProcessingDocument {
  documentId: string;
  filename: string;
  progress: number;
}

const ChatbotSidebar: React.FC<ChatSidebarProps> = ({ sessionId, setSessionId }: ChatSidebarProps) => {

  //////////////////////////////////////////////////////////// VARIABLES //////////////////////////////////////////////////////////////////
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useUser();
  const { sessions: fetchedSessions } = useSelector((state: RootState) => state.session)
  const router = useRouter();

  //////////////////////////////////////////////////////////// STATES //////////////////////////////////////////////////////////////////
  const [sessions, setSessions] = useState<SidebarChatItem[]>([]);
  const [loading, setLoading] = useState<{ fetch: boolean, rename: boolean, delete: boolean, upload: boolean, pin: boolean }>({ fetch: false, rename: false, delete: false, upload: false, pin: false });
  const [renaming, setRenaming] = useState<string>('');
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState<ProcessingDocument[]>([]);

  //////////////////////////////////////////////////////////// USE EFFECTS //////////////////////////////////////////////////////////////////
  useEffect(() => {
    setLoading(pre => ({ ...pre, fetch: true }));
    dispatch(getAllSessions())
      .finally(() => setLoading(pre => ({ ...pre, fetch: false })));
  }, [dispatch, user]);

  useEffect(() => {
    function groupChatsByDate(): SidebarChatItem[] {
      if (!fetchedSessions) return [];

      const sidebarItems: SidebarChatItem[] = [
        { section: "Pinned", items: [] },
        { section: "Today", items: [] },
        { section: "Yesterday", items: [] },
        { section: "Previous 7 Days", items: [] },
        { section: "Last 30 Days", items: [] },
        { section: "Older", items: [] },
      ];

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      fetchedSessions.forEach(session => {
        const updated = new Date(session.updatedAt);

        if (session.isPinned) {
          sidebarItems[0].items.push(session);
        } else if (updated >= today) {
          sidebarItems[1].items.push(session);
        } else if (updated >= yesterday) {
          sidebarItems[2].items.push(session);
        } else if (updated >= sevenDaysAgo) {
          sidebarItems[3].items.push(session);
        } else if (updated >= thirtyDaysAgo) {
          sidebarItems[4].items.push(session);
        } else {
          sidebarItems[5].items.push(session);
        }
      });

      // Sort each section's items by updatedAt descending
      sidebarItems.forEach(section => {
        section.items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });

      // Remove empty sections except Pinned
      return sidebarItems.filter(section => section.section === "Pinned" || section.items.length > 0);
    }
    setSessions(groupChatsByDate());
  }, [fetchedSessions]);

  useEffect(() => {
    // Socket event listeners for document processing
    socket.on('document_processing_started', (data: { documentId: string }) => {
      setProcessingDocuments(prev => [...prev, { documentId: data.documentId, filename: '', progress: 0 }]);
    });

    socket.on('document_processing_progress', (data: { documentId: string, progress: number }) => {
      setProcessingDocuments(prev =>
        prev.map(doc =>
          doc.documentId === data.documentId
            ? { ...doc, progress: data.progress }
            : doc
        )
      );
    });

    socket.on('document_processing_completed', (data: { documentId: string, sessionId: string }) => {
      setProcessingDocuments(prev => prev.filter(doc => doc.documentId !== data.documentId));
      dispatch(getAllSessions());
      // Navigate to the new session
      router.push('/chat?id=' + data.sessionId);
      setSessionId(data.sessionId);
      setLoading(pre => ({ ...pre, upload: false }));
      toast.success('Document processed successfully');
    });

    socket.on('upload_error', (data: { message: string }) => {
      toast.error(data.message);
      setLoading(pre => ({ ...pre, upload: false }));
    });

    return () => {
      socket.off('document_processing_started');
      socket.off('document_processing_progress');
      socket.off('document_processing_completed');
      socket.off('upload_error');
    };
  }, [dispatch, router, setSessionId]);

  //////////////////////////////////////////////////////////// FUNCTIONS //////////////////////////////////////////////////////////////////
  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(pre => ({ ...pre, upload: true }));

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Emit upload event via socket with retry
      const uploadWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            socket.emit('upload_document', {
              file: buffer,
              filename: file.name,
              clerkId: user.id
            });
            break; // If successful, break the retry loop
          } catch (err) {
            if (i === retries - 1) throw err; // If last retry, throw the error
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Wait before retry
          }
        }
      };

      await uploadWithRetry();

    } catch (err) {
      console.error('Failed to upload document:', err);
      toast.error('Failed to upload document');
      setLoading(pre => ({ ...pre, upload: false }));
    }
  };

  const onRename = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    setLoading(pre => ({ ...pre, rename: true }));
    try {
      await dispatch(updateSession({ sessionId: id, title: newTitle }));
    } catch (err) {
      console.error('Failed to rename session:', err);
    } finally {
      setLoading(pre => ({ ...pre, rename: false }));
      setRenaming('');
    }
  };

  const onPin = async (session: Session) => {
    setLoading(pre => ({ ...pre, pin: true }));
    try {
      await dispatch(pinSession({ sessionId: session._id, isPinned: !session.isPinned }));
    } catch (err) {
      console.error('Failed to pin/unpin session:', err);
    } finally {
      setLoading(pre => ({ ...pre, pin: false }));
    }
  };

  const onChatSelect = (session: Session) => {
    if (!session) return;
    router.push('/chat?id=' + session._id);
    setSessionId(session._id);
    // setSelectedChat(session);
  };

  const onDelete = async () => {
    if (!sessionToDelete) return toast.error("No session selected to delete.");

    setLoading(pre => ({ ...pre, delete: true }));
    try {
      await dispatch(deleteSession(sessionToDelete._id));
      toast.success('Session deleted successfully');
      setSessionToDelete(null);
      setOpenDeleteModal(false);
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete session');
    } finally {
      setLoading(pre => ({ ...pre, delete: false }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(pre => ({ ...pre, upload: true }));

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Emit upload event via socket
      socket.emit('upload_document', {
        file: buffer,
        filename: file.name,
        clerkId: user.id
      });

    } catch (err) {
      console.error('Failed to upload document:', err);
      toast.error('Failed to upload document');
      setLoading(pre => ({ ...pre, upload: false }));
    }
  };

  //////////////////////////////////////////////////////////// RENDER //////////////////////////////////////////////////////////////////
  return (
    <>
      <AlertModal
        title={'Delete session'}
        description={`Are you sure you want to delete the session "${sessionToDelete?.title}"?`}
        onSubmit={onDelete}
        loading={loading.delete}
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
      />

      <aside className="col-span-4 lg:col-span-3 xl:col-span-2 px-2 border-r flex flex-col justify-between h-screen overflow-y-auto">
        <div className="flex flex-col gap-2">
          <div className="w-full flex justify-center items-center sticky top-0 bg-neutral pt-4">
            <Logo />
          </div>

          {/* File Upload Area */}
          <div
            className={`mx-2 mt-4 p-4 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={onFileUpload}
                accept=".pdf"
                disabled={loading.upload}
              />
              <div className="flex flex-col items-center justify-center">
                <Upload className={`w-8 h-8 mb-2 ${loading.upload ? 'animate-spin' : ''}`} />
                <p className="text-sm text-gray-600">
                  {loading.upload ? 'Uploading...' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports PDF, DOC, DOCX, TXT
                </p>
              </div>
            </label>
          </div>

          {/* Processing Documents */}
          {processingDocuments.length > 0 && (
            <div className="mx-2 mt-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Processing Documents</h3>
              {processingDocuments.map((doc) => (
                <div key={doc.documentId} className="p-2 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm truncate">{doc.filename || 'Processing...'}</span>
                    <span className="text-xs text-gray-500">{doc.progress}%</span>
                  </div>
                  <Progress value={doc.progress} className="h-1" />
                </div>
              ))}
            </div>
          )}

          {/* Sessions List */}
          <div className="mt-4">
            {loading.fetch ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded hover:bg-muted cursor-pointer text-sm flex justify-between items-center animate-pulse"
                >
                  <span className="h-4 bg-muted-foreground/30 rounded w-3/4"></span>
                  <div className="w-6 h-6 bg-muted-foreground/20 rounded-full"></div>
                </div>
              ))
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No sessions yet</p>
                <p className="text-sm mt-2">Upload a document to get started</p>
              </div>
            ) : (
              sessions.map((section, index) => (
                <div key={index} className="mt-4">
                  <h2 className="px-2 text-gray-400 text-sm mb-1">{section.section}</h2>
                  {section.items.map((session) => (
                    <div
                      key={session._id}
                      onClick={() => onChatSelect(session)}
                      className={`${(String(sessionId) === String(session._id) || renaming === session._id) ? 'bg-muted' : 'bg-inherit'} p-2 rounded hover:bg-muted cursor-pointer text-sm flex justify-between items-center group`}
                    >
                      {renaming === session._id ? (
                        <input
                          autoFocus
                          defaultValue={session.title}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onRename(session._id, (e.target as HTMLInputElement).value);
                            }
                          }}
                          onBlur={(e) => onRename(session._id, (e.target as HTMLInputElement).value)}
                          className={`w-full bg-transparent border border-border px-2 py-2 rounded text-sm ${loading.rename ? 'animate-pulse cursor-not-allowed' : ''
                            }`}
                          disabled={loading.rename}
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="truncate">{(session.document as Document).originalName}</span>
                          </div>
                          <div className="flex justify-end items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPin(session);
                              }}
                              className={`cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${session.isPinned ? 'text-yellow-500' : 'text-gray-400'}`}
                              disabled={loading.pin}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            <DropdownMenu >
                              <DropdownMenuTrigger asChild className="cursor-pointer">
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-5 h-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenaming(session._id); }}>
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(session); }}>
                                  {session.isPinned ? 'Unpin' : 'Pin'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSessionToDelete(session);
                                    setOpenDeleteModal(true);
                                  }}
                                  className="text-red-500"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upgrade Plan Button */}
        <div className="mt-4 border-t border-gray-700 pt-4 sticky bottom-0 bg-neutral pb-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 hover:bg-blue-50"
          >
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Upgrade Plan</span>
          </Button>
        </div>
      </aside>
    </>
  );
};

export default ChatbotSidebar;
