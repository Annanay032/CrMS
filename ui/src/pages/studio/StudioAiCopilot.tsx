import { UnifiedChat } from '@/components/ai/UnifiedChat';
import styles from './StudioAiCopilot.module.scss';

export function StudioAiCopilot() {
  return (
    <div className={styles.copilot}>
      <UnifiedChat
        mode="embedded"
        contextHint="Ask me anything about content creation..."
      />
    </div>
  );
}
