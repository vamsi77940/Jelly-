import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useScheduleNotifier } from '@/lib/scheduleNotifier';

const LoginPage = lazy(() => import('@/modules/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import('@/modules/tasks/TasksPage').then(m => ({ default: m.TasksPage })));
const NotesPage = lazy(() => import('@/modules/notes/NotesPage').then(m => ({ default: m.NotesPage })));
const RemindersPage = lazy(() => import('@/modules/reminders/RemindersPage').then(m => ({ default: m.RemindersPage })));
const AssistantPage = lazy(() => import('@/modules/assistant/AssistantPage').then(m => ({ default: m.AssistantPage })));
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CalendarPage = lazy(() => import('@/modules/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })));
const HabitsPage = lazy(() => import('@/modules/habits/HabitsPage').then(m => ({ default: m.HabitsPage })));
const GoalsPage = lazy(() => import('@/modules/goals/GoalsPage').then(m => ({ default: m.GoalsPage })));
const FocusPage = lazy(() => import('@/modules/focus/FocusPage').then(m => ({ default: m.FocusPage })));
const AnalyticsPage = lazy(() => import('@/modules/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));

/** Inner component so hooks run inside the Router context */
function AppRoutes() {
  useScheduleNotifier();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AppRoutes />
    </Suspense>
  );
}
