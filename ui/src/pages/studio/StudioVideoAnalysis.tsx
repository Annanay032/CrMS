import { useState } from 'react';
import {
  Card, Button, Input, Typography, Row, Col, Tag,
  Empty, Spin, message, Tooltip, List,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine, faPlay, faEye, faRotateRight,
  faTriangleExclamation, faLightbulb, faMagnifyingGlassChart,
} from '@fortawesome/free-solid-svg-icons';
import { useStudioVideoAnalysisMutation } from '@/store/endpoints/studio';
import styles from './StudioVideoAnalysis.module.scss';

const { Text, Title } = Typography;

interface RetentionPoint {
  time: number;
  percent: number;
}

interface RewatchHotspot {
  start: number;
  end: number;
  intensity: number;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StudioVideoAnalysis() {
  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState('YOUTUBE');
  const [retention, setRetention] = useState<RetentionPoint[]>([]);
  const [hotspots, setHotspots] = useState<RewatchHotspot[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [dropOffs, setDropOffs] = useState<number[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analyzeApi, { isLoading }] = useStudioVideoAnalysisMutation();

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      message.warning('Please enter a video URL');
      return;
    }
    try {
      const res = await analyzeApi({ videoUrl, platform }).unwrap();
      if (res.success && res.data) {
        setRetention(res.data.retention ?? []);
        setHotspots(res.data.rewatchHotspots ?? []);
        setMetrics(res.data.engagementMetrics ?? {});
        setDropOffs(res.data.dropOffPoints ?? []);
        setSuggestions(res.data.suggestions ?? []);
        message.success('Analysis complete!');
      }
    } catch {
      message.error('Failed to analyze video');
    }
  };

  const hasResults = retention.length > 0 || Object.keys(metrics).length > 0;

  return (
    <div className={styles.analysis}>
      <div className={styles.analysis__header}>
        <Title level={4} style={{ margin: 0 }}>
          <FontAwesomeIcon icon={faMagnifyingGlassChart} style={{ marginRight: 8, color: '#6366f1' }} />
          Video Analysis
        </Title>
        <Text type="secondary">Deep-dive into video performance, retention, and rewatch patterns</Text>
      </div>

      {/* Input */}
      <Card className={styles.analysis__input}>
        <Row gutter={[16, 12]} align="middle">
          <Col flex="auto">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste a YouTube, TikTok, or video URL..."
              size="large"
              prefix={<FontAwesomeIcon icon={faPlay} style={{ color: '#94a3b8' }} />}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<FontAwesomeIcon icon={faChartLine} />}
              onClick={handleAnalyze}
              loading={isLoading}
              disabled={!videoUrl.trim()}
            >
              Analyze
            </Button>
          </Col>
        </Row>
      </Card>

      {isLoading && (
        <div className={styles.analysis__loading}>
          <Spin size="large" tip="Analyzing video performance..." />
        </div>
      )}

      {!isLoading && !hasResults && (
        <Empty
          description="Paste a video URL and analyze to see retention data and insights"
          className={styles.analysis__empty}
        />
      )}

      {hasResults && (
        <>
          {/* Engagement Metrics */}
          <Row gutter={[16, 16]} className={styles.analysis__metrics}>
            {Object.entries(metrics).map(([key, value]) => (
              <Col xs={12} sm={6} key={key}>
                <Card className={styles.analysis__metric_card} size="small">
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <div className={styles.analysis__metric_value}>
                    {typeof value === 'number' && value < 1
                      ? `${(value * 100).toFixed(1)}%`
                      : typeof value === 'number' && value > 100
                        ? `${Math.round(value)}s`
                        : value}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Retention Curve */}
          {retention.length > 0 && (
            <Card className={styles.analysis__section} title={
              <span>
                <FontAwesomeIcon icon={faEye} style={{ marginRight: 8, color: '#6366f1' }} />
                Retention Curve
              </span>
            }>
              <div className={styles.analysis__retention}>
                <div className={styles.analysis__retention_chart}>
                  {retention.map((point, idx) => (
                    <Tooltip key={idx} title={`${formatTime(point.time)} — ${point.percent}% watching`}>
                      <div
                        className={styles.analysis__retention_bar}
                        style={{
                          height: `${point.percent}%`,
                          backgroundColor: point.percent > 70 ? '#10b981' : point.percent > 40 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </Tooltip>
                  ))}
                </div>
                <div className={styles.analysis__retention_labels}>
                  <Text type="secondary" style={{ fontSize: 10 }}>Start</Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>End</Text>
                </div>
              </div>
            </Card>
          )}

          {/* Rewatch Hotspots */}
          {hotspots.length > 0 && (
            <Card className={styles.analysis__section} title={
              <span>
                <FontAwesomeIcon icon={faRotateRight} style={{ marginRight: 8, color: '#f59e0b' }} />
                Rewatch Hotspots
              </span>
            }>
              <Row gutter={[12, 12]}>
                {hotspots.map((spot, idx) => (
                  <Col xs={24} sm={12} key={idx}>
                    <div className={styles.analysis__hotspot}>
                      <div className={styles.analysis__hotspot_bar}>
                        <div
                          className={styles.analysis__hotspot_fill}
                          style={{ width: `${(spot.intensity / 10) * 100}%` }}
                        />
                      </div>
                      <div className={styles.analysis__hotspot_info}>
                        <Tag color="gold">{formatTime(spot.start)} – {formatTime(spot.end)}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Intensity: {spot.intensity}/10
                        </Text>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {/* Drop-off Points */}
          {dropOffs.length > 0 && (
            <Card className={styles.analysis__section} title={
              <span>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 8, color: '#ef4444' }} />
                Drop-off Points
              </span>
            }>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {dropOffs.map((t, idx) => (
                  <Tag key={idx} color="red">{formatTime(t)}</Tag>
                ))}
              </div>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                Significant viewer drop-off detected at these timestamps. Consider improving pacing or adding hooks before these points.
              </Text>
            </Card>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <Card className={styles.analysis__section} title={
              <span>
                <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: 8, color: '#f97316' }} />
                AI Suggestions
              </span>
            }>
              <List
                size="small"
                dataSource={suggestions}
                renderItem={(item) => (
                  <List.Item>
                    <Text style={{ fontSize: 13 }}>{item}</Text>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
