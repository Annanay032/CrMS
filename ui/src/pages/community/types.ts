export interface Interaction {
  id: string;
  platform: string;
  interactionType: string;
  authorName?: string;
  content: string;
  sentiment?: string;
  aiSuggestion?: string;
}
