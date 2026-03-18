import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faXmark,
  faPaperPlane,
  faUser,
  faWandMagicSparkles,
  faChartLine,
  faArrowTrendUp,
  faCalendarDays,
  faComments,
  faLightbulb,
  faChevronRight,
  faClockRotateLeft,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { useAppSelector, useAppDispatch } from '@/hooks/store';
import {
  toggleAssistant,
  closeAssistant,
  aiTaskStarted,
  aiTaskCompleted,
  aiTaskFailed,
} from '@/store/ai.slice';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import { routeAgent } from '@/pages/ai/utils';
import type { Message } from '@/pages/ai/types';
import styles from './FloatingAiAssistant.module.scss';

type Tab = 'chat' | 'actions' | 'activity';

const QUICK_ACTIONS = [
  {
    id: 'content',
    icon: faWandMagicSparkles,
    iconBg: '#eef2ff',
    iconColor: '#4f46e5',
    title: 'Generate Content Ideas',
    desc: 'AI-powered captions, hooks & hashtags',
    prompt: 'Give me 3 creative content ideas for Instagram',
  },
  {
    id: 'trends',
    icon: faArrowTrendUp,
    iconBg: '#faf5ff',
    iconColor: '#9333ea',
    title: 'Spot Trends',
    desc: "Discover what's trending in your niche",
    prompt: 'What are the latest trending topics on social media?',
  },
  {
    id: 'analytics',
    icon: faChartLine,
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    title: 'Analyze Performance',
    desc: 'Get insights on your recent posts',
    prompt: 'Analyze my content performance for this week',
  },
  {
    id: 'schedule',
    icon: faCalendarDays,
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    title: 'Optimize Schedule',
    desc: 'Best times to post for max reach',
    prompt: 'When is the best time for me to post today?',
  },
  {
    id: 'engage',
    icon: faComments,
    iconBg: '#fef2f2',
    iconColor: '#dc2626',
    title: 'Engagement Suggestions',
    desc: 'AI-crafted reply & comment ideas',
    prompt: 'Give me engagement suggestions for my latest comments',
  },
  {
    id: 'tips',
    icon: faLightbulb,
    iconBg: '#fefce8',
    iconColor: '#ca8a04',
    title: 'Creator Tips',
    desc: 'Personalized growth recommendations',
    prompt: 'What are some tips to grow my social media presence?',
  },
];

