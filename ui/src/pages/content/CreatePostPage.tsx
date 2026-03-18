import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Bot, Sparkles } from 'lucide-react';

const postSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK']),
  postType: z.enum(['IMAGE', 'VIDEO', 'REEL', 'STORY', 'CAROUSEL', 'SHORT']),
  caption: z.string().max(2200).optional(),
  hashtags: z.string().optional(),
  scheduledAt: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED']).optional(),
});

type PostForm = z.infer<typeof postSchema>;

export function CreatePostPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { platform: 'INSTAGRAM', postType: 'IMAGE', status: 'DRAFT' },
  });

  const platform = watch('platform');

  const onSubmit = async (values: PostForm) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...values,
        hashtags: values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [],
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        status: values.scheduledAt ? 'SCHEDULED' : (values.status || 'DRAFT'),
      };
      await api.post('/content', payload);
      navigate('/calendar');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const generateWithAI = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/agents/content/generate', {
        niche: 'general',
        platform,
        count: 3,
      });
      setAiSuggestions(data.data?.suggestions ?? []);
    } catch {
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (suggestion: any) => {
    if (suggestion.caption) setValue('caption', suggestion.caption);
    if (suggestion.hashtags) setValue('hashtags', suggestion.hashtags.join(', '));
    if (suggestion.postType) setValue('postType', suggestion.postType);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Platform</label>
                    <select
                      {...register('platform')}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="YOUTUBE">YouTube</option>
                      <option value="TIKTOK">TikTok</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Post Type</label>
                    <select
                      {...register('postType')}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                      <option value="REEL">Reel</option>
                      <option value="STORY">Story</option>
                      <option value="CAROUSEL">Carousel</option>
                      <option value="SHORT">Short</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Caption</label>
                  <textarea
                    {...register('caption')}
                    rows={6}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm resize-none focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Write your caption..."
                  />
                  {errors.caption && <p className="text-sm text-red-600">{errors.caption.message}</p>}
                </div>

                <Input
                  id="hashtags"
                  label="Hashtags (comma separated)"
                  placeholder="#fitness, #workout, #health"
                  error={errors.hashtags?.message}
                  {...register('hashtags')}
                />

                <Input
                  id="scheduledAt"
                  label="Schedule For (optional)"
                  type="datetime-local"
                  {...register('scheduledAt')}
                />

                <div className="flex gap-3">
                  <Button type="submit" loading={loading}>
                    Save as Draft
                  </Button>
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={loading}
                    onClick={() => setValue('status', 'SCHEDULED')}
                  >
                    Schedule
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold">AI Assist</h3>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={generateWithAI}
                loading={aiLoading}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Ideas
              </Button>

              <div className="space-y-3">
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion(s)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <p className="text-sm font-medium">{s.title ?? `Idea ${i + 1}`}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.caption}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
