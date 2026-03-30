import { useState } from 'react';
import { Input, Button, Upload, Spin, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPaperPlane, faCheck, faPaperclip, faPhotoFilm } from '@fortawesome/free-solid-svg-icons';
import { MediaLibraryPicker } from '../uploaders';
import { uploadFileToServer } from '../helpers';
import type { ChatMessage } from '../types';
import styles from '../styles/compose.module.scss';

interface Props {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onApply: (msg: ChatMessage) => void;
  onMediaUpload: (url: string, type: 'image' | 'video') => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatPanel({ messages, input, loading, onInputChange, onSend, onApply, onMediaUpload, chatEndRef }: Props) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const url = await uploadFileToServer(file);
    setUploading(false);
    if (!url) { message.error('Upload failed'); return; }
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    onMediaUpload(url, type);
    message.success(`${type === 'video' ? 'Video' : 'Image'} added to your post`);
  };

  return (
    <>
      <div className={styles.chat_messages}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.chat_msg} ${styles[`chat_msg--${msg.role}`]}`}>
            {msg.role === 'ai' && (
              <div className={styles.chat_avatar}>
                <FontAwesomeIcon icon={faRobot} />
              </div>
            )}
            <div className={styles.chat_bubble}>
              {msg.mediaUrl && (
                <div className={styles.chat_media}>
                  {msg.mediaType === 'video' ? (
                    <video src={msg.mediaUrl} controls className={styles.chat_media_preview} />
                  ) : (
                    <img src={msg.mediaUrl} alt="" className={styles.chat_media_preview} />
                  )}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              {msg.action === 'apply' && (
                <Button size="small" type="link" icon={<FontAwesomeIcon icon={faCheck} />} onClick={() => onApply(msg)} style={{ padding: '4px 0', marginTop: 4 }}>
                  Apply to Post
                </Button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.chat_msg} ${styles['chat_msg--ai']}`}>
            <div className={styles.chat_avatar}><FontAwesomeIcon icon={faRobot} /></div>
            <div className={styles.chat_bubble}><div className={styles.chat_thinking}>Thinking...</div></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className={styles.chat_input}>
        <div className={styles.chat_input_row}>
          <Upload
            accept="image/*,video/*"
            showUploadList={false}
            beforeUpload={(file) => { handleFileUpload(file); return false; }}
            disabled={uploading}
          >
            <Button
              type="text" size="small"
              icon={uploading ? <Spin size="small" /> : <FontAwesomeIcon icon={faPaperclip} />}
              style={{ color: '#94a3b8' }}
              title="Upload media"
            />
          </Upload>
          <Button
            type="text" size="small"
            icon={<FontAwesomeIcon icon={faPhotoFilm} />}
            style={{ color: '#94a3b8' }}
            title="Import from Media Library"
            onClick={() => setLibraryOpen(true)}
          />
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onPressEnter={onSend}
            placeholder="Describe what you want to create..."
            style={{ flex: 1 }}
            suffix={
              <Button
                type="text" size="small"
                icon={<FontAwesomeIcon icon={faPaperPlane} />}
                onClick={onSend}
                disabled={!input.trim() || loading}
                style={{ color: input.trim() ? '#6366f1' : '#94a3b8' }}
              />
            }
          />
        </div>
      </div>

      <MediaLibraryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        accept="all"
        multiple
        onSelect={(urls) => {
          for (const url of urls) {
            const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url);
            onMediaUpload(url, isVideo ? 'video' : 'image');
          }
        }}
      />
    </>
  );
}
