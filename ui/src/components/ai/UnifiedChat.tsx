import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faPaperPlane,
  faUser,
  faCopy,
  faPenToSquare,
  faCheck,
  faWandMagicSparkles,
  faChartLine,
  faArrowTrendUp,
  faCalendarDays,
  faComments,
  faLightbulb,
  faPaperclip,
  faXmark,
  faVideo,
  faFile,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks/store';
import {
  aiTaskStarted,
  aiTaskCompleted,
  aiTaskFailed,
} from '@/store/ai.slice';
import { useChatWithAgentMutation } from '@/store/endpoints/notifications';
import { uploadFileToServer } from '@/utils/upload';
import type { Message, MessageAttachment } from '@/pages/ai/types';
import s from './UnifiedChat.module.scss';

export type ChatMode = 'floating' | 'fullpage' | 'embedded';

interface QuickAction {
  id: string;
  icon: typeof faWandMagicSparkles;
  label: string;
  desc?: string;
  prompt: string;
}

interface UnifiedChatProps {
  mode: ChatMode;
  /** Optional context hint shown in placeholder */
  contextHint?: string;
  /** Optional custom quick actions. Falls back to defaults. */
  quickActions?: QuickAction[];
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'content', icon: faWandMagicSparkles, label: 'Generate Content Ideas', desc: 'AI-powered captions, hooks & hashtags', prompt: 'Give me 5 creative content ideas for my niche this week' },
  { id: 'trends', icon: faArrowTrendUp, label: 'Spot Trends', desc: "Discover what's trending", prompt: 'What are the latest trending topics in my niche?' },
  { id: 'analytics', icon: faChartLine, label: 'Analyze Performance', desc: 'Insights on your recent posts', prompt: 'Analyze my content performance and give me actionable insights' },
  { id: 'schedule', icon: faCalendarDays, label: 'Optimize Schedule', desc: 'Best times to post', prompt: 'When are the best times for me to post based on my performance data?' },
  { id: 'engage', icon: faComments, label: 'Engagement Tips', desc: 'Reply & comment ideas', prompt: 'Give me strategies to boost engagement on my posts' },
  { id: 'growth', icon: faLightbulb, label: 'Growth Strategy', desc: 'Personalized recommendations', prompt: 'Based on my data, what should I focus on to grow my audience?' },
];

const STUDIO_QUICK_ACTIONS: QuickAction[] = [
  { id: 'ideas', icon: faLightbulb, label: 'Generate Ideas', prompt: 'Give me 5 creative post ideas for this week based on my niche and top-performing content' },
  { id: 'caption', icon: faWandMagicSparkles, label: 'Write Caption', prompt: 'Write a compelling Instagram caption for my niche' },
  { id: 'hashtags', icon: faArrowTrendUp, label: 'Suggest Hashtags', prompt: 'Suggest trending hashtags relevant to my niche and audience' },
  { id: 'repurpose', icon: faCalendarDays, label: 'Repurpose Content', prompt: 'Help me repurpose my best performing post for multiple platforms' },
];

const WELCOME = "Hey! I'm your CrMS AI assistant. I have access to all your data — analytics, content performance, revenue, growth metrics, and more. Ask me anything or use a quick action to get started.";

function getQuickActions(mode: ChatMode, custom?: QuickAction[]): QuickAction[] {
  if (custom) return custom;
  if (mode === 'embedded') return STUDIO_QUICK_ACTIONS;
  return DEFAULT_QUICK_ACTIONS;
}

