import { useState } from 'react';
import { Card, Button, Tag, Typography, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faStickyNote, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useGetCalendarQuery, useDeleteCalendarNoteMutation } from '@/store/endpoints/content';
import type { ContentPost, CalendarNote } from '@/types';
import { DAYS, STATUS_COLORS } from '../constants';
import { CalendarGrid } from '../components/CalendarGrid';
import { ApprovalDrawer } from '../components/ApprovalDrawer';
import { CalendarNoteModal } from '@/components/content/CalendarNoteModal';

const { Title } = Typography;

export function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CalendarNote | undefined>();
  const [noteDefaultDate, setNoteDefaultDate] = useState<string | undefined>();

  const { data } = useGetCalendarQuery({ month, year });
  const calendarData = data?.data;
  const posts: ContentPost[] = calendarData?.posts ?? (Array.isArray(calendarData) ? calendarData : []);
  const notes: CalendarNote[] = calendarData?.notes ?? [];
  const [deleteNote] = useDeleteCalendarNoteMutation();

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const prevMonth = () => setDate(new Date(year, month - 2, 1));
  const nextMonth = () => setDate(new Date(year, month, 1));

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const getPostsForDay = (day: number) =>
    posts.filter((p) => {
      const d = new Date(p.scheduledAt || p.publishedAt || p.createdAt);
      return d.getDate() === day;
    });

  const getNotesForDay = (day: number) =>
    notes.filter((n) => new Date(n.date).getDate() === day);

  const openNoteModal = (day?: number) => {
    setSelectedNote(undefined);
    setNoteDefaultDate(day ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : undefined);
    setNoteModalOpen(true);
  };

  const editNote = (note: CalendarNote) => {
    setSelectedNote(note);
    setNoteModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Content Calendar</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<FontAwesomeIcon icon={faStickyNote} />} onClick={() => openNoteModal()}>Add Note</Button>
          <Button type="primary" href="/content/new">+ New Post</Button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Button type="text" icon={<FontAwesomeIcon icon={faChevronLeft} />} onClick={prevMonth} />
          <Title level={4} style={{ margin: 0 }}>
            {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Title>
          <Button type="text" icon={<FontAwesomeIcon icon={faChevronRight} />} onClick={nextMonth} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          {DAYS.map((d) => (
            <div key={d} style={{ background: '#f8fafc', padding: 8, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#64748b' }}>
              {d}
            </div>
          ))}

          <CalendarGrid
            daysInMonth={daysInMonth}
            firstDay={firstDay}
            currentDay={now.getDate()}
            isCurrentMonth={isCurrentMonth}
            getPostsForDay={getPostsForDay}
            onPostClick={setSelectedPost}
          />
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <Tag key={status} color={color} style={{ color: '#334155' }}>{status}</Tag>
          ))}
        </div>
      </Card>

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
        <Card size="small" title="Calendar Notes" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
        </Card>
      )}
    </div>
  );
}
