import { Typography, Input, Button, Tag, Space, Upload } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faArrowUp, faArrowDown, faImage, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { ThreadEntry } from './types';
import styles from './compose.module.scss';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  entries: ThreadEntry[];
  onSetEntries: React.Dispatch<React.SetStateAction<ThreadEntry[]>>;
  charLimit: number;
  platform: string;
}

export function ThreadEditor({ entries, onSetEntries, charLimit, platform }: Props) {
  const limit = platform === 'TWITTER' ? 280 : charLimit;

  return (
    <div className={styles.media_zone}>
      <div className={styles.media_zone_header}>
        <Text strong style={{ fontSize: 12 }}>
          Thread ({entries.length} {entries.length === 1 ? 'post' : 'posts'})
        </Text>
        <Button
          size="small"
          icon={<FontAwesomeIcon icon={faPlus} />}
          onClick={() => onSetEntries((prev) => [...prev, { id: String(Date.now()), text: '' }])}
        >
          Add Post
        </Button>
      </div>

      <div className={styles.thread}>
        {entries.map((entry, idx) => (
          <div key={entry.id} className={styles.thread_entry}>
            <div className={styles.thread_connector}>
              <div className={styles.thread_dot} />
              {idx < entries.length - 1 && <div className={styles.thread_line} />}
            </div>
            <div className={styles.thread_content}>
              <div className={styles.thread_head}>
                <Tag>{idx + 1}/{entries.length}</Tag>
                <Space size={4}>
                  {idx > 0 && (
                    <Button size="small" type="text" icon={<FontAwesomeIcon icon={faArrowUp} style={{ fontSize: 10 }} />}
                      onClick={() => onSetEntries((prev) => { const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a; })}
                    />
                  )}
                  {idx < entries.length - 1 && (
                    <Button size="small" type="text" icon={<FontAwesomeIcon icon={faArrowDown} style={{ fontSize: 10 }} />}
                      onClick={() => onSetEntries((prev) => { const a = [...prev]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a; })}
                    />
                  )}
                  {entries.length > 1 && (
                    <Button size="small" type="text" danger icon={<FontAwesomeIcon icon={faMinus} style={{ fontSize: 10 }} />}
                      onClick={() => onSetEntries((prev) => prev.filter((_, i) => i !== idx))}
                    />
                  )}
                </Space>
              </div>
              <TextArea
                value={entry.text}
                onChange={(e) => onSetEntries((prev) => prev.map((ent, i) => i === idx ? { ...ent, text: e.target.value } : ent))}
                autoSize={{ minRows: 2, maxRows: 6 }}
                placeholder={idx === 0 ? 'Start your thread...' : 'Continue...'}
                style={{ marginBottom: 4 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>{entry.text.length} / {limit}</Text>
                {entry.media ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <img src={entry.media} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                    <Button size="small" type="text" danger icon={<FontAwesomeIcon icon={faTrash} style={{ fontSize: 10 }} />}
                      onClick={() => onSetEntries((prev) => prev.map((ent, i) => i === idx ? { ...ent, media: undefined } : ent))}
                    />
                  </div>
                ) : (
                  <Upload accept="image/*" showUploadList={false}
                    beforeUpload={(file) => {
                      const reader = new FileReader();
                      reader.onload = () => onSetEntries((prev) => prev.map((ent, i) => i === idx ? { ...ent, media: reader.result as string } : ent));
                      reader.readAsDataURL(file);
                      return false;
                    }}
                  >
                    <Button size="small" type="text" icon={<FontAwesomeIcon icon={faImage} style={{ fontSize: 10, color: '#94a3b8' }} />} />
                  </Upload>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
