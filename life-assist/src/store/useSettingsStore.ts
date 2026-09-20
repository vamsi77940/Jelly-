import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';
import type { AppSettings, UserProfile } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark', // default to dark for the premium feel
  timeFormat: '12h',
  modelProvider: 'gemini',
  assistantTone: 'friendly',
  pomodoroMinutes: 25,
  breakMinutes: 5,
  learningEnabled: false,
  notificationsEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  voiceInputEnabled: true,
  voiceOutputEnabled: true,
  lowPerformanceMode: false,
};

interface SettingsState {
  profile: UserProfile;
  settings: AppSettings;
  geminiApiKey: string; // dev-only, local-only
  openAIApiKey: string;
  claudeApiKey: string;
  openRouterApiKey: string;
  ollamaEndpoint: string;
  hydrate: () => void;
  setProfileName: (name: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setApiKeys: (keys: Partial<{
    geminiApiKey: string;
    openAIApiKey: string;
    claudeApiKey: string;
    openRouterApiKey: string;
    ollamaEndpoint: string;
  }>) => void;
}

function readProfile(): UserProfile {
  return readJSON<UserProfile>('profile', { name: '', createdAt: new Date().toISOString() });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  profile: readProfile(),
  settings: readJSON<AppSettings>('settings', DEFAULT_SETTINGS),
  geminiApiKey: readJSON<string>('geminiApiKey', '') || import.meta.env.VITE_GEMINI_API_KEY || '',
  openAIApiKey: readJSON<string>('openAIApiKey', ''),
  claudeApiKey: readJSON<string>('claudeApiKey', ''),
  openRouterApiKey: readJSON<string>('openRouterApiKey', ''),
  ollamaEndpoint: readJSON<string>('ollamaEndpoint', 'http://localhost:11434'),

  hydrate: () =>
    set({
      profile: readProfile(),
      settings: readJSON<AppSettings>('settings', DEFAULT_SETTINGS),
      geminiApiKey: readJSON<string>('geminiApiKey', '') || import.meta.env.VITE_GEMINI_API_KEY || '',
      openAIApiKey: readJSON<string>('openAIApiKey', ''),
      claudeApiKey: readJSON<string>('claudeApiKey', ''),
      openRouterApiKey: readJSON<string>('openRouterApiKey', ''),
      ollamaEndpoint: readJSON<string>('ollamaEndpoint', 'http://localhost:11434'),
    }),

  setProfileName: (name) => {
    const profile = { ...get().profile, name: name.trim() };
    set({ profile });
    writeJSON('profile', profile);
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    writeJSON('settings', settings);
  },

  setApiKeys: (keys) => {
    set(keys);
    if (keys.geminiApiKey !== undefined) writeJSON('geminiApiKey', keys.geminiApiKey);
    if (keys.openAIApiKey !== undefined) writeJSON('openAIApiKey', keys.openAIApiKey);
    if (keys.claudeApiKey !== undefined) writeJSON('claudeApiKey', keys.claudeApiKey);
    if (keys.openRouterApiKey !== undefined) writeJSON('openRouterApiKey', keys.openRouterApiKey);
    if (keys.ollamaEndpoint !== undefined) writeJSON('ollamaEndpoint', keys.ollamaEndpoint);
  },
}));

// Apply theme class to HTML element
function applyTheme(theme: string) {
  const root = window.document.documentElement;
  if (
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Initial apply
applyTheme(useSettingsStore.getState().settings.theme);

// Listen for changes
useSettingsStore.subscribe((state) => {
  applyTheme(state.settings.theme);
});
