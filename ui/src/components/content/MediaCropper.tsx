import { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, Button, Select, Space, Typography, Segmented, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrop, faExpand, faRotate } from '@fortawesome/free-solid-svg-icons';

const { Text } = Typography;

/** Platform-specific aspect ratio presets matching server/src/services/media-processing.service.ts */
const PLATFORM_PRESETS: Record<string, { label: string; shortLabel: string; ratio: number; width: number; height: number }[]> = {
  INSTAGRAM: [
    { label: 'Square (1:1)', shortLabel: '1:1', ratio: 1, width: 1080, height: 1080 },
    { label: 'Portrait (4:5)', shortLabel: '4:5', ratio: 0.8, width: 1080, height: 1350 },
    { label: 'Landscape (1.91:1)', shortLabel: '1.91:1', ratio: 1.91, width: 1080, height: 566 },
    { label: 'Story (9:16)', shortLabel: '9:16', ratio: 0.5625, width: 1080, height: 1920 },
  ],
  TIKTOK: [
    { label: 'Vertical (9:16)', shortLabel: '9:16', ratio: 0.5625, width: 1080, height: 1920 },
  ],
  YOUTUBE: [
    { label: 'Landscape (16:9)', shortLabel: '16:9', ratio: 16 / 9, width: 1280, height: 720 },
    { label: 'Short (9:16)', shortLabel: '9:16', ratio: 0.5625, width: 1080, height: 1920 },
  ],
  TWITTER: [
    { label: 'Landscape (16:9)', shortLabel: '16:9', ratio: 16 / 9, width: 1200, height: 675 },
    { label: 'Square (1:1)', shortLabel: '1:1', ratio: 1, width: 1200, height: 1200 },
  ],
  LINKEDIN: [
    { label: 'Landscape (1.91:1)', shortLabel: '1.91:1', ratio: 1.91, width: 1200, height: 628 },
    { label: 'Square (1:1)', shortLabel: '1:1', ratio: 1, width: 1080, height: 1080 },
  ],
  FACEBOOK: [
    { label: 'Landscape (1.91:1)', shortLabel: '1.91:1', ratio: 1.91, width: 1200, height: 630 },
    { label: 'Square (1:1)', shortLabel: '1:1', ratio: 1, width: 1080, height: 1080 },
  ],
  PINTEREST: [
    { label: 'Pin (2:3)', shortLabel: '2:3', ratio: 2 / 3, width: 1000, height: 1500 },
  ],
  REDDIT: [
    { label: 'Landscape (16:9)', shortLabel: '16:9', ratio: 16 / 9, width: 1200, height: 675 },
  ],
};

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MediaCropperProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  platform?: string;
  onCrop: (croppedDataUrl: string) => void;
}

