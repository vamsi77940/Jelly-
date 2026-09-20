import {
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  BellRing,
  MessagesSquare,
  CalendarDays,
  Flame,
  Target,
  BarChart3,
  Timer,
  Settings as SettingsIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  comingSoon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/reminders', label: 'Reminders', icon: BellRing },
  { to: '/assistant', label: 'Assistant', icon: MessagesSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/focus', label: 'Focus Mode', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];
