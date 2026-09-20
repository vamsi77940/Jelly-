import type { ChatMessage } from '@/types';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-accent-cyan text-base-bg rounded-br-sm'
            : 'bg-base-raised text-ink-primary rounded-bl-sm'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
