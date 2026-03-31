import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Select, Button, Alert, Row, Col, Typography,
  Tabs, Tag, Collapse, Switch, Tooltip, Badge, Space, Divider, Upload,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles, faShareNodes, faComment,
  faTriangleExclamation, faCircleCheck, faCircleInfo,
  faLayerGroup, faLightbulb, faRepeat, faImage, faCrop, faTrash,
  faCloudArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import { useCreatePostMutation, useAutosavePostMutation } from '@/store/endpoints/content';
import { useGenerateContentMutation, useRunAgentMutation } from '@/store/endpoints/agents';
import { PLATFORM_OPTIONS, POST_TYPE_OPTIONS } from '../constants';
import { AiSuggestPanel } from '../components/AiSuggestPanel';
import { TemplateDrawer } from '@/components/content/TemplateDrawer';
import { IdeasSidePanel } from '@/components/content/IdeasSidePanel';
import { ThumbnailPicker } from '@/components/content/ThumbnailPicker';
import { ThreadComposer } from '@/components/content/ThreadComposer';
import { MediaCropper } from '@/components/content/MediaCropper';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PLATFORM_LIMITS: Record<string, number> = {
  INSTAGRAM: 2200, YOUTUBE: 5000, TIKTOK: 2200, TWITTER: 280,
  LINKEDIN: 3000, THREADS: 500, BLUESKY: 300, FACEBOOK: 5000, PINTEREST: 500,
  REDDIT: 40000,
};

const postSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST', 'REDDIT']),
  postType: z.enum(['IMAGE', 'VIDEO', 'REEL', 'STORY', 'CAROUSEL', 'SHORT', 'THREAD']),
  caption: z.string().max(5000).optional(),
  hashtags: z.string().optional(),
  scheduledAt: z.string().optional(),
  firstComment: z.string().max(2200).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

type PostForm = z.infer<typeof postSchema>;

