import { useState } from 'react';
import { Button, Input, Typography, Upload, Spin, Empty, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles, faImage, faUpload, faExpand,
  faEraser, faPaintBrush, faMagic, faArrowsAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useStudioGenerateImageMutation } from '@/store/endpoints/studio';
import styles from './StudioMediaLab.module.scss';

const { Text } = Typography;
const { TextArea } = Input;

type MediaTool = 'generate' | 'remove-bg' | 'upscale' | 'expand' | 'effects';

const TOOLS: Array<{ key: MediaTool; label: string; icon: typeof faImage; description: string }> = [
  { key: 'generate', label: 'AI Generate', icon: faWandMagicSparkles, description: 'Generate images from text descriptions' },
  { key: 'remove-bg', label: 'Remove BG', icon: faEraser, description: 'Remove background from images' },
  { key: 'upscale', label: 'Upscale', icon: faExpand, description: 'Enhance resolution and quality' },
  { key: 'expand', label: 'Outpaint', icon: faArrowsAlt, description: 'Expand image borders with AI' },
  { key: 'effects', label: 'Effects', icon: faPaintBrush, description: 'Apply artistic styles and filters' },
];

export function StudioMediaLab() {
  const [activeTool, setActiveTool] = useState<MediaTool>('generate');
  const [prompt, setPrompt] = useState('');
  const [inputImage, setInputImage] = useState<string>();
  const [outputImage, setOutputImage] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [generateImageApi] = useStudioGenerateImageMutation();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setProcessing(true);
    setOutputImage(undefined);

    try {
      const result = await generateImageApi({ prompt }).unwrap();
      const data = result.data as { url?: string } | null;
      if (data?.url) {
        setOutputImage(data.url);
        message.success('Image generated!');
      } else {
        message.info('Image generation returned no URL. Check API key configuration.');
      }
    } catch {
      message.error('Generation failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleImageTool = async () => {
    if (!inputImage) {
      message.warning('Upload an image first');
      return;
    }
    setProcessing(true);

    try {
      // Placeholder for external API integration
      message.info(`${activeTool} processing will be available when external API keys are configured.`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.medialab}>
      {/* Tool selector */}
      <div className={styles.medialab__sidebar}>
        <Text strong style={{ marginBottom: 12, display: 'block', fontSize: 13 }}>Tools</Text>
        {TOOLS.map((tool) => (
          <button
            key={tool.key}
            className={`${styles.medialab__tool} ${activeTool === tool.key ? styles['medialab__tool--active'] : ''}`}
            onClick={() => setActiveTool(tool.key)}
          >
            <FontAwesomeIcon icon={tool.icon} fixedWidth />
            <div>
              <div className={styles.medialab__tool_label}>{tool.label}</div>
              <div className={styles.medialab__tool_desc}>{tool.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Workspace */}
      <div className={styles.medialab__workspace}>
        {/* Input area */}
        <div className={styles.medialab__input}>
          {activeTool === 'generate' ? (
            <div className={styles.medialab__prompt_area}>
              <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create... e.g., 'A minimalist flat lay of a coffee cup on a marble table with morning light'"
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
              <Button
                type="primary"
                icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}
                onClick={handleGenerate}
                loading={processing}
                disabled={!prompt.trim()}
                style={{ marginTop: 12 }}
              >
                Generate
              </Button>
            </div>
          ) : (
            <div className={styles.medialab__upload_area}>
              {inputImage ? (
                <div className={styles.medialab__preview}>
                  <img src={inputImage} alt="Input" />
                  <Button
                    size="small"
                    onClick={() => setInputImage(undefined)}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Upload.Dragger
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = () => setInputImage(reader.result as string);
                    reader.readAsDataURL(file);
                    return false;
                  }}
                  style={{ borderRadius: 12 }}
                >
                  <FontAwesomeIcon icon={faUpload} style={{ fontSize: 28, color: '#6366f1', marginBottom: 8 }} />
                  <p style={{ margin: 0, fontWeight: 500 }}>Upload an image to process</p>
                </Upload.Dragger>
              )}
              {inputImage && (
                <Button
                  type="primary"
                  icon={<FontAwesomeIcon icon={faMagic} />}
                  onClick={handleImageTool}
                  loading={processing}
                  style={{ marginTop: 12 }}
                >
                  Apply {TOOLS.find((t) => t.key === activeTool)?.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Output area */}
        <div className={styles.medialab__output}>
          {processing ? (
            <div className={styles.medialab__loading}>
              <Spin size="large" />
              <Text type="secondary" style={{ marginTop: 12 }}>Processing...</Text>
            </div>
          ) : outputImage ? (
            <div className={styles.medialab__result}>
              <img src={outputImage} alt="Output" />
            </div>
          ) : (
            <Empty
              description={
                activeTool === 'generate'
                  ? 'Describe your image and click Generate'
                  : 'Upload an image and apply a tool'
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </div>
    </div>
  );
}
