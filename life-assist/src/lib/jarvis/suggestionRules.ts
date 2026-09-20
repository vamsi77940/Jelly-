import type { AssistantTone } from '@/types';
import type { DailyContext } from './contextBuilder';
import type { Suggestion, SuggestionPriority } from './types';

type ToneVariants = Record<AssistantTone, string>;

function pick(tone: AssistantTone, variants: ToneVariants): string {
  return variants[tone];
}

function make(
  key: string,
  priority: SuggestionPriority,
  text: string,
  action?: { label: string; to: string }
): Suggestion {
  return {
    id: key,
    priority,
    text,
    actionLabel: action?.label,
    actionTo: action?.to,
  };
}

type Rule = (ctx: DailyContext, tone: AssistantTone) => Suggestion | null;

const overdueTasksRule: Rule = (ctx, tone) => {
  if (ctx.tasksOverdue.length === 0) return null;
  const n = ctx.tasksOverdue.length;
  const text = pick(tone, {
    professional: `You have ${n} overdue task${n > 1 ? 's' : ''}. Recommend reviewing and rescheduling.`,
    friendly: `Heads up — ${n} task${n > 1 ? 's are' : ' is'} overdue. Want to take a look?`,
    humorous: `${n} task${n > 1 ? 's have' : ' has'} been quietly judging you from the overdue pile.`,
    motivational: `${n} overdue task${n > 1 ? 's' : ''} — clearing even one now builds momentum for the rest.`,
  });
  return make('overdue', 'high', text, { label: 'Review tasks', to: '/tasks' });
};

const goalDeadlineRule: Rule = (ctx, tone) => {
  if (ctx.goalsNearDeadline.length === 0) return null;
  const goal = ctx.goalsNearDeadline[0];
  const text = pick(tone, {
    professional: `"${goal.title}" is due soon. Recommend prioritizing its remaining milestones today.`,
    friendly: `"${goal.title}" is coming up soon — might be worth some attention today.`,
    humorous: `"${goal.title}" is sneaking up on the calendar. It would like a word.`,
    motivational: `"${goal.title}" is close on both fronts — the deadline and the finish line. Push today.`,
  });
  return make(`goal-${goal.id}`, 'high', text, { label: 'View goal', to: '/goals' });
};

const morningTomorrowRule: Rule = (ctx, tone) => {
  if (ctx.hour >= 12 || ctx.tasksDueTomorrow.length === 0) return null;
  const task = ctx.tasksDueTomorrow[0];
  const text = pick(tone, {
    professional: `Good morning. "${task.title}" is due tomorrow — consider starting today.`,
    friendly: `Good morning! "${task.title}" is due tomorrow. Getting a head start today could help.`,
    humorous: `Morning! "${task.title}" is due tomorrow, which future-you will definitely thank present-you for starting.`,
    motivational: `Good morning! "${task.title}" is due tomorrow — let's get ahead of it today.`,
  });
  return make(`tomorrow-${task.id}`, 'medium', text, { label: 'Open tasks', to: '/tasks' });
};

const progressCheckpointRule: Rule = (ctx, tone) => {
  if (ctx.totalTasks === 0 || ctx.percentComplete < 50 || ctx.percentComplete >= 100) return null;
  const text = pick(tone, {
    professional: `${ctx.percentComplete}% of tasks are complete. Recommend finishing one more to maintain momentum.`,
    friendly: `You're at ${ctx.percentComplete}% done with your tasks — one more and you're over the hump.`,
    humorous: `${ctx.percentComplete}% done. The remaining tasks are staring at you specifically.`,
    motivational: `${ctx.percentComplete}% complete. Finish one more task and feel that streak build.`,
  });
  return make('progress-checkpoint', 'medium', text, { label: 'View tasks', to: '/tasks' });
};

const allDoneRule: Rule = (ctx, tone) => {
  if (ctx.totalTasks === 0 || ctx.percentComplete < 100) return null;
  const text = pick(tone, {
    professional: 'All tasks for today are complete. Well executed.',
    friendly: "Everything's done today — nice work!",
    humorous: 'Inbox zero, task-list zero. Physically impossible? Apparently not.',
    motivational: "100% complete. That's a full day earned — enjoy it.",
  });
  return make('all-done', 'low', text);
};

