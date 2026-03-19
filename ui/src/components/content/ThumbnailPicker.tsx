import { useState, useRef, useCallback } from 'react';
import { Upload, Button, Space, Typography, Image, Slider, message as antMsg } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faUpload, faTrash, faFilm } from '@fortawesome/free-solid-svg-icons';

const { Text } = Typography;

interface ThumbnailPickerProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  videoUrl?: string;
}

/**
 * Thumbnail picker that supports:
 * - Frame extraction from a video via canvas scrubbing
 * - Image upload for custom thumbnail
 */
export function ThumbnailPicker({ value, onChange, videoUrl }: ThumbnailPickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrubTime, setScrubTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);

  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  }, []);

  const handleScrub = useCallback((val: number) => {
    setScrubTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewUrl(dataUrl);
    onChange(dataUrl);
    antMsg.success('Frame captured as thumbnail');
  }, [onChange]);

  const handleUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        onChange(result);
      };
      reader.readAsDataURL(file);
      return false; // Prevent actual upload
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    setPreviewUrl(undefined);
    onChange(undefined);
  }, [onChange]);

  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        <FontAwesomeIcon icon={faImage} style={{ marginRight: 6 }} />
        Custom Thumbnail
      </Text>

      {previewUrl && (
        <div style={{ marginBottom: 12, position: 'relative' }}>
          <Image
            src={previewUrl}
            alt="Thumbnail preview"
            style={{ borderRadius: 8, maxHeight: 180, objectFit: 'cover' }}
            width="100%"
          />
          <Button
            danger
            size="small"
            icon={<FontAwesomeIcon icon={faTrash} />}
            onClick={handleClear}
            style={{ position: 'absolute', top: 8, right: 8 }}
          />
        </div>
      )}

      <Space direction="vertical" style={{ width: '100%' }}>
        {videoUrl && (
          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
              <FontAwesomeIcon icon={faFilm} style={{ marginRight: 4 }} />
              Extract from video
            </Text>
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleVideoLoaded}
              crossOrigin="anonymous"
              style={{ width: '100%', borderRadius: 6, maxHeight: 120 }}
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {videoDuration > 0 && (
              <>
                <Slider
                  min={0}
                  max={videoDuration}
                  step={0.1}
                  value={scrubTime}
                  onChange={handleScrub}
                  tooltip={{ formatter: (v) => `${(v ?? 0).toFixed(1)}s` }}
                  style={{ marginBottom: 8 }}
                />
                <Button size="small" type="primary" onClick={captureFrame}>
                  Capture Frame
                </Button>
              </>
            )}
          </div>
        )}

        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
        >
          <Button icon={<FontAwesomeIcon icon={faUpload} style={{ marginRight: 6 }} />}>
            Upload Image
          </Button>
        </Upload>
      </Space>
    </div>
  );
}