interface PlatformOverride {
  caption?: string;
  hashtags?: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function CreatePostPage() {
  const navigate = useNavigate();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [autosavePost] = useAutosavePostMutation();
  const [generateContent, { isLoading: aiLoading }] = useGenerateContentMutation();
  const [runAgent, { isLoading: agentLoading }] = useRunAgentMutation();
  const [error, setError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title?: string; caption?: string; hashtags?: string[]; postType?: string }>>([]);
  const [multiPlatform, setMultiPlatform] = useState(false);
  const [extraPlatforms, setExtraPlatforms] = useState<string[]>([]);
  const [platformOverrides, setPlatformOverrides] = useState<Record<string, PlatformOverride>>({});
  const [firstCommentOptions, setFirstCommentOptions] = useState<Array<{ text: string; style: string; reasoning: string }>>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [draftPostId, setDraftPostId] = useState<string | undefined>();
  const [threadParts, setThreadParts] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropTargetIdx, setCropTargetIdx] = useState(0);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const { control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { platform: 'INSTAGRAM', postType: 'IMAGE' },
  });

  const platform = watch('platform');
  const caption = watch('caption');
  const postType = watch('postType');
  const isRecurring = watch('isRecurring');
  const charLimit = PLATFORM_LIMITS[platform] ?? 2200;
  const charCount = caption?.length ?? 0;
  const isVideoType = ['VIDEO', 'REEL', 'SHORT'].includes(postType);
  const isThreadType = postType === 'THREAD';

  // Autosave draft every 5 seconds when there's a caption
  useEffect(() => {
    if (!caption || caption.length < 10 || !draftPostId) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      autosavePost({ id: draftPostId, caption });
    }, 5000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [caption, draftPostId, autosavePost]);

  const onSubmit = async (values: PostForm, status: 'DRAFT' | 'SCHEDULED' = 'DRAFT') => {
    setError('');
    try {
      const hashtags = values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [];
      const base = {
        ...values,
        hashtags,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        status: values.scheduledAt ? 'SCHEDULED' : status,
        firstComment: values.firstComment || undefined,
        platformOverrides: Object.keys(platformOverrides).length ? platformOverrides : undefined,
        isRecurring: values.isRecurring || undefined,
        recurrenceRule: values.isRecurring ? values.recurrenceRule : undefined,
        thumbnailUrl: values.thumbnailUrl || undefined,
      };

      if (multiPlatform && extraPlatforms.length > 0) {
        const bulkGroupId = crypto.randomUUID();
        // Create primary post
        await createPost({ ...base, bulkGroupId }).unwrap();
        // Create cross-posts for each extra platform
        for (const p of extraPlatforms) {
          const override = platformOverrides[p];
          await createPost({
            ...base,
            platform: p,
            caption: override?.caption || values.caption,
            hashtags: override?.hashtags || hashtags,
            bulkGroupId,
          }).unwrap();
        }
      } else {
        await createPost(base).unwrap();
      }

      navigate('/calendar');
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      setError(e?.data?.error || 'Failed to create post');
    }
  };

  const generateIdeas = async () => {
    try {
      const result = await generateContent({ niche: 'general', platform, count: 3 }).unwrap();
      setAiSuggestions(result.data?.suggestions ?? []);
    } catch {
      setAiSuggestions([]);
    }
  };

  const applySuggestion = (s: typeof aiSuggestions[0]) => {
    if (s.caption) setValue('caption', s.caption);
    if (s.hashtags) setValue('hashtags', s.hashtags.join(', '));
    if (s.postType) setValue('postType', s.postType as PostForm['postType']);
  };

  const handleAiFormat = async () => {
    const values = getValues();
    try {
      const result = await runAgent({
        agentType: 'PUBLISHING',
        input: {
          action: 'format',
          caption: values.caption || '',
          hashtags: values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [],
          platform,
          postType: values.postType,
        },
      }).unwrap();
      const data = result.data as { caption?: string; hashtags?: string[]; notes?: string } | null;
      if (data?.caption) setValue('caption', data.caption);
      if (data?.hashtags) setValue('hashtags', data.hashtags.join(', '));
    } catch { /* swallow */ }
  };

  const handleValidate = async () => {
    const values = getValues();
    try {
      const result = await runAgent({
        agentType: 'PUBLISHING',
        input: {
          action: 'validate',
          caption: values.caption || '',
          hashtags: values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [],
          platform,
          postType: values.postType,
        },
      }).unwrap();
      setValidation(result.data as ValidationResult);
    } catch { /* swallow */ }
  };

  const handleFirstComment = async () => {
    const values = getValues();
    try {
      const result = await runAgent({
        agentType: 'PUBLISHING',
        input: {
          action: 'first_comment',
          caption: values.caption || '',
          platform,
        },
      }).unwrap();
      const data = result.data as { comments?: Array<{ text: string; style: string; reasoning: string }> } | null;
      setFirstCommentOptions(data?.comments ?? []);
    } catch { /* swallow */ }
  };

  const handleMultiPlatformAdapt = async () => {
    const values = getValues();
    try {
      const result = await runAgent({
        agentType: 'PUBLISHING',
        input: {
          action: 'multi_platform',
          caption: values.caption || '',
          hashtags: values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [],
          targetPlatforms: extraPlatforms,
          postType: values.postType,
        },
      }).unwrap();
      const data = result.data as { platforms?: Array<{ platform: string; caption?: string; hashtags?: string[] }> } | null;
      if (data?.platforms) {
        const overrides: Record<string, PlatformOverride> = {};
        for (const p of data.platforms) {
          overrides[p.platform] = { caption: p.caption, hashtags: p.hashtags };
        }
        setPlatformOverrides(overrides);
      }
    } catch { /* swallow */ }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Row align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Create New Post</Title>
        <Space>
          <Button icon={<FontAwesomeIcon icon={faLightbulb} />} onClick={() => setIdeasOpen(true)}>Ideas</Button>
          <Button icon={<FontAwesomeIcon icon={faLayerGroup} />} onClick={() => setTemplateOpen(true)}>Templates</Button>
          <Switch checked={multiPlatform} onChange={setMultiPlatform} />
          <Text>Multi-platform</Text>
        </Space>
      </Row>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card>
            {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable onClose={() => setError('')} />}

            {validation && (
              <Alert
                type={validation.isValid ? 'success' : 'error'}
                showIcon
                closable
                onClose={() => setValidation(null)}
                style={{ marginBottom: 16 }}
                message={validation.isValid ? 'Post is valid!' : 'Validation issues found'}
                description={
                  <div>
                    {validation.errors.map((e, i) => (
                      <div key={i} style={{ color: '#ef4444' }}>
                        <FontAwesomeIcon icon={faTriangleExclamation} /> {e}
                      </div>
                    ))}
                    {validation.warnings.map((w, i) => (
                      <div key={i} style={{ color: '#f59e0b' }}>
                        <FontAwesomeIcon icon={faCircleInfo} /> {w}
                      </div>
                    ))}
                  </div>
                }
              />
            )}

            <Form layout="vertical" onFinish={handleSubmit((v) => onSubmit(v))}>
              <Row gutter={16}>
                <Col span={multiPlatform ? 8 : 12}>
                  <Form.Item label="Primary Platform" validateStatus={errors.platform ? 'error' : ''}>
                    <Controller name="platform" control={control} render={({ field }) => (
                      <Select {...field} options={PLATFORM_OPTIONS} />
                    )} />
                  </Form.Item>
                </Col>
                {multiPlatform && (
                  <Col span={8}>
                    <Form.Item label="Also post to">
                      <Select
                        mode="multiple"
                        value={extraPlatforms}
                        onChange={setExtraPlatforms}
                        options={PLATFORM_OPTIONS.filter((o) => o.value !== platform)}
                        placeholder="Select platforms..."
                        maxTagCount="responsive"
                      />
                    </Form.Item>
                  </Col>
                )}
                <Col span={multiPlatform ? 8 : 12}>
                  <Form.Item label="Post Type" validateStatus={errors.postType ? 'error' : ''}>
                    <Controller name="postType" control={control} render={({ field }) => (
                      <Select {...field} options={POST_TYPE_OPTIONS} />
                    )} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={
                  <Row justify="space-between" style={{ width: '100%' }}>
                    <span>Caption</span>
                    <Text
                      type={charCount > charLimit ? 'danger' : charCount > charLimit * 0.9 ? 'warning' : 'secondary'}
                      style={{ fontSize: 12 }}
                    >
                      {charCount} / {charLimit}
                    </Text>
                  </Row>
                }
                validateStatus={errors.caption ? 'error' : ''}
                help={errors.caption?.message}
              >
                <Controller name="caption" control={control} render={({ field }) => (
                  <TextArea {...field} rows={6} placeholder="Write your caption..." />
                )} />
              </Form.Item>

              <Form.Item label="Hashtags (comma separated)">
                <Controller name="hashtags" control={control} render={({ field }) => (
                  <Input {...field} placeholder="#fitness, #workout, #health" />
                )} />
              </Form.Item>

              {/* Media Upload + Crop */}
              {['IMAGE', 'CAROUSEL'].includes(postType) && (
                <Form.Item label="Media">
                  {mediaUrls.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      {mediaUrls.map((url, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            width: 120,
                            height: 120,
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '2px solid #e2e8f0',
                            transition: 'border-color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                        >
                          <img
                            src={url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          {/* Hover overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                          >
                            <Tooltip title="Crop">
                              <Button
                                shape="circle"
                                size="small"
                                icon={<FontAwesomeIcon icon={faCrop} style={{ fontSize: 12 }} />}
                                style={{ background: 'rgba(255,255,255,0.9)' }}
                                onClick={() => { setCropTargetIdx(idx); setCropperOpen(true); }}
                              />
                            </Tooltip>
                            <Tooltip title="Remove">
                              <Button
                                shape="circle"
                                size="small"
                                danger
                                icon={<FontAwesomeIcon icon={faTrash} style={{ fontSize: 12 }} />}
                                style={{ background: 'rgba(255,255,255,0.9)' }}
                                onClick={() => setMediaUrls((prev) => prev.filter((_, i) => i !== idx))}
                              />
                            </Tooltip>
                          </div>
                          {/* Index badge */}
                          {postType === 'CAROUSEL' && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 6,
                                left: 6,
                                background: '#6366f1',
                                color: '#fff',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 600,
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {idx + 1}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Upload.Dragger
                    accept="image/*"
                    multiple={postType === 'CAROUSEL'}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const reader = new FileReader();
                      reader.onload = () => setMediaUrls((prev) => [...prev, reader.result as string]);
                      reader.readAsDataURL(file);
                      return false;
                    }}
                    style={{ borderRadius: 12, padding: '8px 0' }}
                  >
                    <div style={{ padding: '12px 0' }}>
                      <FontAwesomeIcon icon={faCloudArrowUp} style={{ fontSize: 28, color: '#6366f1', marginBottom: 8 }} />
                      <p style={{ margin: '0 0 4px', fontWeight: 500, color: '#334155' }}>
                        Drop images here or <span style={{ color: '#6366f1' }}>browse</span>
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                        {postType === 'CAROUSEL' ? 'Upload multiple images for carousel' : 'PNG, JPG, WebP up to 10MB'}
                      </p>
                    </div>
                  </Upload.Dragger>
                </Form.Item>
              )}

              <Collapse
                ghost
                items={[{
                  key: 'firstComment',
                  label: (
                    <Space>
                      <FontAwesomeIcon icon={faComment} />
                      <span>First Comment</span>
                      <Tooltip title="Add a first comment to boost engagement — common on Instagram & TikTok">
                        <FontAwesomeIcon icon={faCircleInfo} style={{ color: '#94a3b8' }} />
                      </Tooltip>
                    </Space>
                  ),
                  children: (
                    <>
                      <Controller name="firstComment" control={control} render={({ field }) => (
                        <TextArea {...field} rows={3} placeholder="Optional first comment for engagement..." />
                      )} />
                      <Button
                        size="small"
                        style={{ marginTop: 8 }}
                        icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}
                        loading={agentLoading}
                        onClick={handleFirstComment}
                      >
                        AI Generate Options
                      </Button>
                      {firstCommentOptions.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          {firstCommentOptions.map((opt, i) => (
                            <Card
                              key={i}
                              size="small"
                              hoverable
                              style={{ marginBottom: 8 }}
                              onClick={() => setValue('firstComment', opt.text)}
                            >
                              <Tag color={opt.style === 'hashtag' ? 'blue' : opt.style === 'cta' ? 'green' : 'purple'}>
                                {opt.style}
                              </Tag>
                              <Text style={{ display: 'block', marginTop: 4 }}>{opt.text}</Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>{opt.reasoning}</Text>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  ),
                }]}
              />

              {multiPlatform && extraPlatforms.length > 0 && (
                <>
                  <Divider />
                  <Row align="middle" justify="space-between" style={{ marginBottom: 12 }}>
                    <Text strong>
                      <FontAwesomeIcon icon={faShareNodes} style={{ marginRight: 8 }} />
                      Platform Overrides
                    </Text>
                    <Button
                      size="small"
                      icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}
                      loading={agentLoading}
                      onClick={handleMultiPlatformAdapt}
                    >
                      AI Adapt All
                    </Button>
                  </Row>
                  <Tabs
                    size="small"
                    items={extraPlatforms.map((p) => ({
                      key: p,
                      label: (
                        <Badge dot={!!platformOverrides[p]?.caption} offset={[6, 0]}>
                          {PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p}
                        </Badge>
                      ),
                      children: (
                        <div>
                          <Form.Item label={`Caption for ${p} (${PLATFORM_LIMITS[p] ?? 2200} char limit)`}>
                            <TextArea
                              rows={4}
                              value={platformOverrides[p]?.caption ?? ''}
                              onChange={(e) =>
                                setPlatformOverrides((prev) => ({
                                  ...prev,
                                  [p]: { ...prev[p], caption: e.target.value },
                                }))
                              }
                              placeholder="Leave empty to use primary caption"
                            />
                          </Form.Item>
                          <Form.Item label="Hashtags override">
                            <Input
                              value={platformOverrides[p]?.hashtags?.join(', ') ?? ''}
                              onChange={(e) =>
                                setPlatformOverrides((prev) => ({
                                  ...prev,
                                  [p]: {
                                    ...prev[p],
                                    hashtags: e.target.value.split(',').map((h) => h.trim()).filter(Boolean),
                                  },
                                }))
                              }
                              placeholder="Leave empty to use primary hashtags"
                            />
                          </Form.Item>
                        </div>
                      ),
                    }))}
                  />
                </>
              )}

              <Form.Item label="Schedule For (optional)" style={{ marginTop: 16 }}>
                <Controller name="scheduledAt" control={control} render={({ field }) => (
                  <Input {...field} type="datetime-local" />
                )} />
              </Form.Item>

              {/* Recurring Post */}
              <Collapse
                ghost
                style={{ marginBottom: 8 }}
                items={[{
                  key: 'recurring',
                  label: (
                    <Space>
                      <FontAwesomeIcon icon={faRepeat} />
                      <span>Recurring / Evergreen Post</span>
                    </Space>
                  ),
                  children: (
                    <div>
                      <Form.Item label="Enable recurring" style={{ marginBottom: 8 }}>
                        <Controller name="isRecurring" control={control} render={({ field }) => (
                          <Switch checked={field.value} onChange={field.onChange} />
                        )} />
                      </Form.Item>
                      {isRecurring && (
                        <Form.Item label="Recurrence rule (iCal RRULE)" help="e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR or FREQ=DAILY">
                          <Controller name="recurrenceRule" control={control} render={({ field }) => (
                            <Input {...field} placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR" />
                          )} />
                        </Form.Item>
                      )}
                    </div>
                  ),
                }]}
              />

              {/* Video Thumbnail */}
              {isVideoType && (
                <Collapse
                  ghost
                  style={{ marginBottom: 8 }}
                  items={[{
                    key: 'thumbnail',
                    label: (
                      <Space>
                        <FontAwesomeIcon icon={faImage} />
                        <span>Custom Thumbnail</span>
                      </Space>
                    ),
                    children: (
                      <Controller name="thumbnailUrl" control={control} render={({ field }) => (
                        <ThumbnailPicker value={field.value} onChange={field.onChange} />
                      )} />
                    ),
                  }]}
                />
              )}

              {/* Thread Composer */}
              {isThreadType && (
                <div style={{ marginBottom: 16 }}>
                  <Divider />
                  <ThreadComposer
                    platform={platform}
                    parts={threadParts}
                    onChange={setThreadParts}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                  Save as Draft
                </Button>
                <Button onClick={handleSubmit((v) => onSubmit(v, 'SCHEDULED'))} loading={isLoading}>
                  Schedule
                </Button>
                <Button
                  icon={<FontAwesomeIcon icon={faCircleCheck} />}
                  onClick={handleValidate}
                  loading={agentLoading}
                >
                  Validate
                </Button>
                <Button
                  icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}
                  onClick={handleAiFormat}
                  loading={agentLoading}
                >
                  AI Optimize
                </Button>
              </div>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <AiSuggestPanel
            suggestions={aiSuggestions}
            loading={aiLoading}
            onGenerate={generateIdeas}
            onApply={applySuggestion}
          />
        </Col>
      </Row>

      <TemplateDrawer
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onInsert={(t) => { setValue('caption', t.body); setTemplateOpen(false); }}
        platform={platform}
        currentCaption={caption}
      />

      <IdeasSidePanel
        open={ideasOpen}
        onClose={() => setIdeasOpen(false)}
        onApply={(idea) => {
          if (idea.body) setValue('caption', idea.body);
          setIdeasOpen(false);
        }}
      />

      {mediaUrls[cropTargetIdx] && (
        <MediaCropper
          open={cropperOpen}
          onClose={() => setCropperOpen(false)}
          imageUrl={mediaUrls[cropTargetIdx]}
          platform={platform}
          onCrop={(croppedUrl) => {
            setMediaUrls((prev) => prev.map((u, i) => (i === cropTargetIdx ? croppedUrl : u)));
          }}
        />
      )}
    </div>
  );
}
