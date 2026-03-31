import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Tag, Button, Image, Skeleton, Empty, Tooltip } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined, ExclamationCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { useGetPostQuery, useGetCrossplatformGroupQuery } from '@/store/endpoints/content';
import { PLATFORM_ICONS } from '../constants';
import type { PostAnalytics, PostActivityLog, ContentPost } from '@/types';
import s from '../styles/PostDetailPage.module.scss';

const PLATFORM_BG: Record<string, string> = {
  YOUTUBE: 'youtube', INSTAGRAM: 'instagram', TIKTOK: 'tiktok',
  TWITTER: 'twitter', LINKEDIN: 'linkedin', THREADS: 'threads',
  FACEBOOK: 'facebook', PINTEREST: 'pinterest',
};

const ACTION_COLORS: Record<string, string> = {
  CREATED: '#22c55e', EDITED: '#3b82f6', STATUS_CHANGED: '#f59e0b',
  SCHEDULED: '#8b5cf6', PUBLISHED: '#22c55e', FAILED: '#ef4444',
  MEDIA_ADDED: '#06b6d4', MEDIA_REMOVED: '#ec4899', CAPTION_EDITED: '#3b82f6',
  HASHTAGS_UPDATED: '#6366f1', PLATFORM_ADAPTED: '#f97316',
  CLONED: '#84cc16', ARCHIVED: '#94a3b8', COMMENT_ADDED: '#eab308',
};

const STATUS_PILL_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: '#f1f5f9', color: '#475569' },
  REVIEW: { bg: '#fef3c7', color: '#92400e' },
  APPROVED: { bg: '#dbeafe', color: '#1e40af' },
  SCHEDULED: { bg: '#e0e7ff', color: '#3730a3' },
  PUBLISHED: { bg: '#dcfce7', color: '#166534' },
  FAILED: { bg: '#fee2e2', color: '#991b1b' },
};

function getExternalPostUrl(platform: string, externalPostId: string): string {
  switch (platform) {
    case 'YOUTUBE': return `https://youtube.com/watch?v=${externalPostId}`;
    case 'INSTAGRAM': return `https://instagram.com/p/${externalPostId}`;
    case 'TIKTOK': return `https://tiktok.com/@/video/${externalPostId}`;
    case 'TWITTER': return `https://x.com/i/status/${externalPostId}`;
    case 'LINKEDIN': return `https://linkedin.com/feed/update/${externalPostId}`;
    case 'FACEBOOK': return `https://facebook.com/${externalPostId}`;
    case 'THREADS': return `https://threads.net/post/${externalPostId}`;
    case 'PINTEREST': return `https://pinterest.com/pin/${externalPostId}`;
    default: return `https://${platform.toLowerCase()}.com`;
  }
}

