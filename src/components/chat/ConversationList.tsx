import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversations, useCreateConversation } from '@/hooks/useConversations';
import { useAllProfiles } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, MessageCircle, Settings, LogOut, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Link } from 'react-router-dom';

export const ConversationList = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const { data: profiles } = useAllProfiles();
  const { data: isAdmin } = useIsAdmin();
  const createConversation = useCreateConversation();
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);

  const filteredConversations = conversations?.filter((conv) =>
    conv.other_user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableUsers = profiles?.filter(
    (p) => p.id !== user?.id && !conversations?.some((c) => c.other_user?.id === p.id)
  );

  const handleStartChat = async (userId: string) => {
    const conversation = await createConversation.mutateAsync(userId);
    setNewChatOpen(false);
    navigate(`/chat/${conversation.id}`);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h1 className="text-xl font-semibold text-foreground">Chats</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <Shield className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10"
          />
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-2">
        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" size="sm">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a new conversation</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-80">
              <div className="space-y-2">
                {availableUsers?.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No users available to chat with
                  </p>
                ) : (
                  availableUsers?.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleStartChat(profile.id)}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(profile.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.username || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{profile.about}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <AnimatePresence>
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg p-3">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm text-muted-foreground">Start a new chat to begin messaging</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations?.map((conv) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all',
                    conversationId === conv.id
                      ? 'bg-primary/10'
                      : 'hover:bg-accent'
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(conv.other_user?.username || null)}
                      </AvatarFallback>
                    </Avatar>
                    {conv.other_user?.is_online && (
                      <span className="online-dot absolute bottom-0 right-0" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">
                        {conv.other_user?.username || 'Unknown'}
                      </p>
                      {conv.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.last_message.created_at), {
                            addSuffix: false,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-muted-foreground">
                        {conv.last_message?.message_type === 'image'
                          ? '📷 Photo'
                          : conv.last_message?.message_type === 'file'
                          ? '📎 File'
                          : conv.last_message?.content || 'No messages yet'}
                      </p>
                      {(conv.unread_count ?? 0) > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};
