import { Typography, Upload, Button, Tag, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobileScreenButton, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { VideoFileInfo } from './types';
import styles from './compose.module.scss';

const { Text } = Typography;

interface Props {
  mediaUrls: string[];
  videoFile: VideoFileInfo | null;
  onSetMediaUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onSetVideoFile: React.Dispatch<React.SetStateAction<VideoFileInfo | null>>;
}

export function StoryUploader({ mediaUrls, videoFile, onSetMediaUrls, onSetVideoFile }: Props) {
  const hasMedia = mediaUrls.length > 0 || !!videoFile;

  return (
    <div className={styles.media_zone}>
      <div className={styles.media_zone_header}>
        <Text strong style={{ fontSize: 12 }}>
          <FontAwesomeIcon icon={faMobileScreenButton} style={{ marginRight: 6 }} />
          Story Media
        </Text>
        <Tag color="magenta">9:16 • 1080×1920</Tag>
      </div>

      {hasMedia ? (
        <div className={styles.story_preview}>
          <div className={styles.story_frame}>
            {videoFile ? (
              <video src={videoFile.url} controls className={styles.story_media} />
            ) : (
              <img src={mediaUrls[0]} alt="" className={styles.story_media} />
            )}
          </div>
          <Button
            size="small" danger icon={<FontAwesomeIcon icon={faTrash} />}
            onClick={() => { if (videoFile) { URL.revokeObjectURL(videoFile.url); onSetVideoFile(null); } onSetMediaUrls([]); }}
            style={{ marginTop: 8 }}
          >
            Remove
          </Button>
        </div>
      ) : (
        <Upload.Dragger
          accept="image/*,video/*"
          showUploadList={false}
          beforeUpload={(file) => {
            if (file.type.startsWith('video/')) {
              const url = URL.createObjectURL(file);
              const vid = document.createElement('video');
              vid.preload = 'metadata';
              vid.onloadedmetadata = () => {
                if (vid.duration > 60) message.warning('Stories should be under 60 seconds');
                onSetVideoFile({ url, name: file.name, size: file.size, duration: vid.duration });
                URL.revokeObjectURL(vid.src);
              };
              vid.src = url;
            } else {
              const reader = new FileReader();
              reader.onload = () => onSetMediaUrls([reader.result as string]);
              reader.readAsDataURL(file);
            }
            return false;
          }}
          className={styles.uploader}
        >
          <div className={styles.uploader_body}>
            <FontAwesomeIcon icon={faMobileScreenButton} className={styles.uploader_icon} style={{ color: '#e11d9e' }} />
            <Text strong className={styles.uploader_title}>Drop an image or video for your Story</Text>
            <Text type="secondary" className={styles.uploader_hint}>9:16 vertical • 1080×1920 • image or video up to 60s</Text>
          </div>
        </Upload.Dragger>
      )}
    </div>
  );
}
