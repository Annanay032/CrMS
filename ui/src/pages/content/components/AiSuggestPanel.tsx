import { Card, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'antd';

const { Text, Paragraph } = Typography;

interface AiSuggestion {
  title?: string;
  caption?: string;
  hashtags?: string[];
  postType?: string;
}

interface AiSuggestPanelProps {
  suggestions: AiSuggestion[];
  loading: boolean;
  onGenerate: () => void;
  onApply: (suggestion: AiSuggestion) => void;
}

export function AiSuggestPanel({ suggestions, loading, onGenerate, onApply }: AiSuggestPanelProps) {
  return (
    <Card title={<><FontAwesomeIcon icon={faRobot} style={{ color: '#4f46e5', marginRight: 8 }} />AI Assist</>}>
      <Button block style={{ marginBottom: 16 }} onClick={onGenerate} loading={loading} icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}>
        Generate Ideas
      </Button>
      {suggestions.map((s, i) => (
        <Card key={i} size="small" hoverable style={{ marginBottom: 8 }} onClick={() => onApply(s)}>
          <Text strong>{s.title ?? `Idea ${i + 1}`}</Text>
          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 12, margin: '4px 0 0' }}>
            {s.caption}
          </Paragraph>
        </Card>
      ))}
    </Card>
  );
}
