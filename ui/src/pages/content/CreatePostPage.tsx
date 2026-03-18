import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Alert, Row, Col, Typography } from 'antd';
import { useCreatePostMutation } from '@/store/endpoints/content';
import { useGenerateContentMutation } from '@/store/endpoints/agents';
import { PLATFORM_OPTIONS, POST_TYPE_OPTIONS } from './constants';
import { AiSuggestPanel } from './components/AiSuggestPanel';

const { Title } = Typography;
const { TextArea } = Input;

const postSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK']),
  postType: z.enum(['IMAGE', 'VIDEO', 'REEL', 'STORY', 'CAROUSEL', 'SHORT']),
  caption: z.string().max(2200).optional(),
  hashtags: z.string().optional(),
  scheduledAt: z.string().optional(),
});

type PostForm = z.infer<typeof postSchema>;

export function CreatePostPage() {
  const navigate = useNavigate();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [generateContent, { isLoading: aiLoading }] = useGenerateContentMutation();
  const [error, setError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title?: string; caption?: string; hashtags?: string[]; postType?: string }>>([]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { platform: 'INSTAGRAM', postType: 'IMAGE' },
  });

  const platform = watch('platform');

  const onSubmit = async (values: PostForm, status: 'DRAFT' | 'SCHEDULED' = 'DRAFT') => {
    setError('');
    try {
      await createPost({
        ...values,
        hashtags: values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [],
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        status: values.scheduledAt ? 'SCHEDULED' : status,
      }).unwrap();
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

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 24 }}>Create New Post</Title>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card>
            {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable onClose={() => setError('')} />}
            <Form layout="vertical" onFinish={handleSubmit((v) => onSubmit(v))}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Platform" validateStatus={errors.platform ? 'error' : ''}>
                    <Controller name="platform" control={control} render={({ field }) => (
                      <Select {...field} options={PLATFORM_OPTIONS} />
                    )} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Post Type" validateStatus={errors.postType ? 'error' : ''}>
                    <Controller name="postType" control={control} render={({ field }) => (
                      <Select {...field} options={POST_TYPE_OPTIONS} />
                    )} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Caption" validateStatus={errors.caption ? 'error' : ''} help={errors.caption?.message}>
                <Controller name="caption" control={control} render={({ field }) => (
                  <TextArea {...field} rows={6} placeholder="Write your caption..." />
                )} />
              </Form.Item>

              <Form.Item label="Hashtags (comma separated)">
                <Controller name="hashtags" control={control} render={({ field }) => (
                  <Input {...field} placeholder="#fitness, #workout, #health" />
                )} />
              </Form.Item>

              <Form.Item label="Schedule For (optional)">
                <Controller name="scheduledAt" control={control} render={({ field }) => (
                  <Input {...field} type="datetime-local" />
                )} />
              </Form.Item>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="primary" htmlType="submit" loading={isLoading}>Save as Draft</Button>
                <Button onClick={handleSubmit((v) => onSubmit(v, 'SCHEDULED'))} loading={isLoading}>
                  Schedule
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
    </div>
  );
}
