import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessages, useSendMessage, Message } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, X, Loader2, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const ChatWindow = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: messages, isLoading: messagesLoading } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const sendMessage = useSendMessage();
  const { uploadFile, uploading } = useFileUpload();
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations?.find((c) => c.id === conversationId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [selectedFile]);

  const handleSend = async () => {
    if (!conversationId || (!newMessage.trim() && !selectedFile)) return;

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let messageType = 'text';

    if (selectedFile) {
      const result = await uploadFile(selectedFile);
      if (result) {
        fileUrl = result.url;
        fileName = result.name;
        messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      }
    }

    await sendMessage.mutateAsync({
      conversationId,
      content: newMessage.trim() || undefined,
      messageType,
      fileUrl,
      fileName,
    });

    setNewMessage('');
    setSelectedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage = false) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach((msg) => {
      const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-chat-wallpaper p-8 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Send className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Select a conversation</h2>
        <p className="mt-2 text-muted-foreground">
          Choose from your existing conversations or start a new one
        </p>
      </div>
    );
  }

  const messageGroups = messages ? groupMessagesByDate(messages) : {};

  return (
    <div className="flex h-full flex-col bg-chat-wallpaper">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/chat')}
          className="md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation?.other_user?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(conversation?.other_user?.username || null)}
            </AvatarFallback>
          </Avatar>
          {conversation?.other_user?.is_online && (
            <span className="online-dot absolute bottom-0 right-0" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{conversation?.other_user?.username || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">
            {conversation?.other_user?.is_online ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messagesLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date}>
                <div className="mb-4 flex justify-center">
                  <span className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </span>
                </div>
                <AnimatePresence>
                  {msgs.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === user?.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* File Preview */}
      {selectedFile && (
        <div className="border-t border-border bg-card p-3">
          <div className="relative inline-block">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-20 w-20 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                <Paperclip className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{selectedFile.name}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e)}
            className="hidden"
          />
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            onChange={(e) => handleFileSelect(e, true)}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="message-input flex-1"
            disabled={uploading}
          />
          <Button
            onClick={handleSend}
            disabled={(!newMessage.trim() && !selectedFile) || uploading || sendMessage.isPending}
            size="icon"
            className="shrink-0"
          >
            {uploading || sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn('mb-2 flex', isOwn ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[75%] px-4 py-2',
          isOwn ? 'chat-bubble-sent' : 'chat-bubble-received'
        )}
      >
        {message.message_type === 'image' && message.file_url && (
          <img
            src={message.file_url}
            alt="Shared image"
            className="mb-2 max-h-64 rounded-lg object-contain"
          />
        )}
        {message.message_type === 'file' && message.file_url && (
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 flex items-center gap-2 text-primary hover:underline"
          >
            <Paperclip className="h-4 w-4" />
            {message.file_name || 'Download file'}
          </a>
        )}
        {message.content && <p className="break-words">{message.content}</p>}
        <div className={cn('mt-1 flex items-center gap-1', isOwn ? 'justify-end' : 'justify-start')}>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {isOwn && (
            message.is_read ? (
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Check className="h-3.5 w-3.5 text-muted-foreground" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};
