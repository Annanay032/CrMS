import { Typography } from 'antd';
import { UnifiedChat } from '@/components/ai/UnifiedChat';
import s from './styles/AiAssistantPage.module.scss';

const { Title } = Typography;

export function AiAssistantPage() {
  return (
    <div className={s.page}>
      <Title level={2} className={s.page__title}>AI Assistant</Title>
      <UnifiedChat mode="fullpage" />
    </div>
  );
}
