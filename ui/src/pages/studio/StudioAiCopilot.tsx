import { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography, Avatar, Tag, Space, Divider } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot, faPaperPlane, faWandMagicSparkles, faLightbulb,
  faHashtag, faRotate, faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import styles from './StudioAiCopilot.module.scss';

const { Text } = Typography;

interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

const QUICK_ACTIONS = [
  { label: 'Generate Ideas', prompt: 'Give me 5 creative post ideas for this week', icon: faLightbulb },
  { label: 'Write Caption', prompt: 'Write a compelling Instagram caption about', icon: faWandMagicSparkles },
  { label: 'Suggest Hashtags', prompt: 'Suggest trending hashtags for a post about', icon: faHashtag },
  { label: 'Repurpose Content', prompt: 'Help me repurpose my latest post for multiple platforms', icon: faRotate },
];

const WELCOME = `I'm your Studio AI — a specialized content creation assistant. I can help you:

• **Generate post ideas** from topics or trends
• **Write captions** optimized for any platform
• **Suggest hashtags** with engagement potential
• **Repurpose content** across platforms
• **Brainstorm** creative angles and hooks

What would you like to work on?`;

export function StudioAiCopilot() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: '1', role: 'ai', content: WELCOME, timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [runAgent, { isLoading }] = useRunAgentMutation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;
    if (!text) setInput('');

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: userText, timestamp: Date.now() },
    ]);

    try {
      const result = await runAgent({
        agentType: 'CONTENT_GENERATION',
        input: {
          action: 'ideate',
          topic: userText,
          niche: 'general',
          count: 5,
        },
      }).unwrap();

      const data = result.data as { ideas?: Array<{ title?: string; body?: string; suggestedPlatforms?: string[] }> } | null;
      let responseText = '';

      if (data?.ideas?.length) {
        responseText = data.ideas.map((idea, i) => {
          let line = `**${i + 1}. ${idea.title || 'Idea'}**\n${idea.body || ''}`;
          if (idea.suggestedPlatforms?.length) {
            line += `\n_Best for: ${idea.suggestedPlatforms.join(', ')}_`;
          }
          return line;
        }).join('\n\n');
      } else {
        const raw = result.data;
        responseText = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
      }

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', content: responseText, timestamp: Date.now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', content: 'Sorry, something went wrong. Try again!', timestamp: Date.now() },
      ]);
    }
  };

  return (
    <div className={styles.copilot}>
      {/* Chat messages */}
      <div className={styles.copilot__messages}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.copilot__msg} ${styles[`copilot__msg--${msg.role}`]}`}>
            {msg.role === 'ai' && (
              <Avatar
                size={32}
                style={{ background: '#eef2ff', flexShrink: 0 }}
                icon={<FontAwesomeIcon icon={faRobot} style={{ color: '#4f46e5' }} />}
              />
            )}
            <div className={styles.copilot__bubble}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.copilot__msg} ${styles['copilot__msg--ai']}`}>
            <Avatar
              size={32}
              style={{ background: '#eef2ff', flexShrink: 0 }}
              icon={<FontAwesomeIcon icon={faRobot} style={{ color: '#4f46e5' }} />}
            />
            <div className={styles.copilot__bubble}>
              <Text type="secondary" italic>Thinking...</Text>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 2 && (
        <div className={styles.copilot__quick}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              className={styles.copilot__quick_btn}
              onClick={() => send(action.prompt)}
            >
              <FontAwesomeIcon icon={action.icon} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={styles.copilot__input}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => send()}
          placeholder="Ask me anything about content creation..."
          size="large"
          suffix={
            <Button
              type="text"
              icon={<FontAwesomeIcon icon={faPaperPlane} />}
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              style={{ color: input.trim() ? '#6366f1' : '#94a3b8' }}
            />
          }
        />
      </div>
    </div>
  );
}
