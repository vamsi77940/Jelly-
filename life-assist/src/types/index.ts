export type Priority = 'low' | 'medium' | 'high';

export type TaskRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  dueDate: string | null; // ISO date, e.g. 2026-07-15
  dueTime: string | null; // HH:mm
  priority: Priority;
  repeat: TaskRepeat; // added for Phase B
  completed: boolean;
  createdAt: string; // ISO timestamp
  completedAt: string | null;
}

export type NoteCategory = 'general' | 'study' | 'work' | 'personal' | 'idea';

export interface Note {
  id: string;
  title: string;
  content: string; // HTML content from TipTap
  category: NoteCategory;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AlarmRepeat = 'once' | 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'monthly';

export interface Alarm {
  id: string;
  title: string;
  time: string; // HH:mm
  repeat: AlarmRepeat;
  enabled: boolean;
  createdAt: string; // ISO timestamp
  linkedTaskId?: string;
}

export interface MorningAlarm {
  time: string;
  enabled: boolean;
}

export type AssistantTone = 'professional' | 'friendly' | 'humorous' | 'motivational';

export interface UserProfile {
  name: string;
  createdAt: string;
}

export type ThemePreference = 'light' | 'dark' | 'system';
export type TimeFormat = '12h' | '24h';
export type ModelProvider = 'gemini' | 'openai' | 'claude' | 'openrouter' | 'ollama';

export interface AppSettings {
  theme: ThemePreference;
  timeFormat: TimeFormat;
  modelProvider: ModelProvider;
  assistantTone: AssistantTone;
  pomodoroMinutes: number;
  breakMinutes: number;
  learningEnabled: boolean; // opt-in: assistant may learn routines
  notificationsEnabled: boolean;
  quietHoursStart: string; // HH:mm — no real OS notifications sent after this
  quietHoursEnd: string; // HH:mm — resume sending after this
  voiceInputEnabled: boolean; // opt-in: mic button appears in the chat composer
  voiceOutputEnabled: boolean; // opt-in: assistant replies are read aloud
  lowPerformanceMode: boolean; // toggle to disable heavy 3D WebGL animations
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: string;
}

export interface Habit {
  id: string;
  name: string;
  targetPerWeek: number; // e.g. 7 = daily, 3 = three times a week
  color: 'cyan' | 'amber' | 'mint' | 'rose';
  createdAt: string;
  checkIns: string[]; // ISO dates (yyyy-mm-dd) the habit was marked done
}


export type GoalType = 'ongoing' | 'weekly' | 'monthly';

export interface GoalMilestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  goalType: GoalType;
  targetDate: string | null;
  weekOf: string | null;    // ISO Monday of the target week e.g. "2026-07-21"
  monthOf: string | null;   // "YYYY-MM" e.g. "2026-07"
  milestones: GoalMilestone[];
  createdAt: string;
  archived: boolean;
  autoReschedule: boolean;
  scheduledEventIds: string[];
}

export type EventCategory = 'work' | 'personal' | 'health' | 'study' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date yyyy-mm-dd
  time: string | null; // HH:mm
  category: EventCategory;
  createdAt: string;
}

export type ScheduleBlockType = 'goal-session' | 'study' | 'personal' | 'break';

export interface ScheduleBlock {
  id: string;
  title: string;
  type: ScheduleBlockType;
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:mm
  endTime: string;      // HH:mm
  linkedGoalId: string | null;
  notes: string;
  createdAt: string;
  aiGenerated: boolean;
  done: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'default' | 'success' | 'warning';
}
