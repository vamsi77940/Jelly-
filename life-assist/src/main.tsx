import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { hydrateStorage, registerRehydrateCallback } from '@/lib/storage';
import { initializeSync } from '@/lib/sync';
import { useTasksStore } from '@/store/useTasksStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useRemindersStore } from '@/store/useRemindersStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAssistantStore } from '@/store/useAssistantStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useNudgesStore } from '@/store/useNudgesStore';
import { useNotificationLogStore } from '@/store/useNotificationLogStore';
import { usePwaStore } from '@/store/usePwaStore';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  usePwaStore.getState().setDeferredPrompt(e);
});

// Register rehydration callbacks for Firebase sync hot-reloads
registerRehydrateCallback(() => useTasksStore.getState().hydrate());
registerRehydrateCallback(() => useNotesStore.getState().hydrate());
registerRehydrateCallback(() => useRemindersStore.getState().hydrate());
registerRehydrateCallback(() => useSettingsStore.getState().hydrate());
registerRehydrateCallback(() => useAssistantStore.getState().hydrate());
registerRehydrateCallback(() => useHabitsStore.getState().hydrate());
registerRehydrateCallback(() => useGoalsStore.getState().hydrate());
registerRehydrateCallback(() => useCalendarStore.getState().hydrate());
registerRehydrateCallback(() => useScheduleStore.getState().hydrate());
registerRehydrateCallback(() => useFocusStore.getState().hydrate());
registerRehydrateCallback(() => useProgressStore.getState().hydrate());
registerRehydrateCallback(() => useNudgesStore.getState().hydrate());
registerRehydrateCallback(() => useNotificationLogStore.getState().hydrate());

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Every store reads localStorage synchronously at module-load time, which
// happens before IndexedDB hydration can finish (IndexedDB is inherently
// async). So: render a splash immediately, hydrate storage in the
// background, re-sync each store from the now-populated cache, then swap
// in the real app. Each store's `hydrate()` action re-reads exactly the
// same way its initial state did — see store/use*Store.ts.
root.render(<LoadingScreen />);

async function bootstrap() {
  await hydrateStorage();

  useTasksStore.getState().hydrate();
  useNotesStore.getState().hydrate();
  useRemindersStore.getState().hydrate();
  useSettingsStore.getState().hydrate();
  useAssistantStore.getState().hydrate();
  useHabitsStore.getState().hydrate();
  useGoalsStore.getState().hydrate();
  useCalendarStore.getState().hydrate();
  useScheduleStore.getState().hydrate();
  useFocusStore.getState().hydrate();
  useProgressStore.getState().hydrate();
  useNudgesStore.getState().hydrate();
  useNotificationLogStore.getState().hydrate();

  // Initialize Firebase Cloud Synchronization
  initializeSync();

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

void bootstrap();
