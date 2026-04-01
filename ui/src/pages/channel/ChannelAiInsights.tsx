import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Typography, Spin, Empty, Tag, List } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot, faLightbulb, faClock, faBullseye, faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { useRunAgentMutation } from '@/store/endpoints/agents';

const { Text, Title, Paragraph } = Typography;

interface InsightItem {
  type: string;
  title: string;
  description: string;
  priority?: string;
}

export function ChannelAiInsights() {
  const { platform } = useParams<{ platform: string }>();
  const [runAgent, { isLoading }] = useRunAgentMutation();
  const [insights, setInsights] = useState<Record<string, unknown> | null>(null);

  const fetchInsights = async () => {
    try {
      const result = await runAgent({
        agentType: 'ANALYTICS',
        input: {
          action: 'channel_insights',
          platform: platform?.toUpperCase(),
          context: `Analyze my ${platform} channel performance. Provide specific recommendations for content gaps, optimal posting times, audience engagement strategies, and growth opportunities. Be actionable and specific.`,
        },
      }).unwrap();
      setInsights(result.data as Record<string, unknown>);
    } catch { /* */ }
  };

  const insightIcon = (type: string) => {
    switch (type) {
      case 'content_gap': return faLightbulb;
      case 'timing': return faClock;
      case 'audience': return faBullseye;
      case 'growth': return faChartLine;
      default: return faLightbulb;
    }
  };

  const insightColor = (priority?: string) => {
    if (priority === 'high') return '#ef4444';
    if (priority === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  const parsedInsights: InsightItem[] = (() => {
    if (!insights) return [];
    // Agent may return structured data or raw text
    if (Array.isArray(insights.recommendations)) return insights.recommendations as InsightItem[];
    if (insights.analysis && typeof insights.analysis === 'string') {
      return [{ type: 'analysis', title: 'AI Analysis', description: insights.analysis }];
    }
    if (insights.result && typeof insights.result === 'string') {
      return [{ type: 'analysis', title: 'AI Analysis', description: insights.result }];
    }
    return [];
  })();

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>
            <FontAwesomeIcon icon={faRobot} style={{ color: '#6366f1', marginRight: 8 }} />
            AI-Powered Channel Insights
          </Title>
          <Button type="primary" onClick={fetchInsights} loading={isLoading}>
            {insights ? 'Refresh Analysis' : 'Generate Insights'}
          </Button>
        </div>

        {!insights && !isLoading && (
          <Paragraph type="secondary">
            Click &quot;Generate Insights&quot; to get AI-powered analysis of your {platform} channel,
            including content recommendations, optimal posting times, audience analysis, and growth strategies.
          </Paragraph>
        )}

        {isLoading && <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}
      </Card>

      {parsedInsights.length > 0 && (
        <List
          dataSource={parsedInsights}
          renderItem={(item) => (
            <Card
              size="small"
              style={{ marginBottom: 12, borderLeft: `3px solid ${insightColor(item.priority)}` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <FontAwesomeIcon
                  icon={insightIcon(item.type)}
                  style={{ color: insightColor(item.priority), marginTop: 4 }}
                />
                <div style={{ flex: 1 }}>
                  <Text strong>{item.title}</Text>
                  {item.priority && (
                    <Tag
                      style={{ marginLeft: 8 }}
                      color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'green'}
                    >
                      {item.priority}
                    </Tag>
                  )}
                  <Paragraph style={{ marginTop: 4, marginBottom: 0 }} type="secondary">
                    {item.description}
                  </Paragraph>
                </div>
              </div>
            </Card>
          )}
        />
      )}

      {insights && parsedInsights.length === 0 && (
        <Card>
          <Paragraph>{JSON.stringify(insights, null, 2)}</Paragraph>
        </Card>
      )}

      {!insights && !isLoading && <Empty description="No insights generated yet" />}
    </div>
  );
}
