import { useState } from 'react';
import { Typography, Upload, Button, Tooltip, Tag, Spin, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrop, faTrash, faPlus, faArrowUp, faArrowDown, faPhotoFilm } from '@fortawesome/free-solid-svg-icons';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { uploadFileToServer } from '../helpers';
import styles from '../styles/compose.module.scss';

const { Text } = Typography;

interface Props {
  mediaUrls: string[];
  onSetMediaUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onCrop: (idx: number) => void;
}

export function CarouselUploader({ mediaUrls, onSetMediaUrls, onCrop }: Props) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <div className={styles.media_zone}>
      <div className={styles.media_zone_header}>
        <Text strong style={{ fontSize: 12 }}>
          <FontAwesomeIcon icon={faPhotoFilm} style={{ marginRight: 6 }} />
          Carousel Slides ({mediaUrls.length}/10)
        </Text>
      </div>

      {mediaUrls.length > 0 && (
        <div className={styles.media_grid}>
          {mediaUrls.map((url, idx) => (
            <div key={idx} className={styles.media_thumb}>
              <img src={url} alt="" />
              <div className={styles.media_overlay}>
                <Tooltip title="Crop">
                  <Button shape="circle" size="small" icon={<FontAwesomeIcon icon={faCrop} style={{ fontSize: 11 }} />} onClick={() => onCrop(idx)} />
                </Tooltip>
                <Tooltip title="Remove">
                  <Button shape="circle" size="small" danger icon={<FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />} onClick={() => onSetMediaUrls((prev) => prev.filter((_, i) => i !== idx))} />
                </Tooltip>
              </div>
              <div className={styles.media_badge}>{idx + 1}</div>
              <div className={styles.media_reorder}>
                {idx > 0 && (
                  <Button size="small" type="text"
                    icon={<FontAwesomeIcon icon={faArrowUp} style={{ fontSize: 9, color: '#fff' }} />}
                    onClick={() => onSetMediaUrls((prev) => { const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a; })}
                    style={{ padding: 0, width: 18, height: 18, minWidth: 18 }}
                  />
                )}
                {idx < mediaUrls.length - 1 && (
                  <Button size="small" type="text"
                    icon={<FontAwesomeIcon icon={faArrowDown} style={{ fontSize: 9, color: '#fff' }} />}
                    onClick={() => onSetMediaUrls((prev) => { const a = [...prev]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a; })}
                    style={{ padding: 0, width: 18, height: 18, minWidth: 18 }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {mediaUrls.length < 10 && (
        <Upload.Dragger
          accept="image/*"
          multiple
          showUploadList={false}
          disabled={uploading}
          beforeUpload={async (file) => {
            if (mediaUrls.length >= 10) { message.warning('Maximum 10 slides'); return false; }
            setUploading(true);
            const serverUrl = await uploadFileToServer(file);
            setUploading(false);
            if (serverUrl) {
              onSetMediaUrls((prev) => [...prev, serverUrl].slice(0, 10));
            } else {
              message.error('Upload failed');
            }
            return false;
          }}
          className={styles.uploader}
        >
          <div className={styles.uploader_body}>
            {uploading ? <Spin /> : <FontAwesomeIcon icon={faPlus} className={styles.uploader_icon} />}
            <Text strong className={styles.uploader_title}>{uploading ? 'Uploading...' : <>Add slides — drop images or <span className={styles.uploader_link}>browse</span></>}</Text>
            <Text type="secondary" className={styles.uploader_hint}>Up to 10 images • 1080×1080 recommended</Text>
          </div>
        </Upload.Dragger>
      )}

      {mediaUrls.length < 10 && (
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
        accept="image"
        multiple
        onSelect={(urls) => onSetMediaUrls((prev) => [...prev, ...urls].slice(0, 10))}
      />
    </div>
  );
}
