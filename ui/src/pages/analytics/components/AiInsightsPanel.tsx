import { Row, Col, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

const { Text, Paragraph } = Typography;

interface AiInsightsPanelProps {
  insights: Record<string, unknown>;
}

export function AiInsightsPanel({ insights }: AiInsightsPanelProps) {
  const summary = insights.summary as string | undefined;
  const insightsList = (insights.insights as string[]) ?? [];
  const recommendations = (insights.recommendations as string[]) ?? [];

  return (
    <div>
      {summary && <Paragraph>{summary}</Paragraph>}

      <Row gutter={[12, 12]}>
        {insightsList.map((insight, i) => (
          <Col key={i} xs={24} md={12}>
            <div style={{ padding: 12, borderRadius: 8, background: '#eef2ff', fontSize: 14 }}>{insight}</div>
          </Col>
        ))}
      </Row>

      {recommendations.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Recommendations</Text>
          <ul style={{ paddingLeft: 0, marginTop: 8, listStyle: 'none' }}>
            {recommendations.map((r, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 14, color: '#475569' }}>
                <FontAwesomeIcon icon={faArrowRight} style={{ color: '#6366f1', marginTop: 4 }} /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
