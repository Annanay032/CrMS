import { useState } from 'react';
import { Card, Button, Input, Typography, Row, Col, Slider, Tag, Empty, Spin, message, Select } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faScissors, faFilm, faWandMagicSparkles, faClock,
  faRankingStar, faPlay, faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { useStudioCreateClipMutation } from '@/store/endpoints/studio';
import styles from './StudioVideoLab.module.scss';

const { Text, Title } = Typography;

interface ClipSuggestion {
  start: number;
  end: number;
  title: string;
  score: number;
}

interface SuggestedCut {
  start: number;
  end: number;
  rationale: string;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StudioVideoLab() {
  const [videoUrl, setVideoUrl] = useState('');
  const [maxDuration, setMaxDuration] = useState(60);
  const [clipStyle, setClipStyle] = useState<string>();
  const [clips, setClips] = useState<ClipSuggestion[]>([]);
  const [suggestedCuts, setSuggestedCuts] = useState<SuggestedCut[]>([]);
  const [createClipApi, { isLoading }] = useStudioCreateClipMutation();

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      message.warning('Please enter a video URL');
      return;
    }
    try {
      const res = await createClipApi({ videoUrl, duration: maxDuration, style: clipStyle }).unwrap();
      if (res.success && res.data) {
        setClips(res.data.clips ?? []);
        setSuggestedCuts(res.data.suggestedCuts ?? []);
        message.success('Clip suggestions ready!');
      }
    } catch {
      message.error('Failed to analyze video');
    }
  };

  return (
    <div className={styles.videolab}>
      <div className={styles.videolab__header}>
        <Title level={4} style={{ margin: 0 }}>
          <FontAwesomeIcon icon={faScissors} style={{ marginRight: 8, color: '#6366f1' }} />
          Video Lab
        </Title>
        <Text type="secondary">Extract shorts, clips, and highlights from long-form content</Text>
      </div>

      {/* Input Section */}
      <Card className={styles.videolab__input}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Video URL</Text>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste a YouTube, TikTok, or any video URL..."
              size="large"
              prefix={<FontAwesomeIcon icon={faFilm} style={{ color: '#94a3b8' }} />}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              Max Clip Duration: {maxDuration}s
            </Text>
            <Slider
              min={5}
              max={180}
              value={maxDuration}
              onChange={setMaxDuration}
              marks={{ 15: '15s', 30: '30s', 60: '60s', 90: '90s', 180: '3m' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Style</Text>
            <Select
              value={clipStyle}
              onChange={setClipStyle}
              placeholder="Auto detect"
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: 'hook-driven', label: 'Hook Driven (viral openers)' },
                { value: 'highlights', label: 'Highlights (key moments)' },
                { value: 'educational', label: 'Educational (informative segments)' },
                { value: 'controversial', label: 'Controversial (debate-worthy)' },
                { value: 'emotional', label: 'Emotional (high-impact moments)' },
              ]}
            />
          </Col>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}
              onClick={handleAnalyze}
              loading={isLoading}
              disabled={!videoUrl.trim()}
            >
              Find Best Clips
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Results */}
      {isLoading && (
        <div className={styles.videolab__loading}>
          <Spin size="large" tip="AI is analyzing your video for the best moments..." />
        </div>
      )}

      {!isLoading && clips.length === 0 && suggestedCuts.length === 0 && (
        <Empty
          description="Paste a video URL and click 'Find Best Clips' to get started"
          className={styles.videolab__empty}
        />
      )}

      {clips.length > 0 && (
        <div className={styles.videolab__results}>
          <Title level={5}>
            <FontAwesomeIcon icon={faRankingStar} style={{ marginRight: 8, color: '#f59e0b' }} />
            Top Clip Suggestions
          </Title>
          <Row gutter={[16, 16]}>
            {clips.map((clip, idx) => (
              <Col xs={24} sm={12} lg={8} key={idx}>
                <Card
                  className={styles.videolab__clip_card}
                  hoverable
                  size="small"
                >
                  <div className={styles.videolab__clip_header}>
                    <Tag color="purple">#{idx + 1}</Tag>
                    <Tag color={clip.score >= 80 ? 'green' : clip.score >= 60 ? 'gold' : 'default'}>
                      {clip.score}/100 virality
                    </Tag>
                  </div>
                  <Text strong style={{ fontSize: 14, display: 'block', margin: '8px 0' }}>{clip.title}</Text>
                  <div className={styles.videolab__clip_time}>
                    <FontAwesomeIcon icon={faClock} style={{ marginRight: 4 }} />
                    <Text type="secondary">{formatTime(clip.start)}</Text>
                    <FontAwesomeIcon icon={faArrowRight} style={{ margin: '0 6px', fontSize: 10 }} />
                    <Text type="secondary">{formatTime(clip.end)}</Text>
                    <Tag style={{ marginLeft: 8 }}>{Math.round(clip.end - clip.start)}s</Tag>
                  </div>
                  <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<FontAwesomeIcon icon={faPlay} />}
                    style={{ marginTop: 8 }}
                  >
                    Preview
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {suggestedCuts.length > 0 && (
        <div className={styles.videolab__cuts}>
          <Title level={5}>
            <FontAwesomeIcon icon={faScissors} style={{ marginRight: 8, color: '#6366f1' }} />
            Additional Segments
          </Title>
          {suggestedCuts.map((cut, idx) => (
            <Card key={idx} size="small" className={styles.videolab__cut_card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Tag>{formatTime(cut.start)} – {formatTime(cut.end)}</Tag>
                <Text style={{ fontSize: 13 }}>{cut.rationale}</Text>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
