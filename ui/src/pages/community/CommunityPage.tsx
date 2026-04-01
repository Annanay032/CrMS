import { useState, useCallback } from 'react';
import { Button, Empty, Input, Select, Spin, Tag, Checkbox } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot, faComments, faReply, faExclamation,
  faInbox, faEnvelopeOpen, faFire, faBookmark, faMicrophone,
  faPaperPlane, faPen, faFlag, faStar, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetInteractionsQuery, useGetCommunityStatsQuery,
  useMarkRespondedMutation, useMarkBulkReadMutation,
  useUpdateCaseMutation, useMarkReadMutation,
  useStarInteractionMutation, useUnstarInteractionMutation,
} from '@/store/endpoints/community';
import { useGetEngagementSuggestionsMutation } from '@/store/endpoints/agents';
import type { Interaction } from './types';
import { SavedRepliesDrawer } from './components/SavedRepliesDrawer';
import { VoiceProfileDrawer } from './components/VoiceProfileDrawer';
import s from './styles/Community.module.scss';

type FilterTab = 'all' | 'unread' | 'pending' | 'open' | 'in_progress' | 'resolved' | 'high_priority' | 'starred';

type StatMapKey = 'total' | 'unread' | 'highPriority';

const TABS: { key: FilterTab; label: string; statsKey?: StatMapKey }[] = [
  { key: 'all', label: 'All', statsKey: 'total' },
  { key: 'unread', label: 'Unread', statsKey: 'unread' },
  { key: 'pending', label: 'Pending' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'high_priority', label: 'High Priority', statsKey: 'highPriority' },
  { key: 'starred', label: 'Starred' },
];

const SENTIMENT_COLORS: Record<string, string> = { POSITIVE: 'green', NEGATIVE: 'red', NEUTRAL: 'default', MIXED: 'orange' };
const PRIORITY_COLORS: Record<string, string> = { HIGH: 'red', MEDIUM: 'orange', LOW: 'blue' };
const PLATFORM_COLORS: Record<string, string> = { INSTAGRAM: 'magenta', YOUTUBE: 'red', TWITTER: 'blue', TIKTOK: 'default', FACEBOOK: 'geekblue', LINKEDIN: 'cyan' };
const CASE_COLORS: Record<string, string> = { OPEN: 'processing', IN_PROGRESS: 'warning', RESOLVED: 'success' };

