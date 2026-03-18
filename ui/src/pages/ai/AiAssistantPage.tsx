import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { Bot, Send, User } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hi! I\'m your CrMS AI assistant. I can help you generate content ideas, optimize your schedule, find trends, and more. What would you like to do?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Determine which agent to use based on message content
      const lower = userMessage.toLowerCase();
      let agentType = 'CONTENT_GENERATION';
      let agentInput: Record<string, unknown> = {};

      if (lower.includes('schedule') || lower.includes('best time') || lower.includes('when to post')) {
        agentType = 'SCHEDULING';
        agentInput = { platform: 'INSTAGRAM', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
      } else if (lower.includes('trend') || lower.includes('trending') || lower.includes('viral')) {
        agentType = 'TREND_DETECTION';
        agentInput = { niche: ['general'], platforms: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'] };
      } else if (lower.includes('analytics') || lower.includes('insights') || lower.includes('performance')) {
        agentType = 'ANALYTICS';
        agentInput = { period: 'week' };
      } else if (lower.includes('reply') || lower.includes('comment') || lower.includes('engage')) {
        agentType = 'ENGAGEMENT';
        agentInput = {};
      } else {
        agentInput = {
          niche: 'general',
          platform: 'INSTAGRAM',
          topic: userMessage,
          count: 3,
        };
      }

      const { data } = await api.post('/agents/run', { agentType, input: agentInput });
      const output = data.data;
      const formatted = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
      setMessages((prev) => [...prev, { role: 'ai', content: formatted }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev, { role: 'ai', content: `Sorry, I encountered an error: ${err.response?.data?.error ?? err.message}` },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>

      <Card className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        <CardContent className="flex-1 overflow-y-auto space-y-4 pb-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'ai' && (
                <div className="shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-indigo-600 animate-pulse" />
              </div>
              <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-500">Thinking...</div>
            </div>
          )}
          <div ref={endRef} />
        </CardContent>

        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask me anything — generate content, analyze trends, optimize schedule..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button onClick={send} disabled={!input.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