const habitReminderRule: Rule = (ctx, tone) => {
  if (ctx.habitsUncheckedToday.length === 0) return null;
  const habit = ctx.habitsUncheckedToday[0];
  const text = pick(tone, {
    professional: `Habit "${habit.name}" has not been logged today. Recommend a quick check-in to stay on track.`,
    friendly: `Still haven't checked off "${habit.name}" today — quick check-in?`,
    humorous: `"${habit.name}" is waiting. Check it off to satisfy the consistency grid.`,
    motivational: `Keep the chain going! Complete "${habit.name}" today to protect your streak.`,
  });
  return make(`habit-reminder:${habit.id}`, 'medium', text, { label: 'Complete', to: '/habits' });
};

const streakEncouragementRule: Rule = (ctx, tone) => {
  if (ctx.currentStreak === 0 || ctx.xpEarnedToday > 0 || ctx.hour < 17) return null;
  const text = pick(tone, {
    professional: `Current streak: ${ctx.currentStreak} days. No activity logged yet today.`,
    friendly: `You're on a ${ctx.currentStreak}-day streak — a quick task or habit today keeps it going.`,
    humorous: `${ctx.currentStreak} days strong, and today's showing up a little quiet.`,
    motivational: `${ctx.currentStreak} days of momentum. One small win today keeps it alive.`,
  });
  return make('streak-nudge', 'medium', text, { label: 'View dashboard', to: '/' });
};

const inactivityRule: Rule = (ctx, tone) => {
  if (ctx.hour < 9 || ctx.hour > 21) return null;
  if (ctx.lastActivityHoursAgo === null || ctx.lastActivityHoursAgo < 2) return null;
  const hrs = Math.floor(ctx.lastActivityHoursAgo);
  const text = pick(tone, {
    professional: `No completed items in the last ${hrs}+ hours. Suggest a short focus session to re-engage.`,
    friendly: `It's been a couple of hours since your last completed item. A quick 20-minute session could help.`,
    humorous: `It's been quiet for ${hrs}+ hours. Even a small task would break the silence.`,
    motivational: `${hrs}+ quiet hours — a short focus session now keeps today's momentum alive.`,
  });
  return make('inactivity', 'low', text, { label: 'Start focus session', to: '/focus' });
};

const windDownRule: Rule = (ctx, tone) => {
  if (ctx.hour < 21) return null;
  if (ctx.tasksDueToday.length === 0 && !ctx.morningAlarmTime) return null;
  const alarmPart = ctx.morningAlarmTime ? ` (wake-up is set for ${ctx.morningAlarmTime})` : '';
  const text = pick(tone, {
    professional: `${ctx.tasksDueToday.length} task${ctx.tasksDueToday.length === 1 ? '' : 's'} still open today${alarmPart}. Recommend wrapping up soon.`,
    friendly: `Getting late — worth wrapping up soon${alarmPart}?`,
    humorous: `The day is trying to end. It would appreciate your cooperation${alarmPart}.`,
    motivational: `Strong finish or fresh start tomorrow${alarmPart} — either way, wrap up on your terms.`,
  });
  return make('wind-down', 'low', text);
};

const RULES: Rule[] = [
  overdueTasksRule,
  goalDeadlineRule,
  morningTomorrowRule,
  progressCheckpointRule,
  allDoneRule,
  habitReminderRule,
  streakEncouragementRule,
  inactivityRule,
  windDownRule,
];

const PRIORITY_WEIGHT: Record<SuggestionPriority, number> = { high: 0, medium: 1, low: 2 };

/**
 * Runs every rule, drops anything already dismissed today, and caps the
 * result — this is the "avoid notification spam" mechanism from the brief:
 * however many rules fire, only the top few most important ever surface.
 */
export function generateSuggestions(
  ctx: DailyContext,
  tone: AssistantTone,
  dismissedIds: Set<string>,
  maxResults = 3
): Suggestion[] {
  return RULES.map((rule) => rule(ctx, tone))
    .filter((s): s is Suggestion => s !== null && !dismissedIds.has(s.id))
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
    .slice(0, maxResults);
}
