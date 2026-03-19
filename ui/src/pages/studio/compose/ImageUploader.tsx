import { Typography, Upload, Button, Tooltip, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faCrop, faTrash } from '@fortawesome/free-solid-svg-icons';
import styles from './compose.module.scss';

const { Text } = Typography;

interface Props {
  mediaUrls: string[];
  onSetMediaUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onCrop: (idx: number) => void;
}

export function ImageUploader({ mediaUrls, onSetMediaUrls, onCrop }: Props) {
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
        showUploadList={false}
        beforeUpload={(file) => {
          const reader = new FileReader();
          reader.onload = () => onSetMediaUrls([reader.result as string]);
          reader.readAsDataURL(file);
          return false;
        }}
        className={styles.uploader}
      >
        <div className={styles.uploader_body}>
          <FontAwesomeIcon icon={faImage} className={styles.uploader_icon} />
          <Text strong className={styles.uploader_title}>Drop an image or <span className={styles.uploader_link}>browse</span></Text>
          <Text type="secondary" className={styles.uploader_hint}>JPG, PNG, WebP — recommended 1080×1080</Text>
        </div>
      </Upload.Dragger>
    </div>
  );
}