export function UnifiedChat({ mode, contextHint, quickActions }: UnifiedChatProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [chatWithAgent, { isLoading }] = useChatWithAgentMutation();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const actions = getQuickActions(mode, quickActions);
  const showQuickActions = messages.length <= 1;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    const userMessage = text.trim();
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, attachments: currentAttachments.length > 0 ? currentAttachments : undefined }]);

    const taskId = `chat-${Date.now()}`;
    dispatch(aiTaskStarted({ id: taskId, label: 'AI Chat', agentType: 'CHAT', startedAt: Date.now() }));

    try {
      // Send conversation history for context
      const history = messages
        .filter((m) => m.content !== WELCOME)
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await chatWithAgent({
        message: userMessage || 'Please analyze the attached file(s).',
        history,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      }).unwrap();
      const chatData = result.data;

      let formatted: string;
      if (chatData?.mode === 'pipeline' && chatData.steps) {
        formatted = chatData.steps
          .map((step) => {
            const label = step.agentType.replace(/_/g, ' ');
            const out = typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2);
            return `**${label}**\n${out}`;
          })
          .join('\n\n---\n\n');
      } else {
        const output = chatData?.output;
        formatted = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
      }

      setMessages((prev) => [...prev, { role: 'ai', content: formatted }]);
      dispatch(aiTaskCompleted({ id: taskId, label: 'AI Chat', agentType: 'CHAT' }));
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: `Sorry, something went wrong: ${e?.data?.error ?? e?.message ?? 'Unknown error'}` },
      ]);
      dispatch(aiTaskFailed({ id: taskId, label: 'AI Chat', agentType: 'CHAT' }));
    }
  }, [isLoading, chatWithAgent, dispatch, messages, attachments]);

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const url = await uploadFileToServer(file);
      if (url) {
        let type: MessageAttachment['type'] = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        setAttachments((prev) => [...prev, { url, name: file.name, type }]);
      }
    }
    setUploading(false);
    // Reset file input so the same file can be selected again
    e.target.value = '';
    inputRef.current?.focus();
  }, []);

  const removeAttachment = useCallback((idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleCopy = useCallback((content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  const handleUseAsCaption = useCallback((content: string) => {
    const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('**') && !l.startsWith('#') && !l.startsWith('---'));
    const caption = lines.slice(0, 3).join('\n').trim();
    navigate(`/studio/compose?caption=${encodeURIComponent(caption)}`);
  }, [navigate]);

  const modeClass = s[`chat--${mode}`] ?? '';

  return (
    <div className={`${s.chat} ${modeClass}`}>
      {/* Messages */}
      <div className={s.chat__messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${s.msg} ${msg.role === 'user' ? s['msg--user'] : ''}`}>
            <div className={`${s.msg__avatar} ${msg.role === 'ai' ? s['msg__avatar--ai'] : s['msg__avatar--user']}`}>
              <FontAwesomeIcon icon={msg.role === 'ai' ? faRobot : faUser} />
            </div>
            <div className={`${s.msg__bubble} ${msg.role === 'ai' ? s['msg__bubble--ai'] : s['msg__bubble--user']}`}>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={s.msg__attachments}>
                  {msg.attachments.map((att, ai) => (
                    <div key={ai} className={s.attachment_preview}>
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className={s.attachment_img} />
                      ) : att.type === 'video' ? (
                        <video src={att.url} className={s.attachment_video} controls />
                      ) : (
                        <div className={s.attachment_file}>
                          <FontAwesomeIcon icon={faFile} />
                          <span>{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {msg.content && <div className={s.msg__content}>{msg.content}</div>}
              {msg.role === 'ai' && i > 0 && (
                <div className={s.msg__actions}>
                  <button className={s.msg__action} onClick={() => handleUseAsCaption(msg.content)} title="Use as Caption">
                    <FontAwesomeIcon icon={faPenToSquare} />
                    <span>Use in Compose</span>
                  </button>
                  <button className={s.msg__action} onClick={() => handleCopy(msg.content, i)} title="Copy">
                    <FontAwesomeIcon icon={copiedIdx === i ? faCheck : faCopy} />
                    {copiedIdx === i && <span>Copied</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={s.typing}>
            <div className={`${s.msg__avatar} ${s['msg__avatar--ai']}`}>
              <FontAwesomeIcon icon={faRobot} />
            </div>
            <div className={s.typing__dots}>
              <span className={s.typing__dot} />
              <span className={s.typing__dot} />
              <span className={s.typing__dot} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick actions */}
      {showQuickActions && (
        <div className={s.quick}>
          {actions.map((action) => (
            <button
              key={action.id}
              className={s.quick__btn}
              onClick={() => sendMessage(action.prompt)}
            >
              <FontAwesomeIcon icon={action.icon} className={s.quick__icon} />
              <span className={s.quick__label}>{action.label}</span>
              {action.desc && mode !== 'embedded' && (
                <span className={s.quick__desc}>{action.desc}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className={s.input_area}>
        {/* Attachment staging area */}
        {attachments.length > 0 && (
          <div className={s.staging}>
            {attachments.map((att, i) => (
              <div key={i} className={s.staging__item}>
                {att.type === 'image' ? (
                  <img src={att.url} alt={att.name} className={s.staging__thumb} />
                ) : att.type === 'video' ? (
                  <div className={s.staging__icon_wrap}>
                    <FontAwesomeIcon icon={faVideo} />
                  </div>
                ) : (
                  <div className={s.staging__icon_wrap}>
                    <FontAwesomeIcon icon={faFile} />
                  </div>
                )}
                <span className={s.staging__name}>{att.name}</span>
                <button className={s.staging__remove} onClick={() => removeAttachment(i)}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className={s.input_row}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv"
            multiple
            className={s.file_input}
            onChange={handleFileSelect}
          />
          <button
            className={s.attach_btn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Attach file"
          >
            <FontAwesomeIcon icon={uploading ? faSpinner : faPaperclip} spin={uploading} />
          </button>
          <textarea
            ref={inputRef}
            className={s.input_field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={contextHint ?? 'Ask anything — analytics, content ideas, growth strategy...'}
            rows={1}
          />
          <button
            className={s.send_btn}
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>
    </div>
  );
}
