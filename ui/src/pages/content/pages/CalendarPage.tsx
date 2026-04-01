import { useState, useCallback } from 'react';
import { Button, Tag, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faStickyNote, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useGetCalendarQuery, useDeleteCalendarNoteMutation, useReschedulePostMutation } from '@/store/endpoints/content';
import type { ContentPost, CalendarNote } from '@/types';
import { DAYS, STATUS_COLORS } from '../constants';
import { ApprovalDrawer } from '../components/ApprovalDrawer';
import { CalendarNoteModal } from '@/components/content/CalendarNoteModal';
import { useNavigate } from 'react-router-dom';
import s from '../styles/Calendar.module.scss';

const APPROVAL_BADGES: Record<string, string> = {
  PENDING_REVIEW: '⏳',
  CHANGES_REQUESTED: '✏️',
  APPROVED: '✅',
  REJECTED: '❌',
};

export function CalendarPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CalendarNote | undefined>();
  const [noteDefaultDate, setNoteDefaultDate] = useState<string | undefined>();
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const { data } = useGetCalendarQuery({ month, year });
  const calendarData = data?.data;
  const posts: ContentPost[] = calendarData?.posts ?? (Array.isArray(calendarData) ? calendarData : []);
  const notes: CalendarNote[] = calendarData?.notes ?? [];
  const [deleteNote] = useDeleteCalendarNoteMutation();
  const [reschedulePost] = useReschedulePostMutation();

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const prevMonth = () => setDate(new Date(year, month - 2, 1));
  const nextMonth = () => setDate(new Date(year, month, 1));

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const getPostsForDay = useCallback((day: number) =>
    posts.filter((p) => {
      const d = new Date(p.scheduledAt || p.publishedAt || p.createdAt);
      return d.getDate() === day;
    }), [posts]);

  const openNoteModal = (day?: number) => {
    setSelectedNote(undefined);
    setNoteDefaultDate(day ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : undefined);
    setNoteModalOpen(true);
  };

  const editNote = (note: CalendarNote) => {
    setSelectedNote(note);
    setNoteModalOpen(true);
  };

  const handleQuickCreate = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00:00`;
    navigate(`/studio/compose?scheduledAt=${encodeURIComponent(dateStr)}`);
  };

  // Drag-and-drop reschedule
  const handleDragStart = (e: React.DragEvent, post: ContentPost) => {
    e.dataTransfer.setData('text/plain', post.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
  };

  const handleDragLeave = () => setDragOverDay(null);

  const handleDrop = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const postId = e.dataTransfer.getData('text/plain');
    if (!postId) return;
    const targetDate = new Date(year, month - 1, day, 10, 0, 0);
    try {
      await reschedulePost({ id: postId, scheduledAt: targetDate.toISOString() }).unwrap();
      message.success('Post rescheduled');
    } catch {
      message.error('Failed to reschedule');
    }
  };

  return (
    <div>
      <div className={s.page_header}>
        <h1 className={s.page_title}>Content Calendar</h1>
        <div className={s.header_actions}>
          <Button icon={<FontAwesomeIcon icon={faStickyNote} />} onClick={() => openNoteModal()}>Add Note</Button>
          <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => navigate('/studio/compose')}>New Post</Button>
        </div>
      </div>

      <div className={s.calendar_card}>
        <div className={s.month_nav}>
          <Button type="text" icon={<FontAwesomeIcon icon={faChevronLeft} />} onClick={prevMonth} />
          <h3 className={s.month_title}>
            {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <Button type="text" icon={<FontAwesomeIcon icon={faChevronRight} />} onClick={nextMonth} />
        </div>

        <div className={s.calendar_grid}>
          {DAYS.map((d) => (
            <div key={d} className={s.day_header}>{d}</div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className={`${s.day_cell} ${s['day_cell--empty']}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPosts = getPostsForDay(day);
            const isToday = isCurrentMonth && day === now.getDate();
            const isDragOver = dragOverDay === day;

            return (
              <div
                key={day}
                className={`${s.day_cell} ${isToday ? s['day_cell--today'] : ''} ${isDragOver ? s['day_cell--drag_over'] : ''}`}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
              >
                <span className={`${s.day_number} ${isToday ? s['day_number--today'] : ''}`}>{day}</span>
                <button className={s.day_add_btn} onClick={() => handleQuickCreate(day)} title="Quick create">+</button>

                {dayPosts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className={s.post_pill}
                    style={{ background: STATUS_COLORS[p.status] || '#f1f5f9' }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p)}
                    onClick={() => setSelectedPost(p)}
                  >
                    {p.approvalStatus && APPROVAL_BADGES[p.approvalStatus] && (
                      <span className={s.post_pill__approval}>{APPROVAL_BADGES[p.approvalStatus]}</span>
                    )}
                    {p.platform.slice(0, 2)} · {p.caption?.slice(0, 20) || 'Untitled'}
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <span className={s.post_pill__more}>+{dayPosts.length - 3} more</span>
                )}
              </div>
            );
          })}
        </div>

        <div className={s.status_legend}>
          {Object.entries(STATUS_COLORS).map(([st, color]) => (
            <Tag key={st} color={color} style={{ color: '#334155' }}>{st}</Tag>
          ))}
        </div>
      </div>

      <ApprovalDrawer
        post={selectedPost}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />

      <CalendarNoteModal
        open={noteModalOpen}
        onClose={() => { setNoteModalOpen(false); setSelectedNote(undefined); }}
        note={selectedNote}
        defaultDate={noteDefaultDate}
      />

      {notes.length > 0 && (
        <div className={s.notes_section}>
          <h3 className={s.notes_title}>Calendar Notes</h3>
          <div className={s.notes_list}>
            {notes.map((n) => (
              <Tag
                key={n.id}
                color={n.color}
                style={{ cursor: 'pointer', fontSize: 12 }}
                onClick={() => editNote(n)}
                closable
                onClose={(e) => { e.preventDefault(); deleteNote(n.id); }}
              >
                <FontAwesomeIcon icon={faStickyNote} style={{ marginRight: 4 }} />
                {new Date(n.date).getDate()} - {n.title}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
