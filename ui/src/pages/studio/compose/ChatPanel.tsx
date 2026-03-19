import { useRef, useEffect } from 'react';
import { Input, Button, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPaperPlane, faCheck } from '@fortawesome/free-solid-svg-icons';
import type { ChatMessage } from './types';
import styles from './compose.module.scss';

interface Props {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onApply: (msg: ChatMessage) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatPanel({ messages, input, loading, onInputChange, onSend, onApply, chatEndRef }: Props) {
  return (
    <>
      <div className={styles.chat_messages}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.chat_msg} ${styles[`chat_msg--${msg.role}`]}`}>
            {msg.role === 'ai' && (
              <div className={styles.chat_avatar}>
                <FontAwesomeIcon icon={faRobot} />
              </div>
            )}
            <div className={styles.chat_bubble}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              {msg.action === 'apply' && (
                <Button size="small" type="link" icon={<FontAwesomeIcon icon={faCheck} />} onClick={() => onApply(msg)} style={{ padding: '4px 0', marginTop: 4 }}>
                  Apply to Post
                </Button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.chat_msg} ${styles['chat_msg--ai']}`}>
            <div className={styles.chat_avatar}><FontAwesomeIcon icon={faRobot} /></div>
            <div className={styles.chat_bubble}><div className={styles.chat_thinking}>Thinking...</div></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className={styles.chat_input}>
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onPressEnter={onSend}
          placeholder="Describe what you want to create..."
          suffix={
            <Button
              type="text" size="small"
              icon={<FontAwesomeIcon icon={faPaperPlane} />}
              onClick={onSend}
              disabled={!input.trim() || loading}
              style={{ color: input.trim() ? '#6366f1' : '#94a3b8' }}
            />
          }
        />
      </div>
    </>
  );
}
