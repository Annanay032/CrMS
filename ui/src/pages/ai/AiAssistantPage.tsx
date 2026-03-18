import { useState, useRef, useEffect } from 'react';
import { Card, Button, Input, Typography, Avatar } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks/store';
import { aiTaskStarted, aiTaskCompleted, aiTaskFailed } from '@/store/ai.slice';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import type { Message } from './types';
import { WELCOME_MESSAGE, routeAgent } from './utils';
import { ChatMessage } from './components/ChatMessage';

const { Title } = Typography;

export function AiAssistantPage() {
  const dispatch = useAppDispatch();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [runAgent, { isLoading }] = useRunAgentMutation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    const { agentType, input: agentInput } = routeAgent(userMessage);
    const taskId = `page-${Date.now()}`;
    const label = agentType.replace(/_/g, ' ').toLowerCase();

    dispatch(aiTaskStarted({ id: taskId, label, agentType, startedAt: Date.now() }));

    try {
      const result = await runAgent({ agentType, input: agentInput }).unwrap();
      const output = result.data;
      const formatted = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
      setMessages((prev) => [...prev, { role: 'ai', content: formatted }]);
      dispatch(aiTaskCompleted({ id: taskId, label, agentType }));
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setMessages((prev) => [
        ...prev, { role: 'ai', content: `Sorry, I encountered an error: ${e?.data?.error ?? e?.message ?? 'Unknown error'}` },
      ]);
      dispatch(aiTaskFailed({ id: taskId, label, agentType }));
    }
  };

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 24 }}>AI Assistant</Title>

      <Card style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }} styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1, padding: 0, overflow: 'hidden' } }}>
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: 12 }}>
              <Avatar style={{ background: '#eef2ff' }} icon={<FontAwesomeIcon icon={faRobot} style={{ color: '#4f46e5' }} />} />
              <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 12, color: '#64748b', fontSize: 14 }}>Thinking...</div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={send}
            placeholder="Ask me anything — generate content, analyze trends, optimize schedule..."
            size="large"
          />
          <Button type="primary" size="large" onClick={send} disabled={!input.trim() || isLoading}
            icon={<FontAwesomeIcon icon={faPaperPlane} />} />
        </div>
      </Card>
    </div>
  );
}
