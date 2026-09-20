import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';
import { createId } from '@/lib/id';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTasksStore } from '@/store/useTasksStore';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useRemindersStore } from '@/store/useRemindersStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useUIStore } from '@/store/useUIStore';
import { GeminiDevClient } from '@/lib/ai/geminiDevClient';
import { SecureBackendClient } from '@/lib/ai/secureBackendClient';
import { UnconfiguredAiClient } from '@/lib/ai/types';
import type { AiClient } from '@/lib/ai/types';
import type { ChatMessage } from '@/types';

import { StubClient } from '@/lib/ai/stubClients';

export function getClient(): AiClient {
  const backendUrl = import.meta.env.VITE_ASSISTANT_API_URL;
  if (backendUrl && backendUrl.trim().length > 0) {
    return new SecureBackendClient(backendUrl);
  }

  const state = useSettingsStore.getState();
  const provider = state.settings.modelProvider;

  if (provider === 'gemini') {
    return state.geminiApiKey ? new GeminiDevClient(state.geminiApiKey) : new UnconfiguredAiClient();
  }
  
  if (provider === 'openai') return new StubClient('OpenAI');
  if (provider === 'claude') return new StubClient('Claude');
  if (provider === 'openrouter') return new StubClient('OpenRouter');
  if (provider === 'ollama') return new StubClient('Ollama');

  return new UnconfiguredAiClient();
}

interface AssistantState {
  messages: ChatMessage[];
  isThinking: boolean;
  error: string | null;
  isVoiceModeOpen: boolean;
  hydrate: () => void;
  setVoiceMode: (open: boolean) => void;
  sendMessage: (prompt: string) => Promise<void>;
  clearConversation: () => void;
}

function persist(messages: ChatMessage[]) {
  writeJSON('assistantMessages', messages);
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Hello, I'm Jelly, your AI personal assistant. Tell me about your day or ask me to schedule tasks, habits, and goals for you.",
  timestamp: new Date(0).toISOString(),
};

