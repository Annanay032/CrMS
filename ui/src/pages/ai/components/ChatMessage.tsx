import { Avatar } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faUser } from '@fortawesome/free-solid-svg-icons';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && (
        <Avatar
          style={{ background: '#eef2ff', flexShrink: 0 }}
          icon={<FontAwesomeIcon icon={faRobot} style={{ color: '#4f46e5' }} />}
        />
      )}
      <div
        style={{
          maxWidth: '80%',
          borderRadius: 12,
          padding: 12,
          fontSize: 14,
          whiteSpace: 'pre-wrap',
          ...(isUser
            ? { background: '#4f46e5', color: '#fff' }
            : { background: '#f1f5f9', color: '#1e293b' }),
        }}
      >
        {message.content}
      </div>
      {isUser && (
        <Avatar
          style={{ background: '#e2e8f0', flexShrink: 0 }}
          icon={<FontAwesomeIcon icon={faUser} style={{ color: '#475569' }} />}
        />
      )}
    </div>
  );
}
