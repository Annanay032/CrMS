import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { Bot, Send } from 'lucide-react';

interface Interaction {
  id: string;
  platform: string;
  interactionType: string;
  authorName?: string;
  content: string;
  sentiment?: string;
  aiSuggestion?: string;
  respondedAt?: string;
}

export function CommunityPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [, ] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchSuggestions = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/agents/engagement/suggestions', {});
      // Refresh interactions after AI processes them
      setInteractions(data.data?.suggestions?.map((s: any) => ({
        id: s.id,
        authorName: s.authorName,
        content: '',
        aiSuggestion: s.suggestedReply,
        sentiment: s.sentiment,
        platform: s.platform || 'INSTAGRAM',
        interactionType: 'COMMENT',
      })) ?? []);
    } catch { /* */ }
    setGenerating(false);
  };

  const sentimentVariant = (s?: string) => {
    if (s === 'POSITIVE') return 'success';
    if (s === 'NEGATIVE') return 'danger';
    if (s === 'QUESTION') return 'warning';
    return 'default';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Community Hub</h1>
        <Button onClick={fetchSuggestions} loading={generating}>
          <Bot className="h-4 w-4 mr-2" /> Generate Reply Suggestions
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Recent Interactions</h3>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-2">No pending interactions.</p>
              <p className="text-sm text-slate-400">Click "Generate Reply Suggestions" to let AI analyze your recent comments & DMs.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.map((i) => (
                <div key={i.id} className="p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{i.authorName ?? 'Unknown'}</span>
                      <Badge>{i.platform}</Badge>
                      <Badge>{i.interactionType}</Badge>
                      {i.sentiment && <Badge variant={sentimentVariant(i.sentiment)}>{i.sentiment}</Badge>}
                    </div>
                  </div>
                  {i.content && <p className="text-sm text-slate-700 mb-2">{i.content}</p>}
                  {i.aiSuggestion && (
                    <div className="mt-2 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-600">AI Suggested Reply</span>
                      </div>
                      <p className="text-sm">{i.aiSuggestion}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline">
                          <Send className="h-3 w-3 mr-1" /> Send
                        </Button>
                        <Button size="sm" variant="ghost">Edit</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