export function MediaCropper({ open, onClose, imageUrl, platform, onCrop }: MediaCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Free form');
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [imgDim, setImgDim] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, cropX: 0, cropY: 0 });
  const scaleRef = useRef(1);

  const presets = platform ? PLATFORM_PRESETS[platform] ?? [] : [];
  const allPresets = [{ label: 'Free form', shortLabel: 'Free', ratio: 0, width: 0, height: 0 }, ...presets];
  const activePreset = allPresets.find((p) => p.label === selectedPreset);

  // Reset state when modal opens
  useEffect(() => {
    if (!open) {
      setLoaded(false);
      setSelectedPreset('Free form');
      return;
    }
    if (!imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImgDim({ width: img.naturalWidth, height: img.naturalHeight });
      setCrop({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
      setLoaded(true);
    };
    img.src = imageUrl;
  }, [open, imageUrl]);

  // Draw preview
  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = Math.min(520, imgDim.width);
    const scale = displayWidth / imgDim.width;
    scaleRef.current = scale;
    canvas.width = displayWidth;
    canvas.height = imgDim.height * scale;

    // Draw full image dimmed
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.25;
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);

    // Draw crop region: clip to crop area and draw bright
    ctx.globalAlpha = 1;
    ctx.save();
    const sx = crop.x * scale;
    const sy = crop.y * scale;
    const sw = crop.width * scale;
    const sh = crop.height * scale;
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.clip();
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw crop border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, sw, sh);

    // Draw corner handles
    const handleSize = 10;
    ctx.fillStyle = '#6366f1';
    const corners = [
      [sx, sy], [sx + sw, sy],
      [sx, sy + sh], [sx + sw, sy + sh],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    }

    // Draw rule-of-thirds guides (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + (sw / 3) * i, sy);
      ctx.lineTo(sx + (sw / 3) * i, sy + sh);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, sy + (sh / 3) * i);
      ctx.lineTo(sx + sw, sy + (sh / 3) * i);
      ctx.stroke();
    }
  }, [loaded, crop, imgDim]);

  // Mouse handlers for dragging crop area
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasScale = canvasRef.current.width / rect.width;
    const mx = (e.clientX - rect.left) * canvasScale;
    const my = (e.clientY - rect.top) * canvasScale;
    const scale = scaleRef.current;
    const sx = crop.x * scale;
    const sy = crop.y * scale;
    const sw = crop.width * scale;
    const sh = crop.height * scale;

    // Only start dragging if click is inside crop area
    if (mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh) {
      setIsDragging(true);
      dragStart.current = { x: mx, y: my, cropX: crop.x, cropY: crop.y };
    }
  }, [crop]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasScale = canvasRef.current.width / rect.width;
    const mx = (e.clientX - rect.left) * canvasScale;
    const my = (e.clientY - rect.top) * canvasScale;
    const scale = scaleRef.current;
    const dx = (mx - dragStart.current.x) / scale;
    const dy = (my - dragStart.current.y) / scale;

    const newX = Math.max(0, Math.min(imgDim.width - crop.width, dragStart.current.cropX + dx));
    const newY = Math.max(0, Math.min(imgDim.height - crop.height, dragStart.current.cropY + dy));
    setCrop((prev) => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, crop.width, crop.height, imgDim]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handlePresetChange = useCallback(
    (presetLabel: string) => {
      setSelectedPreset(presetLabel);
      if (presetLabel === 'Free form') {
        setCrop({ x: 0, y: 0, width: imgDim.width, height: imgDim.height });
        return;
      }
      const preset = allPresets.find((p) => p.label === presetLabel);
      if (!preset || !preset.ratio) return;

      let w = imgDim.width;
      let h = w / preset.ratio;
      if (h > imgDim.height) {
        h = imgDim.height;
        w = h * preset.ratio;
      }
      const x = (imgDim.width - w) / 2;
      const y = (imgDim.height - h) / 2;
      setCrop({ x, y, width: w, height: h });
    },
    [imgDim, allPresets],
  );

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0, width: imgDim.width, height: imgDim.height });
    setSelectedPreset('Free form');
  }, [imgDim]);

  const handleCrop = useCallback(() => {
    if (!imgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imgRef.current, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(dataUrl);
    onClose();
  }, [crop, onCrop, onClose]);

  return (
    <Modal
      title={
        <Space>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesomeIcon icon={faCrop} style={{ color: '#6366f1', fontSize: 14 }} />
          </div>
          <span>Crop Image</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={600}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {loaded && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {Math.round(crop.width)} × {Math.round(crop.height)} px
              </Text>
            )}
          </Space>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={handleCrop} disabled={!loaded} style={{ background: '#6366f1' }}>
              Apply Crop
            </Button>
          </Space>
        </div>
      }
    >
      {/* Preset Selector */}
      {presets.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 500 }}>
            Aspect Ratio
          </Text>
          <Segmented
            value={selectedPreset}
            onChange={(val) => handlePresetChange(val as string)}
            options={allPresets.map((p) => ({
              label: (
                <Tooltip title={p.width ? `${p.width}×${p.height}px recommended` : 'Custom crop'}>
                  <span style={{ fontSize: 12, padding: '0 4px' }}>{p.shortLabel}</span>
                </Tooltip>
              ),
              value: p.label,
            }))}
            style={{ width: '100%' }}
            block
          />
          {activePreset && activePreset.width > 0 && (
            <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
              Recommended: {activePreset.width} × {activePreset.height} px
            </Text>
          )}
        </div>
      )}

      {/* Canvas Area */}
      <div
        style={{
          background: '#0f172a',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            maxWidth: '100%',
            borderRadius: 8,
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
        />

        {!loaded && (
          <Text type="secondary" style={{ position: 'absolute', color: '#94a3b8' }}>
            Loading image...
          </Text>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Tooltip title="Reset to full image">
            <Button
              size="small"
              type="text"
              icon={<FontAwesomeIcon icon={faExpand} />}
              onClick={handleReset}
            >
              Reset
            </Button>
          </Tooltip>
        </Space>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Drag to reposition crop area
        </Text>
      </div>
    </Modal>
  );
}
