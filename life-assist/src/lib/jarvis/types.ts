export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface Suggestion {
  id: string; // stable per day, used for dismissal tracking
  text: string;
  priority: SuggestionPriority;
  actionLabel?: string;
  actionTo?: string;
}
