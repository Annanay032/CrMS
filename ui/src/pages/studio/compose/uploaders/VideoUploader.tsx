import { useState } from 'react';
import { Typography, Upload, Button, Tag, message, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faFilm, faTrash, faImage, faPhotoFilm } from '@fortawesome/free-solid-svg-icons';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { uploadFileToServer } from '../helpers';
import type { VideoFileInfo } from '../types';
import styles from '../styles/compose.module.scss';

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
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleUpload = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      return await uploadFileToServer(file);
    } catch {
      message.error('Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

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
          disabled={uploading}
          beforeUpload={(file) => {
            const previewUrl = URL.createObjectURL(file);
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.onloadedmetadata = async () => {
              if (postType === 'SHORT' && vid.duration > 60) message.warning('Shorts must be 60 seconds or less');
              const serverUrl = await handleUpload(file);
              onSetVideoFile({ url: previewUrl, serverUrl: serverUrl ?? undefined, name: file.name, size: file.size, duration: vid.duration });
            };
            vid.src = previewUrl;
            return false;
          }}
          className={styles.uploader}
        >
          <div className={styles.uploader_body}>
            {uploading ? <Spin size="large" /> : <FontAwesomeIcon icon={faFilm} className={styles.uploader_icon} />}
            <Text strong className={styles.uploader_title}>{uploading ? 'Uploading...' : <>Drop a video or <span className={styles.uploader_link}>browse</span></>}</Text>
            <Text type="secondary" className={styles.uploader_hint}>
              {postType === 'REEL' ? 'MP4, MOV • 9:16 aspect ratio • up to 90 seconds'
                : postType === 'SHORT' ? 'MP4, MOV • 9:16 vertical • max 60 seconds'
                  : 'MP4, MOV, WebM • any aspect ratio'}
            </Text>
          </div>
        </Upload.Dragger>
      )}

      {!videoFile && (
        <Button
          block
          icon={<FontAwesomeIcon icon={faPhotoFilm} style={{ marginRight: 6 }} />}
          onClick={() => setLibraryOpen(true)}
          style={{ marginTop: 8 }}
        >
          Import from Media Library
        </Button>
      )}

      <MediaLibraryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        accept="video"
        multiple={false}
        onSelect={(urls) => {
          if (urls[0]) {
            onSetVideoFile({ url: urls[0], serverUrl: urls[0], name: urls[0].split('/').pop() || 'video', size: 0 });
          }
        }}
      />
    </div>
  );
}
