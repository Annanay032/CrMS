import { useState } from 'react';
import { Typography, Upload, Button, Tooltip, Spin, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faCrop, faTrash, faPhotoFilm } from '@fortawesome/free-solid-svg-icons';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { uploadFileToServer } from '../helpers';
import styles from '../styles/compose.module.scss';

const { Text } = Typography;

interface Props {
  mediaUrls: string[];
  onSetMediaUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onCrop: (idx: number) => void;
}

export function ImageUploader({ mediaUrls, onSetMediaUrls, onCrop }: Props) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <div className={styles.media_zone}>
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
            </div>
          ))}
        </div>
      )}

      <Upload.Dragger
        accept="image/*"
        multiple
        showUploadList={false}
        disabled={uploading}
        beforeUpload={async (file) => {
          setUploading(true);
          const serverUrl = await uploadFileToServer(file);
          setUploading(false);
          if (serverUrl) {
            onSetMediaUrls((prev) => [...prev, serverUrl]);
          } else {
            message.error('Image upload failed');
          }
          return false;
        }}
        className={styles.uploader}
      >
        <div className={styles.uploader_body}>
          {uploading ? <Spin size="large" /> : <FontAwesomeIcon icon={faImage} className={styles.uploader_icon} />}
          <Text strong className={styles.uploader_title}>{uploading ? 'Uploading...' : <>Drop images or <span className={styles.uploader_link}>browse</span></>}</Text>
          <Text type="secondary" className={styles.uploader_hint}>JPG, PNG, WebP — multiple allowed — 1080×1080 recommended</Text>
        </div>
      </Upload.Dragger>

      <Button
        block
        icon={<FontAwesomeIcon icon={faPhotoFilm} style={{ marginRight: 6 }} />}
        onClick={() => setLibraryOpen(true)}
        style={{ marginTop: 8 }}
      >
        Import from Media Library
      </Button>

      <MediaLibraryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        accept="image"
        multiple
        onSelect={(urls) => onSetMediaUrls((prev) => [...prev, ...urls])}
      />
    </div>
  );
}