/* ── Analytics ── */
function AnalyticsSection({ analytics }: { analytics: PostAnalytics }) {
  const stats = [
    { label: 'Impressions', value: analytics.impressions },
    { label: 'Reach', value: analytics.reach },
    { label: 'Likes', value: analytics.likes },
    { label: 'Comments', value: analytics.comments },
    { label: 'Shares', value: analytics.shares },
    { label: 'Saves', value: analytics.saves },
    { label: 'Clicks', value: analytics.clicks },
    { label: 'Views', value: analytics.videoViews },
    ...(analytics.avgWatchTime > 0 ? [{ label: 'Avg Watch', value: `${analytics.avgWatchTime}s` }] : []),
    ...(analytics.profileVisits > 0 ? [{ label: 'Profile Visits', value: analytics.profileVisits }] : []),
    ...(analytics.estimatedRevenue != null ? [{ label: 'Revenue', value: `$${analytics.estimatedRevenue.toFixed(2)}` }] : []),
  ].filter((st) => st.value !== 0 && st.value !== '0s');

  if (!stats.length) return null;

  return (
    <div className={s.section}>
      <div className={s.section_header}>
        <span className={s.section_title}>Performance</span>
      </div>
      <div className={s.section_body}>
        <div className={s.analytics_grid}>
          {stats.map((st) => (
            <div key={st.label} className={s.stat_item}>
              <div className={s.stat_value}>{st.value}</div>
              <div className={s.stat_label}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Activity ── */
function ActivityTimeline({ logs }: { logs: PostActivityLog[] }) {
  if (!logs.length) return <div className={s.activity_empty}>No activity recorded yet</div>;

  return (
    <div className={s.activity_list}>
      {logs.map((log) => (
        <div key={log.id} className={s.activity_item}>
          <div className={s.activity_dot} style={{ color: ACTION_COLORS[log.action] || '#94a3b8' }} />
          <div className={s.activity_body}>
            <span className={s.activity_action} style={{ color: ACTION_COLORS[log.action] || '#94a3b8' }}>
              {log.action.replace(/_/g, ' ')}
            </span>
            {log.user && (
              <span className={s.activity_user}>
                {log.user.avatarUrl
                  ? <img src={log.user.avatarUrl} alt="" className={s.activity_user_avatar} />
                  : <UserOutlined style={{ fontSize: 11 }} />}
                {log.user.name}
              </span>
            )}
            {log.details && <div className={s.activity_detail}>{log.details}</div>}
            <div className={s.activity_time}>{new Date(log.createdAt).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Cross-platform Group ── */
function GroupSection({ posts, currentPostId }: { posts: ContentPost[]; currentPostId: string }) {
  const siblings = posts.filter((p) => p.id !== currentPostId);
  if (!siblings.length) return null;

  return (
    <div className={s.section}>
      <div className={s.section_header}>
        <span className={s.section_title}>Also Published On</span>
      </div>
      <div className={s.section_body}>
        <div className={s.group_grid}>
          {siblings.map((p) => {
            const pillStyle = STATUS_PILL_COLORS[p.status] || STATUS_PILL_COLORS.DRAFT;
            return (
              <Link key={p.id} to={`/posts/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className={s.group_card}>
                  <span className={s.group_icon}>{PLATFORM_ICONS[p.platform] || '📋'}</span>
                  <div className={s.group_info}>
                    <div className={s.group_platform}>{p.platform}</div>
                    <div className={s.group_type}>{p.postType}</div>
                  </div>
                  <span className={s.status_pill} style={{ background: pillStyle.bg, color: pillStyle.color }}>
                    {p.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromChannel = searchParams.get('from') === 'channel';
  const channelPlatform = searchParams.get('platform');

  const { data: postRes, isLoading } = useGetPostQuery(id!, { skip: !id });
  const post = postRes?.data;

  // Only fetch cross-platform group when NOT coming from a channel page
  const showGroup = !fromChannel && !!post?.bulkGroupId;
  const { data: groupRes } = useGetCrossplatformGroupQuery(post?.bulkGroupId ?? '', { skip: !showGroup });
  const groupPosts = groupRes?.data ?? [];

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (!post) return <Empty description="Post not found" />;

  const platformKey = PLATFORM_BG[post.platform] || 'default';
  const pillStyle = STATUS_PILL_COLORS[post.status] || STATUS_PILL_COLORS.DRAFT;

  const backPath = fromChannel && channelPlatform
    ? `/channels/${channelPlatform.toLowerCase()}`
    : undefined;

  const infoItems = [
    { label: 'Platform', value: `${PLATFORM_ICONS[post.platform] || ''} ${post.platform}` },
    { label: 'Type', value: post.postType },
    { label: 'Created', value: new Date(post.createdAt).toLocaleString() },
    ...(post.scheduledAt ? [{ label: 'Scheduled', value: new Date(post.scheduledAt).toLocaleString() }] : []),
    ...(post.publishedAt ? [{ label: 'Published', value: new Date(post.publishedAt).toLocaleString() }] : []),
  ];

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.header_left}>
          <button
            className={s.back_btn}
            onClick={() => backPath ? navigate(backPath) : navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeftOutlined />
          </button>
          <div className={s.platform_badge + ' ' + s[`platform_badge--${platformKey}`]}>
            {PLATFORM_ICONS[post.platform] || '📋'}
          </div>
          <div className={s.header_meta}>
            <h1 className={s.header_title}>{post.caption?.slice(0, 60) || `${post.platform} ${post.postType}`}</h1>
            <div className={s.header_subtitle}>
              {post.platform} · {post.postType}
              {fromChannel && channelPlatform && <> · via {channelPlatform} Channel</>}
            </div>
          </div>
        </div>
        <div className={s.header_actions}>
          <span className={s.status_pill} style={{ background: pillStyle.bg, color: pillStyle.color }}>
            {post.status}
          </span>
          {post.bulkGroupId && !fromChannel && (
            <Tooltip title="Part of a multi-platform publish">
              <Tag color="purple">Multi-Platform</Tag>
            </Tooltip>
          )}
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => navigate(`/studio/compose?edit=${post.id}`)}>
            Edit
          </Button>
        </div>
      </div>

      {/* Error */}
      {post.lastError && (
        <div className={s.error_banner}>
          <ExclamationCircleOutlined className={s.error_icon} />
          <span>{post.lastError}</span>
        </div>
      )}

      {/* Grid */}
      <div className={s.grid}>
        {/* Left */}
        <div className={s.main_col}>
          {/* Info grid */}
          <div className={s.info_grid}>
            {infoItems.map((item) => (
              <div key={item.label} className={s.info_cell}>
                <div className={s.info_label}>{item.label}</div>
                <div className={s.info_value}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Caption + Media */}
          <div className={s.content_row}>
            <div className={`${s.section} ${s.caption_col}`}>
              <div className={s.section_header}>
                <span className={s.section_title}>Caption</span>
              </div>
              <div className={s.section_body}>
                {post.caption
                  ? <div className={s.caption_text}>{post.caption}</div>
                  : <div className={s.caption_empty}>No caption</div>}
                {post.hashtags.length > 0 && (
                  <div className={s.hashtags}>
                    {post.hashtags.map((h) => <Tag key={h} color="blue">#{h}</Tag>)}
                  </div>
                )}
                {post.firstComment && (
                  <div className={s.first_comment}>
                    <div className={s.first_comment_label}>First Comment</div>
                    <div className={s.caption_text}>{post.firstComment}</div>
                  </div>
                )}
              </div>
            </div>

            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className={`${s.section} ${s.media_col}`}>
                <div className={s.section_header}>
                  <span className={s.section_title}>Media</span>
                </div>
                <div className={s.section_body}>
                  <div className={s.media_grid}>
                    <Image.PreviewGroup>
                      {post.mediaUrls.map((url, i) => (
                        <div key={i} className={s.media_item}>
                          <Image src={url} width={110} height={110} style={{ objectFit: 'cover' }} />
                        </div>
                      ))}
                    </Image.PreviewGroup>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analytics */}
          {post.analytics && <AnalyticsSection analytics={post.analytics} />}

          {/* Cross-platform group (only from library, not channel) */}
          {showGroup && <GroupSection posts={groupPosts} currentPostId={post.id} />}

          {/* External link */}
          {post.status === 'PUBLISHED' && post.externalPostId && (
            <div className={s.section}>
              <div className={s.section_body}>
                <a
                  href={getExternalPostUrl(post.platform, post.externalPostId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.external_link}
                >
                  <LinkOutlined /> View on {post.platform}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right — Activity */}
        <div className={s.sidebar}>
          <div className={s.sidebar_card}>
            <div className={s.sidebar_header}>Activity</div>
            <div className={s.sidebar_body}>
              <ActivityTimeline logs={post.activityLogs ?? []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
