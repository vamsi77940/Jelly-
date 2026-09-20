import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAssistantStore } from '@/store/useAssistantStore';
import { useDailyContext } from '@/lib/jarvis/contextBuilder';
import { JarvisPanel } from '@/components/JarvisPanel';
import { ChatWindow } from './ChatWindow';

export function AssistantPage() {
  const sendMessage = useAssistantStore((s) => s.sendMessage);
  const ctx = useDailyContext();

  function startProgressDiscussion() {
    const summary = [
      `${ctx.percentComplete}% of my tasks are done`,
      ctx.tasksOverdue.length > 0 ? `${ctx.tasksOverdue.length} tasks are overdue` : null,
      ctx.currentStreak > 0 ? `I'm on a ${ctx.currentStreak}-day streak` : null,
      ctx.focusSessionsToday > 0 ? `${ctx.focusSessionsToday} focus session(s) done today` : null,
    ]
      .filter(Boolean)
      .join(', ');
    void sendMessage(
      `Here's where I'm at today: ${summary}. Give me a short, honest check-in and one concrete suggestion for what to do next.`
    );
  }

  return (
    <div className="space-y-8 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-semibold tracking-tight">Assistant</h1>
      </div>

      <JarvisPanel emptyText="Nothing urgent right now — you're on top of things." />

      <Card>
        <h3 className="font-display font-medium text-lg mb-2 tracking-tight">Daily progress discussion</h3>
        <p className="text-sm text-ink-muted mb-5 leading-relaxed">
          Get a read on today's progress and a suggestion for what to do next.
        </p>
        <Button variant="secondary" onClick={startProgressDiscussion}>
          Start discussion
        </Button>
      </Card>

      <div>
        <h3 className="font-display font-medium text-lg mb-4 tracking-tight">Conversation</h3>
        <ChatWindow />
      </div>
    </div>
  );
}
