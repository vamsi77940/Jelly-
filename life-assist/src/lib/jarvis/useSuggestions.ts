import { useMemo } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNudgesStore } from '@/store/useNudgesStore';
import { useDailyContext } from './contextBuilder';
import { generateSuggestions } from './suggestionRules';
import type { Suggestion } from './types';

export function useSuggestions(maxResults = 3): {
  suggestions: Suggestion[];
  dismiss: (id: string) => void;
} {
  const ctx = useDailyContext();
  const tone = useSettingsStore((s) => s.settings.assistantTone);
  const dismissedToday = useNudgesStore((s) => s.dismissedToday());
  const dismiss = useNudgesStore((s) => s.dismiss);

  const suggestions = useMemo(
    () => generateSuggestions(ctx, tone, dismissedToday, maxResults),
    [ctx, tone, dismissedToday, maxResults]
  );

  return { suggestions, dismiss };
}