export const useAssistantStore = create<AssistantState>((set, get) => ({
  messages: readJSON<ChatMessage[]>('assistantMessages', [WELCOME]),
  isThinking: false,
  error: null,
  isVoiceModeOpen: false,

  hydrate: () => set({ messages: readJSON<ChatMessage[]>('assistantMessages', [WELCOME]) }),

  setVoiceMode: (open) => set({ isVoiceModeOpen: open }),

  sendMessage: async (prompt) => {
    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      text: prompt,
      timestamp: new Date().toISOString(),
    };
    const withUser = [...get().messages, userMsg];
    set({ messages: withUser, isThinking: true, error: null });
    persist(withUser);

    try {
      const client = getClient();
      const history = withUser
        .filter((m) => m.id !== 'welcome')
        .slice(-5) // Slice history to last 5 messages to limit token context and prevent learning long story styles
        .map((m) => ({ role: m.role === 'user' ? ('user' as const) : ('model' as const), text: m.text }));
        
      const tools = [
        {
          name: 'getCurrentDate',
          description: 'Returns the current system date and time. Use this when the user mentions relative dates like "today", "tomorrow", "this week", "next Monday" to compute absolute YYYY-MM-DD values.',
          parameters: {
            type: 'object',
            properties: {}
          },
          execute: () => {
            const now = new Date();
            return `Today's date is ${now.toISOString().split('T')[0]}, local time is ${now.toLocaleTimeString()}.`;
          }
        },
        {
          name: 'addDayToDayGoal',
          description: 'Adds a day-to-day goal or task for the user for today.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The title of the task.' },
              priority: { type: 'string', description: 'The priority of the task. Can be high, medium, or low.' }
            },
            required: ['title']
          },
          execute: (args: any) => {
            const task = useTasksStore.getState().addTask({
              title: args.title,
              priority: args.priority || 'medium',
              dueDate: new Date().toISOString().split('T')[0],
              dueTime: null
            });
            return `Task "${task.title}" added successfully for today.`;
          }
        },
        {
          name: 'addTask',
          description: 'Adds a task/to-do item with a specific due date and priority.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The title of the task.' },
              dueDate: { type: 'string', description: 'The due date in YYYY-MM-DD format.' },
              dueTime: { type: 'string', description: 'The due time in HH:mm 24-hour format (optional).', nullable: true },
              priority: { type: 'string', description: 'The priority of the task. Can be high, medium, or low.' }
            },
            required: ['title', 'dueDate']
          },
          execute: (args: any) => {
            const task = useTasksStore.getState().addTask({
              title: args.title,
              priority: args.priority || 'medium',
              dueDate: args.dueDate,
              dueTime: args.dueTime || null
            });
            return `Task "${task.title}" added successfully for date ${task.dueDate}.`;
          }
        },
        {
          name: 'addCalendarEvent',
          description: 'Adds an event to the calendar on a specific date.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The title of the calendar event.' },
              date: { type: 'string', description: 'The date in YYYY-MM-DD format.' },
              time: { type: 'string', description: 'The time in HH:mm 24-hour format (optional).', nullable: true },
              category: { type: 'string', description: 'The event category. Can be personal, work, health, study, or other.' }
            },
            required: ['title', 'date', 'category']
          },
          execute: (args: any) => {
            const event = useCalendarStore.getState().addEvent({
              title: args.title,
              date: args.date,
              time: args.time || null,
              category: args.category || 'other'
            });
            return `Calendar event "${event.title}" scheduled for ${event.date} at ${event.time || 'all day'}.`;
          }
        },
        {
          name: 'alterScheduleGoal',
          description: 'Adds a long-term schedule goal with milestones.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The title of the goal.' },
              milestones: {
                type: 'array',
                items: { type: 'string' },
                description: 'A list of milestone steps to achieve this goal.'
              }
            },
            required: ['title', 'milestones']
          },
          execute: (args: any) => {
            const goal = useGoalsStore.getState().addGoal({
              title: args.title,
              goalType: 'ongoing',
              targetDate: null,
              weekOf: null,
              monthOf: null,
              milestoneTexts: args.milestones || [],
              autoReschedule: false,
            });
            return `Goal "${goal.title}" created with ${goal.milestones.length} milestones.`;
          }
        },
        {
          name: 'addReminder',
          description: 'Sets a custom alarm or reminder for the user at a specific time.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The title of the reminder/alarm.' },
              time: { type: 'string', description: 'The time in HH:mm 24-hour format.' },
              repeat: { type: 'string', description: 'Repeat frequency: once, daily, weekdays, weekends, weekly, or monthly.' }
            },
            required: ['title', 'time']
          },
          execute: (args: any) => {
            const repeatVal = args.repeat || 'once';
            const alarm = useRemindersStore.getState().addAlarm({
              title: args.title,
              time: args.time,
              repeat: repeatVal
            });
            return `Reminder "${alarm.title}" set for ${alarm.time} (Repeats: ${alarm.repeat}).`;
          }
        },
        {
          name: 'completeHabit',
          description: 'Marks a habit as completed/checked-in for today or a specific date.',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'The name of the habit (e.g. Gym, Reading).' },
              date: { type: 'string', description: 'The date in YYYY-MM-DD format (optional, defaults to today).' }
            },
            required: ['name']
          },
          execute: (args: any) => {
            const habitsStore = useHabitsStore.getState();
            const progressStore = useProgressStore.getState();
            const uiStore = useUIStore.getState();
            
            const searchName = args.name.toLowerCase().trim();
            const habit = habitsStore.habits.find(h => h.name.toLowerCase().includes(searchName));
            
            if (!habit) {
              return `Habit "${args.name}" not found. You can create a new habit by asking me.`;
            }
            
            const dateStr = args.date || new Date().toISOString().split('T')[0];
            const alreadyChecked = habit.checkIns.includes(dateStr);
            
            if (!alreadyChecked) {
              habitsStore.toggleDate(habit.id, dateStr);
              progressStore.addXp(5);
              uiStore.showToast(`"${habit.name}" completed! (+5 XP)`, 'success');
              return `Successfully marked "${habit.name}" as completed for ${dateStr} and awarded 5 XP.`;
            }
            
            return `"${habit.name}" was already marked as completed for ${dateStr}.`;
          }
        },
        {
          name: 'addHabit',
          description: 'Creates a new habit to track with a target frequency per week and color.',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'The name of the habit (e.g. Drink Water).' },
              targetPerWeek: { type: 'number', description: 'Target times per week, from 1 to 7. Defaults to 7.' },
              color: { type: 'string', description: 'Color theme: cyan, amber, mint, or rose. Defaults to cyan.' }
            },
            required: ['name']
          },
          execute: (args: any) => {
            const habitsStore = useHabitsStore.getState();
            const uiStore = useUIStore.getState();
            
            const color = ['cyan', 'amber', 'mint', 'rose'].includes(args.color) ? args.color : 'cyan';
            const target = args.targetPerWeek ? Math.max(1, Math.min(7, args.targetPerWeek)) : 7;
            
            const newHabit = habitsStore.addHabit({
              name: args.name,
              targetPerWeek: target,
              color: color as 'cyan' | 'amber' | 'mint' | 'rose'
            });
            
            uiStore.showToast(`New habit "${newHabit.name}" created!`, 'success');
            return `Successfully created a new habit: "${newHabit.name}" (Target: ${target}/week, Color: ${color}).`;
          }
        },
        {
          name: 'addWeeklyGoal',
          description: 'Creates a weekly goal that tracks progress for a specific week with optional milestones and auto-reschedule.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The title of the weekly goal.' },
              weekOf: { type: 'string', description: 'ISO date of the Monday for the target week, e.g. 2026-07-21. Defaults to current week.' },
              milestones: { type: 'array', items: { type: 'string' }, description: 'List of milestone steps.' },
              autoReschedule: { type: 'boolean', description: 'If true, rolls incomplete goal to next week automatically.' }
            },
            required: ['title']
          },
          execute: (args: any) => {
            // Compute this Monday
            const d = new Date();
            const day = d.getDay();
            const diff = (day === 0 ? -6 : 1) - day;
            d.setDate(d.getDate() + diff);
            const monday = args.weekOf || d.toISOString().split('T')[0];

            const goal = useGoalsStore.getState().addGoal({
              title: args.title,
              goalType: 'weekly',
              targetDate: null,
              weekOf: monday,
              monthOf: null,
              milestoneTexts: args.milestones || [],
              autoReschedule: args.autoReschedule !== false,
            });
            useUIStore.getState().showToast(`Weekly goal "${goal.title}" created! 📅`, 'success');
            return `Weekly goal "${goal.title}" created for week of ${monday} with ${goal.milestones.length} milestones.`;
          }
        },
        {
          name: 'addMonthlyGoal',
          description: 'Creates a monthly goal for a specific calendar month.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The title of the monthly goal.' },
              monthOf: { type: 'string', description: 'Target month in YYYY-MM format, e.g. 2026-07.' },
              milestones: { type: 'array', items: { type: 'string' }, description: 'List of milestone steps.' },
              autoReschedule: { type: 'boolean', description: 'If true, rolls to next month if incomplete.' }
            },
            required: ['title']
          },
          execute: (args: any) => {
            const monthOf = args.monthOf || new Date().toISOString().slice(0, 7);
            const goal = useGoalsStore.getState().addGoal({
              title: args.title,
              goalType: 'monthly',
              targetDate: null,
              weekOf: null,
              monthOf,
              milestoneTexts: args.milestones || [],
              autoReschedule: args.autoReschedule !== false,
            });
            useUIStore.getState().showToast(`Monthly goal "${goal.title}" created! 🗓️`, 'success');
            return `Monthly goal "${goal.title}" created for ${monthOf} with ${goal.milestones.length} milestones.`;
          }
        },
        {
          name: 'analyzeProgress',
          description: 'Analyzes the user\'s current goals progress and returns a summary with suggestions.',
          parameters: { type: 'object', properties: {} },
          execute: () => {
            const goals = useGoalsStore.getState().goals.filter(g => !g.archived);
            if (goals.length === 0) return 'You have no active goals yet.';
            const lines = goals.map(g => {
              const pct = g.milestones.length === 0 ? 0
                : Math.round((g.milestones.filter(m => m.completed).length / g.milestones.length) * 100);
              return `- "${g.title}" [${g.goalType}]: ${pct}% complete`;
            });
            return `Current goal progress:\n${lines.join('\n')}\n\nTip: Ask me to reschedule any overdue goals or generate a new week plan.`;
          }
        },
        {
          name: 'rescheduleGoal',
          description: 'Reschedules an incomplete weekly or monthly goal to the next period.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The partial or full title of the goal to reschedule.' }
            },
            required: ['title']
          },
          execute: (args: any) => {
            const goalsStore = useGoalsStore.getState();
            const search = args.title.toLowerCase();
            const goal = goalsStore.goals.find(g => g.title.toLowerCase().includes(search) && !g.archived);
            if (!goal) return `Goal matching "${args.title}" not found.`;

            const today = new Date();
            if (goal.goalType === 'weekly') {
              // Move to next Monday
              const d = new Date(today);
              const day = d.getDay();
              d.setDate(d.getDate() + (7 - (day === 0 ? 7 : day) + 1));
              const nextMon = d.toISOString().split('T')[0];
              return `Goal "${goal.title}" rescheduled to week of ${nextMon}. Reload the app to see the update.`;
            }
            if (goal.goalType === 'monthly') {
              return `Goal "${goal.title}" will roll to next month automatically on the next app load if auto-reschedule is on.`;
            }
            return `Goal "${goal.title}" is an ongoing goal — update its target date manually.`;
          }
        }

      ];

      let responseText = await client.send(history.slice(0, -1), prompt, tools);

      // Strict brevity override: if response is too long, truncate to 2 sentences max
      if (responseText.length > 250) {
        const cleanResponse = responseText
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`[^`]+`/g, '')
          .replace(/[*#_\->[\]()|:]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const sentences = cleanResponse.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
        if (sentences.length > 2) {
          responseText = sentences.slice(0, 2).join('. ') + '. I have successfully scheduled and created the requested updates, sir.';
        } else {
          responseText = cleanResponse;
        }
      }

      const assistantMsg: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toISOString(),
      };
      const withReply = [...withUser, assistantMsg];
      set({ messages: withReply, isThinking: false });
      persist(withReply);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      set({ isThinking: false, error: message });
    }
  },

  clearConversation: () => {
    set({ messages: [WELCOME], error: null });
    persist([WELCOME]);
  },
}));