const MINI_WELCOME = "Hey! I'm your AI assistant. Ask me anything or use quick actions.";

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function FloatingAiAssistant() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAssistantOpen, activeTasks, activityLog } = useAppSelector((s) => s.ai);
  const isAiBusy = activeTasks.length > 0;

  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: MINI_WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [runAgent, { isLoading }] = useRunAgentMutation();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isAssistantOpen && tab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isAssistantOpen, tab]);

  // Close panel on route change (optional UX)
  // Disabled to keep it persistent — uncomment to auto-close:
  // useEffect(() => { dispatch(closeAssistant()); }, [location.pathname]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage = text.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    const taskId = `mini-${Date.now()}`;
    const { agentType, input: agentInput } = routeAgent(userMessage);
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
        ...prev,
        { role: 'ai', content: `Sorry, something went wrong: ${e?.data?.error ?? e?.message ?? 'Unknown error'}` },
      ]);
      dispatch(aiTaskFailed({ id: taskId, label, agentType }));
    }
  }, [isLoading, runAgent, dispatch]);

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setTab('chat');
    sendMessage(prompt);
  };

  const handleExpandChat = () => {
    dispatch(closeAssistant());
    navigate('/ai');
  };

  // Hide FAB on the dedicated /ai page
  if (location.pathname === '/ai') return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`${styles.fab} ${isAssistantOpen ? styles['fab--active'] : ''}`}
        onClick={() => dispatch(toggleAssistant())}
        aria-label={isAssistantOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        <FontAwesomeIcon icon={isAssistantOpen ? faXmark : faRobot} />
        {isAiBusy && !isAssistantOpen && <span className={styles.fab__pulse} />}
      </button>

      {/* Panel */}
      {isAssistantOpen && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.header__icon}>
              <FontAwesomeIcon icon={faRobot} />
            </div>
            <div className={styles.header__text}>
              <div className={styles.header__title}>CrMS AI</div>
              <div className={styles.header__status}>
                <span className={`${styles.header__statusDot} ${isAiBusy ? styles['header__statusDot--busy'] : ''}`} />
                {isAiBusy ? `Working on ${activeTasks[0]?.label}...` : 'Ready to help'}
              </div>
            </div>
            <button className={styles.header__close} onClick={handleExpandChat} title="Open full chat">
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <button className={styles.header__close} onClick={() => dispatch(closeAssistant())} title="Close">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'chat' ? styles['tab--active'] : ''}`} onClick={() => setTab('chat')}>
              Chat
            </button>
            <button className={`${styles.tab} ${tab === 'actions' ? styles['tab--active'] : ''}`} onClick={() => setTab('actions')}>
              Quick Actions
            </button>
            <button className={`${styles.tab} ${tab === 'activity' ? styles['tab--active'] : ''}`} onClick={() => setTab('activity')}>
              Activity {activityLog.length > 0 && `(${activityLog.length})`}
            </button>
          </div>

          {/* Chat Tab */}
          {tab === 'chat' && (
            <>
              <div className={styles.messages}>
                {messages.map((msg, i) => (
                  <div key={i} className={`${styles.msg} ${msg.role === 'user' ? styles['msg--user'] : ''}`}>
                    <div className={`${styles.msg__avatar} ${msg.role === 'ai' ? styles['msg__avatar--ai'] : styles['msg__avatar--user']}`}>
                      <FontAwesomeIcon icon={msg.role === 'ai' ? faRobot : faUser} />
                    </div>
                    <div className={`${styles.msg__bubble} ${msg.role === 'ai' ? styles['msg__bubble--ai'] : styles['msg__bubble--user']}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className={styles.typing}>
                    <div className={`${styles.msg__avatar} ${styles['msg__avatar--ai']}`}>
                      <FontAwesomeIcon icon={faRobot} />
                    </div>
                    <div className={styles.typing__dots}>
                      <span className={styles.typing__dot} />
                      <span className={styles.typing__dot} />
                      <span className={styles.typing__dot} />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
              <div className={styles.inputArea}>
                <textarea
                  ref={inputRef}
                  className={styles.inputField}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  rows={1}
                />
                <button
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </>
          )}

          {/* Quick Actions Tab */}
          {tab === 'actions' && (
            <div className={styles.actions}>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  className={styles.action}
                  onClick={() => handleQuickAction(action.prompt)}
                >
                  <div
                    className={styles.action__icon}
                    style={{ background: action.iconBg, color: action.iconColor }}
                  >
                    <FontAwesomeIcon icon={action.icon} />
                  </div>
                  <div className={styles.action__text}>
                    <div className={styles.action__title}>{action.title}</div>
                    <div className={styles.action__desc}>{action.desc}</div>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className={styles.action__arrow} />
                </button>
              ))}
            </div>
          )}

          {/* Activity Log Tab */}
          {tab === 'activity' && (
            <div className={styles.log}>
              {activityLog.length === 0 ? (
                <div className={styles.logEmpty}>
                  <div className={styles.logEmpty__icon}>
                    <FontAwesomeIcon icon={faClockRotateLeft} />
                  </div>
                  <div>No AI activity yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Your AI assistant activity will appear here</div>
                </div>
              ) : (
                activityLog.map((entry) => (
                  <div key={entry.id} className={styles.logItem}>
                    <span className={`${styles.logItem__dot} ${styles[`logItem__dot--${entry.status}`]}`} />
                    <span className={styles.logItem__label}>
                      <FontAwesomeIcon icon={faBolt} style={{ marginRight: 4, fontSize: 10 }} />
                      {entry.label}
                    </span>
                    <span className={styles.logItem__time}>{timeAgo(entry.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
