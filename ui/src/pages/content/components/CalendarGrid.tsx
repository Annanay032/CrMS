import { Typography } from 'antd';
import type { ContentPost } from '@/types';
import { STATUS_COLORS } from '../constants';

const { Text } = Typography;

const APPROVAL_BADGES: Record<string, { label: string; color: string }> = {
  PENDING_REVIEW: { label: '⏳', color: '#f59e0b' },
  CHANGES_REQUESTED: { label: '✏️', color: '#ef4444' },
  APPROVED: { label: '✅', color: '#22c55e' },
  REJECTED: { label: '❌', color: '#ef4444' },
};

interface CalendarGridProps {
  daysInMonth: number;
  firstDay: number;
  currentDay: number;
  isCurrentMonth: boolean;
  getPostsForDay: (day: number) => ContentPost[];
  onPostClick?: (post: ContentPost) => void;
}

export function CalendarGrid({ daysInMonth, firstDay, currentDay, isCurrentMonth, getPostsForDay, onPostClick }: CalendarGridProps) {
  return (
    <>
      {Array.from({ length: firstDay }).map((_, i) => (
        <div key={`e-${i}`} style={{ background: '#fff', padding: 8, minHeight: 100 }} />
      ))}

      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const dayPosts = getPostsForDay(day);
        const isToday = isCurrentMonth && day === currentDay;

        return (
          <div
            key={day}
            style={{
              background: '#fff',
              padding: 8,
              minHeight: 100,
              ...(isToday ? { boxShadow: 'inset 0 0 0 2px #6366f1' } : {}),
            }}
          >
            <Text strong={isToday} style={{ fontSize: 13, ...(isToday ? { color: '#4f46e5' } : {}) }}>
              {day}
            </Text>
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dayPosts.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onPostClick?.(p)}
                  style={{
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 11,
                    background: STATUS_COLORS[p.status] || '#f1f5f9',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    cursor: 'pointer',
                  }}
                >
                  {p.approvalStatus && APPROVAL_BADGES[p.approvalStatus] && (
                    <span style={{ fontSize: 10 }}>{APPROVAL_BADGES[p.approvalStatus].label}</span>
                  )}
                  {p.platform.slice(0, 2)} · {p.caption?.slice(0, 20) || 'Untitled'}
                </div>
              ))}
              {dayPosts.length > 3 && (
                <Text type="secondary" style={{ fontSize: 11 }}>+{dayPosts.length - 3} more</Text>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