export function CommunityPage() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [platformFilter, setPlatformFilter] = useState<string | undefined>();
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const [voiceProfileOpen, setVoiceProfileOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const responded = filter === 'pending' ? 'false' : undefined;
  const isRead = filter === 'unread' ? 'false' : undefined;
  const caseStatus = filter === 'open' ? 'OPEN' : filter === 'in_progress' ? 'IN_PROGRESS' : filter === 'resolved' ? 'RESOLVED' : undefined;
  const priority = filter === 'high_priority' ? 'HIGH' : undefined;

  const { data, isLoading, refetch } = useGetInteractionsQuery({
    page, responded, isRead, caseStatus, priority, sortBy,
    platform: platformFilter, search: search || undefined,
  });
  const { data: statsData } = useGetCommunityStatsQuery();
  const [getSuggestions, { isLoading: aiLoading }] = useGetEngagementSuggestionsMutation();
  const [markResponded] = useMarkRespondedMutation();
  const [markBulkRead] = useMarkBulkReadMutation();
  const [updateCase] = useUpdateCaseMutation();
  const [markRead] = useMarkReadMutation();
  const [starInteraction] = useStarInteractionMutation();
  useUnstarInteractionMutation();

  const interactions: Interaction[] = (data?.data ?? []) as unknown as Interaction[];
  const stats = statsData?.data;
  const pagination = data?.pagination;

  const fetchSuggestions = async () => {
    try { await getSuggestions({}).unwrap(); refetch(); } catch { /* */ }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const handleBulkAction = useCallback(async (action: 'read' | 'archive' | 'high' | 'resolve') => {
    if (selectedIds.length === 0) return;
    try {
      if (action === 'read') {
        await markBulkRead(selectedIds).unwrap();
      } else if (action === 'high') {
        await Promise.all(selectedIds.map((id) => updateCase({ id, priority: 'HIGH' })));
      } else if (action === 'resolve') {
        await Promise.all(selectedIds.map((id) => updateCase({ id, caseStatus: 'RESOLVED' })));
      }
      setSelectedIds([]);
    } catch { /* */ }
  }, [selectedIds, markBulkRead, updateCase]);

  const getStatValue = (key: string) => {
    if (!stats) return 0;
    return (stats as unknown as Record<string, number>)[key] ?? 0;
  };

  return (
    <div>
      {/* Header */}
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <FontAwesomeIcon icon={faInbox} className={s.page_title__icon} />
          Community Hub
        </h1>
        <div className={s.header_actions}>
          <Button icon={<FontAwesomeIcon icon={faBookmark} />} onClick={() => setSavedRepliesOpen(true)}>
            Saved Replies
          </Button>
          <Button icon={<FontAwesomeIcon icon={faMicrophone} />} onClick={() => setVoiceProfileOpen(true)}>
            Voice Profile
          </Button>
          <Button type="primary" icon={<FontAwesomeIcon icon={faRobot} />} onClick={fetchSuggestions} loading={aiLoading}>
            Generate AI Replies
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={s.stats_row}>
        {[
          { icon: faComments, label: 'Total', key: 'total' },
          { icon: faReply, label: 'Pending', key: 'pending' },
          { icon: faEnvelopeOpen, label: 'Unread', key: 'unread' },
          { icon: faFire, label: 'High Priority', key: 'highPriority' },
          { icon: faExclamation, label: 'Negative', key: 'negative' },
          { icon: faCheck, label: 'Response Rate', key: 'responseRate', suffix: '%' },
        ].map((item) => (
          <div key={item.key} className={s.stat_card}>
            <FontAwesomeIcon icon={item.icon} className={s.stat_card__icon} style={{ color: item.key === 'negative' ? '#ef4444' : item.key === 'highPriority' ? '#f59e0b' : '#6366f1' }} />
            <div className={s.stat_card__value}>{getStatValue(item.key)}{item.suffix ?? ''}</div>
            <div className={s.stat_card__label}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className={s.filter_bar}>
        <Input.Search placeholder="Search messages..." style={{ width: 260 }} onSearch={(v) => { setSearch(v); setPage(1); }} allowClear />
        <Select placeholder="Platform" allowClear style={{ width: 130 }} value={platformFilter} onChange={(v) => { setPlatformFilter(v); setPage(1); }}
          options={['INSTAGRAM', 'YOUTUBE', 'TWITTER', 'TIKTOK', 'FACEBOOK', 'LINKEDIN'].map((p) => ({ label: p, value: p }))} />
        <Select value={sortBy} style={{ width: 130 }} onChange={(v) => setSortBy(v)}
          options={[{ label: 'Newest', value: 'newest' }, { label: 'Oldest', value: 'oldest' }, { label: 'Priority', value: 'priority' }]} />
        <div className={s.filter_bar__spacer} />
        <Button size="small" onClick={() => handleBulkAction('read')} disabled={!interactions.some((i) => !i.isRead)}>
          Mark All Read
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className={s.bulk_bar}>
          <span className={s.bulk_bar__count}>{selectedIds.length} selected</span>
          <Button size="small" icon={<FontAwesomeIcon icon={faEnvelopeOpen} />} onClick={() => handleBulkAction('read')}>Mark Read</Button>
          <Button size="small" icon={<FontAwesomeIcon icon={faFlag} />} onClick={() => handleBulkAction('high')}>High Priority</Button>
          <Button size="small" icon={<FontAwesomeIcon icon={faCheck} />} onClick={() => handleBulkAction('resolve')}>Resolve</Button>
          <div className={s.filter_bar__spacer} />
          <Button size="small" type="text" onClick={() => setSelectedIds([])}>Clear</Button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className={s.tab_bar}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${s.tab_btn} ${filter === tab.key ? s['tab_btn--active'] : ''}`}
            onClick={() => { setFilter(tab.key); setPage(1); }}
          >
            {tab.label}
            {tab.statsKey && stats && (
              <span className={s.tab_badge}>{getStatValue(tab.statsKey)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Interaction List */}
      {isLoading ? (
        <div className={s.loading_state}><Spin /></div>
      ) : interactions.length === 0 ? (
        <div className={s.empty_state}>
          <Empty description="No interactions found. Connect your social accounts to start." />
        </div>
      ) : (
        <div className={s.interaction_list}>
          {interactions.map((i) => (
            <div
              key={i.id}
              className={`${s.interaction_card} ${!i.isRead ? s['interaction_card--unread'] : ''} ${i.priority === 'HIGH' ? s['interaction_card--high'] : i.priority === 'MEDIUM' ? s['interaction_card--medium'] : ''}`}
              onClick={() => { if (!i.isRead) markRead(i.id); }}
            >
              <div className={s.interaction_card__checkbox}>
                <Checkbox
                  checked={selectedIds.includes(i.id)}
                  onChange={() => toggleSelect(i.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className={s.interaction_card__content}>
                {/* Header */}
                <div className={s.interaction_card__header}>
                  {!i.isRead && <span className={s.interaction_card__unread_dot} />}
                  <span className={s.interaction_card__avatar}>{i.authorName?.charAt(0) ?? '?'}</span>
                  <span className={s.interaction_card__author}>{i.authorName ?? 'Unknown'}</span>
                  <Tag color={PLATFORM_COLORS[i.platform] ?? 'default'}>{i.platform}</Tag>
                  <Tag>{i.interactionType}</Tag>
                  {i.sentiment && <Tag color={SENTIMENT_COLORS[i.sentiment]}>{i.sentiment}</Tag>}
                  {i.caseStatus && <Tag color={CASE_COLORS[i.caseStatus]}>{i.caseStatus.replace('_', ' ')}</Tag>}
                  {i.priority && <Tag color={PRIORITY_COLORS[i.priority]}><FontAwesomeIcon icon={faFlag} /> {i.priority}</Tag>}
                  <span className={s.interaction_card__time}>
                    {new Date(i.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Body */}
                {i.content && <p className={s.interaction_card__body}>{i.content}</p>}

                {/* Tags */}
                {i.tags?.length > 0 && (
                  <div className={s.interaction_card__tags}>
                    {i.tags.map((t) => <Tag key={t} style={{ fontSize: 11 }}>{t}</Tag>)}
                  </div>
                )}

                {/* AI Suggestion */}
                {i.aiSuggestion && (
                  <div className={s.interaction_card__ai_box}>
                    <div className={s.interaction_card__ai_label}>
                      <FontAwesomeIcon icon={faRobot} /> AI Suggested Reply
                    </div>
                    <p className={s.interaction_card__ai_text}>{i.aiSuggestion}</p>
                    <div className={s.interaction_card__actions}>
                      <Button size="small" icon={<FontAwesomeIcon icon={faPaperPlane} />}>Send</Button>
                      <Button size="small" icon={<FontAwesomeIcon icon={faPen} />}>Edit</Button>
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div className={s.interaction_card__actions}>
                  {!i.respondedAt && (
                    <Button size="small" type="primary" ghost onClick={(e) => { e.stopPropagation(); markResponded(i.id); }}>
                      <FontAwesomeIcon icon={faReply} /> Respond
                    </Button>
                  )}
                  <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); starInteraction(i.id); }}>
                    <FontAwesomeIcon icon={faStar} />
                  </Button>
                  <Select
                    size="small"
                    value={i.priority ?? 'LOW'}
                    onChange={(v) => updateCase({ id: i.id, priority: v })}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 90 }}
                    options={[{ label: 'High', value: 'HIGH' }, { label: 'Medium', value: 'MEDIUM' }, { label: 'Low', value: 'LOW' }]}
                  />
                  <Select
                    size="small"
                    value={i.caseStatus ?? 'OPEN'}
                    onChange={(v) => updateCase({ id: i.id, caseStatus: v })}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 110 }}
                    options={[{ label: 'Open', value: 'OPEN' }, { label: 'In Progress', value: 'IN_PROGRESS' }, { label: 'Resolved', value: 'RESOLVED' }]}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className={s.pagination}>
          <span className={s.pagination__info}>Page {page} of {pagination.totalPages ?? 1} ({pagination.total ?? 0} total)</span>
          <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Button size="small" disabled={page >= (pagination.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <SavedRepliesDrawer open={savedRepliesOpen} onClose={() => setSavedRepliesOpen(false)} />
      <VoiceProfileDrawer open={voiceProfileOpen} onClose={() => setVoiceProfileOpen(false)} />
    </div>
  );
}
