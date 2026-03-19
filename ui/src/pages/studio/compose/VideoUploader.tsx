import { Typography, Upload, Button, Tag, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faFilm, faTrash, faImage } from '@fortawesome/free-solid-svg-icons';
import type { VideoFileInfo } from './types';
import styles from './compose.module.scss';

const { Text } = Typography;

interface Props {
  postType: string;
  videoFile: VideoFileInfo | null;
  thumbnailUrl?: string;
  onSetVideoFile: React.Dispatch<React.SetStateAction<VideoFileInfo | null>>;
  onSetThumbnailUrl: (url: string | undefined) => void;
  onSetFormThumbnail: (url: string) => void;
}

export function VideoUploader({ postType, videoFile, thumbnailUrl, onSetVideoFile, onSetThumbnailUrl, onSetFormThumbnail }: Props) {
  const isVertical = ['REEL', 'SHORT'].includes(postType);
  const label = postType === 'REEL' ? 'Reel' : postType === 'SHORT' ? 'Short' : 'Video';

  return (
    <div className={styles.media_zone}>
      <div className={styles.media_zone_header}>
        <Text strong style={{ fontSize: 12 }}>
          <FontAwesomeIcon icon={faVideo} style={{ marginRight: 6 }} />
          {label}
        </Text>
        {postType === 'REEL' && <Tag color="purple">9:16 vertical</Tag>}
        {postType === 'SHORT' && <Tag color="blue">≤60s vertical</Tag>}
      </div>

      {videoFile ? (
        <div className={styles.video_preview}>
          <video
            src={videoFile.url}
            controls
            className={`${styles.video_player} ${isVertical ? styles['video_player--vertical'] : ''}`}
          />
          <div className={styles.video_meta}>
            <Text style={{ fontSize: 12, fontWeight: 500 }}>{videoFile.name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
              {videoFile.duration ? ` • ${Math.floor(videoFile.duration / 60)}:${String(Math.floor(videoFile.duration % 60)).padStart(2, '0')}` : ''}
            </Text>
            <Button size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} onClick={() => { URL.revokeObjectURL(videoFile.url); onSetVideoFile(null); }} style={{ marginTop: 4 }}>Remove</Button>

            {/* Thumbnail */}
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Custom Thumbnail</Text>
              {thumbnailUrl ? (
                <div className={styles.media_thumb} style={{ width: 80, height: 80 }}>
                  <img src={thumbnailUrl} alt="thumb" />
                  <div className={styles.media_overlay}>
                    <Button shape="circle" size="small" danger icon={<FontAwesomeIcon icon={faTrash} style={{ fontSize: 10 }} />} onClick={() => onSetThumbnailUrl(undefined)} />
                  </div>
                </div>
              ) : (
                <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = () => { onSetThumbnailUrl(reader.result as string); onSetFormThumbnail(reader.result as string); };
                  reader.readAsDataURL(file);
                  return false;
                }}>
                  <Button size="small" icon={<FontAwesomeIcon icon={faImage} />}>Upload Thumbnail</Button>
                </Upload>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Upload.Dragger
          accept="video/*"
          showUploadList={false}
          beforeUpload={(file) => {
            const url = URL.createObjectURL(file);
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.onloadedmetadata = () => {
              if (postType === 'SHORT' && vid.duration > 60) message.warning('Shorts must be 60 seconds or less');
              onSetVideoFile({ url, name: file.name, size: file.size, duration: vid.duration });
              URL.revokeObjectURL(vid.src);
            };
            vid.src = url;
            return false;
          }}
          className={styles.uploader}
        >
          <div className={styles.uploader_body}>
            <FontAwesomeIcon icon={faFilm} className={styles.uploader_icon} />
            <Text strong className={styles.uploader_title}>Drop a video or <span className={styles.uploader_link}>browse</span></Text>
            <Text type="secondary" className={styles.uploader_hint}>
              {postType === 'REEL' ? 'MP4, MOV • 9:16 aspect ratio • up to 90 seconds'
                : postType === 'SHORT' ? 'MP4, MOV • 9:16 vertical • max 60 seconds'
                  : 'MP4, MOV, WebM • any aspect ratio'}
            </Text>
          </div>
        </Upload.Dragger>
      )}
    </div>
  );
}
