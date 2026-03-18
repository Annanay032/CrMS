import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-200',
  REVIEW: 'bg-amber-200',
  APPROVED: 'bg-blue-200',
  SCHEDULED: 'bg-indigo-200',
  PUBLISHED: 'bg-green-200',
  FAILED: 'bg-red-200',
};

interface Post {
  id: string;
  caption: string;
  platform: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  useEffect(() => {
    api.get(`/content/calendar?month=${month}&year=${year}`)
      .then((res) => setPosts(res.data.data ?? []))
      .catch(() => {});
  }, [month, year]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const prevMonth = () => setDate(new Date(year, month - 2, 1));
  const nextMonth = () => setDate(new Date(year, month, 1));

  const getPostsForDay = (day: number) => {
    return posts.filter((p) => {
      const d = new Date(p.scheduledAt || p.publishedAt || p.createdAt);
      return d.getDate() === day;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Content Calendar</h1>
        <Button variant="primary" onClick={() => window.location.href = '/content/new'}>
          + New Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
            {DAYS.map((d) => (
              <div key={d} className="bg-slate-50 p-2 text-center text-xs font-medium text-slate-500">
                {d}
              </div>
            ))}

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 min-h-[100px]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayPosts = getPostsForDay(day);
              const isToday = day === new Date().getDate() && month === new Date().getMonth() + 1 && year === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`bg-white p-2 min-h-[100px] ${isToday ? 'ring-2 ring-inset ring-indigo-500' : ''}`}
                >
                  <span className={`text-sm ${isToday ? 'font-bold text-indigo-600' : 'text-slate-600'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayPosts.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className={`rounded px-1.5 py-0.5 text-xs truncate ${STATUS_COLORS[p.status] || 'bg-slate-100'}`}
                        title={p.caption || p.platform}
                      >
                        {p.platform.slice(0, 2)} · {p.caption?.slice(0, 20) || 'Untitled'}
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-xs text-slate-400">+{dayPosts.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className={`h-3 w-3 rounded-sm ${color}`} />
                {status}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
