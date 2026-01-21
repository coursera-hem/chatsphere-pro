import { useParams } from 'react-router-dom';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { cn } from '@/lib/utils';

const Chat = () => {
  const { conversationId } = useParams();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          'h-full w-full shrink-0 md:w-80 lg:w-96',
          conversationId && 'hidden md:block'
        )}
      >
        <ConversationList />
      </div>

      {/* Chat Window */}
      <div
        className={cn(
          'h-full flex-1',
          !conversationId && 'hidden md:block'
        )}
      >
        <ChatWindow />
      </div>
    </div>
  );
};

export default Chat;
