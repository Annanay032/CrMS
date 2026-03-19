import { useState } from 'react';
import { Card, Button, Input, Space, Typography, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faGripVertical, faMagicWandSparkles, faScissors } from '@fortawesome/free-solid-svg-icons';

const { Text } = Typography;
const { TextArea } = Input;

export interface ThreadPart {
  caption: string;
  mediaUrls?: string[];
}

interface ThreadComposerProps {
  platform: string;
  parts: ThreadPart[];
  onChange: (parts: ThreadPart[]) => void;
  charLimit?: number;
  maxParts?: number;
}

const PLATFORM_THREAD_LIMITS: Record<string, number> = {
  TWITTER: 280,
  THREADS: 500,
  BLUESKY: 300,
  LINKEDIN: 3000,
};

/**
 * Thread composer — lets users create multi-part threads with drag-reorder.
 * Supports auto-splitting long text into thread parts.
 */
export function ThreadComposer({
  platform,
  parts,
  onChange,
  charLimit,
  maxParts = 25,
}: ThreadComposerProps) {
  const limit = charLimit ?? PLATFORM_THREAD_LIMITS[platform] ?? 500;
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const updatePart = (index: number, caption: string) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], caption };
    onChange(updated);
  };

  const addPart = () => {
    if (parts.length >= maxParts) return;
    onChange([...parts, { caption: '' }]);
  };

  const removePart = (index: number) => {
    if (parts.length <= 2) return; // minimum 2 parts for a thread
    onChange(parts.filter((_, i) => i !== index));
  };

  const autoSplit = () => {
    // Concatenate all parts into one string, then split by char limit
    const fullText = parts.map((p) => p.caption).join(' ');
    const words = fullText.split(/\s+/);
    const newParts: ThreadPart[] = [];
    let current = '';

    for (const word of words) {
      if ((current + ' ' + word).trim().length > limit) {
        if (current) newParts.push({ caption: current.trim() });
        current = word;
      } else {
        current = current ? current + ' ' + word : word;
      }
    }
    if (current) newParts.push({ caption: current.trim() });

    // Ensure at least 2 parts
    while (newParts.length < 2) newParts.push({ caption: '' });

    onChange(newParts.slice(0, maxParts));
  };

  const handleDragStart = (index: number) => setDragIdx(index);

  const handleDrop = (targetIndex: number) => {
    if (dragIdx === null || dragIdx === targetIndex) return;
    const updated = [...parts];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(targetIndex, 0, moved);
    onChange(updated);
    setDragIdx(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong>Thread ({parts.length} parts)</Text>
        <Space>
          <Tooltip title="Auto-split by character limit">
            <Button
              size="small"
              icon={<FontAwesomeIcon icon={faScissors} />}
              onClick={autoSplit}
            >
              Auto Split
            </Button>
          </Tooltip>
          <Button
            size="small"
            type="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={addPart}
            disabled={parts.length >= maxParts}
          >
            Add Part
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {parts.map((part, index) => (
          <Card
            key={index}
            size="small"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            style={{
              borderLeft: `3px solid ${index === 0 ? '#6366f1' : '#e2e8f0'}`,
              opacity: dragIdx === index ? 0.5 : 1,
              cursor: 'grab',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
                <FontAwesomeIcon icon={faGripVertical} style={{ color: '#94a3b8', fontSize: 12 }} />
                <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>{index + 1}</Text>
              </div>
              <div style={{ flex: 1 }}>
                <TextArea
                  value={part.caption}
                  onChange={(e) => updatePart(index, e.target.value)}
                  rows={3}
                  placeholder={index === 0 ? 'First post in thread...' : `Part ${index + 1}...`}
                  maxLength={limit}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text
                    type={part.caption.length > limit ? 'danger' : part.caption.length > limit * 0.9 ? 'warning' : 'secondary'}
                    style={{ fontSize: 11 }}
                  >
                    {part.caption.length} / {limit}
                  </Text>
                  {parts.length > 2 && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />}
                      onClick={() => removePart(index)}
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
