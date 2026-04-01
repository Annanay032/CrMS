import { useState, useEffect } from 'react';
import { Button, Select, Modal, Tag, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faShareNodes, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useGetTrendsMutation, useRunAgentMutation } from '@/store/endpoints/agents';
import type { Trend } from '@/types';
import { TrendCard } from './components/TrendCard';
import { PLATFORM_OPTIONS } from '@/pages/content/constants';
import { useNavigate } from 'react-router-dom';
import s from './styles/Trends.module.scss';

const NICHE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'tech', label: 'Tech' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'food', label: 'Food & Cooking' },
  { value: 'fitness', label: 'Fitness & Health' },
  { value: 'travel', label: 'Travel' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'music', label: 'Music' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
];

export function TrendsPage() {
  const navigate = useNavigate();
  const [getTrends, { isLoading }] = useGetTrendsMutation();
  const [runAgent, { isLoading: agentLoading }] = useRunAgentMutation();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [summary, setSummary] = useState('');
  const [niches, setNiches] = useState<string[]>(['general']);
  const [platforms, setPlatforms] = useState<string[]>(['INSTAGRAM', 'YOUTUBE', 'TIKTOK']);
  const [correlation, setCorrelation] = useState<Record<string, unknown> | null>(null);
  const [draftModal, setDraftModal] = useState<{ open: boolean; trend: Trend | null; draft: Record<string, unknown> | null }>({ open: false, trend: null, draft: null });
  const [scoreModal, setScoreModal] = useState<{ open: boolean; trend: Trend | null; score: Record<string, unknown> | null }>({ open: false, trend: null, score: null });

  const fetchTrends = async () => {
    try {
      const result = await getTrends({ niche: niches, platforms }).unwrap();
      setTrends((result.data?.trends as unknown as Trend[]) ?? []);
      setSummary((result.data?.summary as string) ?? '');
    } catch { /* */ }
  };

  useEffect(() => { fetchTrends(); }, []);

  const handleCorrelate = async () => {
    if (trends.length === 0) return;
    try {
      const result = await runAgent({
        agentType: 'TREND_DETECTION',
        input: {
          action: 'correlate',
          trends: trends.map((t) => ({
            title: t.title,
            platform: t.platform,
            category: t.category,
            relevanceScore: t.relevanceScore,
          })),
        },
      }).unwrap();
      setCorrelation(result.data as Record<string, unknown>);
    } catch { /* */ }
  };

  const handleScoreOpportunity = async (trend: Trend) => {
    setScoreModal({ open: true, trend, score: null });
    try {
      const result = await runAgent({
        agentType: 'TREND_DETECTION',
        input: {
          action: 'score_opportunity',
          trend: { title: trend.title, platform: Array.isArray(trend.platform) ? trend.platform[0] : trend.platform, category: trend.category, description: trend.description },
          creatorNiche: ['general'],
          creatorPlatforms: platforms,
          creatorFollowers: 10000,
        },
      }).unwrap();
      setScoreModal((p) => ({ ...p, score: result.data as Record<string, unknown> }));
    } catch { /* */ }
  };

  const handleAutoDraft = async (trend: Trend) => {
    setDraftModal({ open: true, trend, draft: null });
    try {
      const result = await runAgent({
        agentType: 'TREND_DETECTION',
        input: {
          action: 'auto_draft',
          trend: { title: trend.title, category: trend.category, description: trend.description, contentIdea: trend.contentIdea },
          platform: Array.isArray(trend.platform) ? trend.platform[0] : trend.platform,
          creatorNiche: niches,
        },
      }).unwrap();
      setDraftModal((p) => ({ ...p, draft: result.data as Record<string, unknown> }));
    } catch { /* */ }
  };

  return (
    <div>
      <div className={s.page_header}>
        <div>
          <h1 className={s.page_title}>Trending Now</h1>
          <p className={s.page_subtitle}>Discover what&apos;s trending and turn insights into content</p>
        </div>
        <div className={s.header_actions}>
          <Button type="primary" icon={<FontAwesomeIcon icon={faArrowTrendUp} />} onClick={fetchTrends} loading={isLoading}>
            Refresh
          </Button>
          <Button
            icon={<FontAwesomeIcon icon={faShareNodes} />}
            onClick={handleCorrelate}
            loading={agentLoading}
            disabled={trends.length === 0}
          >
            Cross-Platform Analysis
          </Button>
        </div>
      </div>

      <div className={s.filter_row}>
        <span className={s.filter_label}>Niche:</span>
        <Select
          mode="multiple"
          value={niches}
          onChange={setNiches}
          options={NICHE_OPTIONS}
          style={{ minWidth: 220 }}
          maxTagCount="responsive"
          placeholder="Select niches"
        />
        <span className={s.filter_label}>Platforms:</span>
        <Select
          mode="multiple"
          value={platforms}
          onChange={setPlatforms}
          options={PLATFORM_OPTIONS}
          style={{ minWidth: 250 }}
          maxTagCount="responsive"
          placeholder="Select platforms"
        />
      </div>

      {summary && <div className={s.summary_banner}>{summary}</div>}

      {correlation && (
        <div className={s.correlation_panel}>
          <h3 className={s.correlation_title}>Cross-Platform Correlation</h3>
          {(correlation.crossPlatformTrends as Array<{ title?: string; platformPresence?: string[] }>)?.length > 0 && (
            <div>
              <div className={s.section_label}>Trends Spanning Multiple Platforms</div>
              <div className={s.cross_platform_list}>
                {(correlation.crossPlatformTrends as Array<{ title?: string; platformPresence?: string[] }>).map((t, i) => (
                  <Tag key={i} color="purple">{t.title} — {t.platformPresence?.join(', ')}</Tag>
                ))}
              </div>
            </div>
          )}
          {(correlation.recommendedFocus as Array<{ trend?: string; reason?: string }> | undefined)?.length ? (
            <div>
              <div className={s.section_label}>Recommended Focus</div>
              <ul className={s.focus_list}>
                {(correlation.recommendedFocus as Array<{ trend?: string; reason?: string }>).map((r, i) => (
                  <li key={i}><strong>{r.trend}</strong>: {r.reason}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {correlation.correlationInsights ? (
            <p className={s.correlation_insights}>{String(correlation.correlationInsights)}</p>
          ) : null}
        </div>
      )}

      {isLoading && trends.length === 0 ? (
        <div className={s.loading_container}><Spin size="large" /></div>
      ) : trends.length === 0 ? (
        <div className={s.empty_state}>
          <FontAwesomeIcon icon={faArrowTrendUp} className={s.empty_state__icon} />
          <p className={s.empty_state__text}>No trends found. Try adjusting your niche or platform filters.</p>
        </div>
      ) : (
        <div className={s.trend_grid}>
          {trends.map((t, i) => (
            <TrendCard
              key={i}
              trend={t}
              onScore={() => handleScoreOpportunity(t)}
              onDraft={() => handleAutoDraft(t)}
            />
          ))}
        </div>
      )}

      {/* Opportunity Score Modal */}
      <Modal
        title={`Opportunity Score: ${scoreModal.trend?.title ?? ''}`}
        open={scoreModal.open}
        onCancel={() => setScoreModal({ open: false, trend: null, score: null })}
        footer={null}
        width={500}
      >
        {!scoreModal.score ? (
          <div className={s.loading_container}><Spin size="large" /></div>
        ) : (
          <div>
            <div className={s.score_grid}>
              <div className={s.score_card}>
                <div className={s.score_card__label}>Overall</div>
                <div className={s.score_card__value}>{Number(scoreModal.score.overallScore)}/100</div>
              </div>
              <div className={s.score_card}>
                <div className={s.score_card__label}>Relevance</div>
                <div className={s.score_card__value}>{Number(scoreModal.score.relevanceScore)}/100</div>
              </div>
              <div className={s.score_card}>
                <div className={s.score_card__label}>Timing</div>
                <div className={s.score_card__value}>{Number(scoreModal.score.timingScore)}/100</div>
              </div>
            </div>
            <div className={s.score_tags}>
              <Tag color={scoreModal.score.recommendation === 'pursue' ? 'green' : scoreModal.score.recommendation === 'consider' ? 'orange' : 'red'}>
                {(scoreModal.score.recommendation as string)?.toUpperCase()}
              </Tag>
              <Tag>Effort: {String(scoreModal.score.effortLevel)}</Tag>
              <Tag>ROI: {String(scoreModal.score.expectedROI)}</Tag>
              <Tag>Risk: {String(scoreModal.score.riskLevel)}</Tag>
            </div>
            <p>{String(scoreModal.score.reasoning)}</p>
            {scoreModal.score.suggestedApproach ? (
              <div className={s.approach_card}>
                <div className={s.approach_label}>Suggested Approach</div>
                <p className={s.approach_text}>{String(scoreModal.score.suggestedApproach)}</p>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* Auto Draft Modal */}
      <Modal
        title={`Draft from Trend: ${draftModal.trend?.title ?? ''}`}
        open={draftModal.open}
        onCancel={() => setDraftModal({ open: false, trend: null, draft: null })}
        footer={
          draftModal.draft ? (
            <Button
              type="primary"
              icon={<FontAwesomeIcon icon={faPenToSquare} />}
              onClick={() => navigate('/content/new')}
            >
              Open in Composer
            </Button>
          ) : null
        }
        width={600}
      >
        {!draftModal.draft ? (
          <div className={s.loading_container}><Spin size="large" /></div>
        ) : (
          <div>
            {draftModal.draft.hook ? (
              <div className={s.hook_card}>
                <strong>Hook:</strong> {String(draftModal.draft.hook)}
              </div>
            ) : null}
            <div className={s.draft_section}>
              <strong>Caption</strong>
              <p className={s.draft_caption}>{String(draftModal.draft.caption)}</p>
            </div>
            <div className={s.score_tags}>
              {draftModal.draft.postType ? <Tag color="blue">{String(draftModal.draft.postType)}</Tag> : null}
              {(draftModal.draft.hashtags as string[])?.map((h, i) => <Tag key={i}>#{h}</Tag>)}
            </div>
            {draftModal.draft.callToAction ? <p><strong>CTA:</strong> {String(draftModal.draft.callToAction)}</p> : null}
            {draftModal.draft.firstComment ? <p><strong>First Comment:</strong> {String(draftModal.draft.firstComment)}</p> : null}
            {draftModal.draft.mediaDescription ? (
              <div className={s.media_direction}>
                <div className={s.media_direction__label}>Media Direction</div>
                <p className={s.media_direction__text}>{String(draftModal.draft.mediaDescription)}</p>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
