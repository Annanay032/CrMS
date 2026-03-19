import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useCreatePostMutation, useAutosavePostMutation } from '@/store/endpoints/content';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import { useStudioComposeMutation, useStudioRewriteMutation, useStudioIntelligenceMutation } from '@/store/endpoints/studio';
import {
  composeSchema,
  PLATFORM_LIMITS,
  type ComposeForm,
  type ChatMessage,
  type IntelData,
  type VideoFileInfo,
  type ThreadEntry,
} from './types';

const INITIAL_CHAT: ChatMessage = {
  id: '1',
  role: 'ai',
  content: "Hey! I'm your Studio AI. Tell me what you'd like to create — describe your idea, and I'll help with copy, hashtags, formatting, and media suggestions.",
  timestamp: Date.now(),
};

export function useComposeForm() {
  const navigate = useNavigate();

  // ── API hooks ──
  const [createPost, { isLoading: saving }] = useCreatePostMutation();
  const [autosavePost] = useAutosavePostMutation();
  const [runAgent, { isLoading: agentLoading }] = useRunAgentMutation();
  const [studioCompose] = useStudioComposeMutation();
  const [studioRewrite] = useStudioRewriteMutation();
  const [studioIntelligence] = useStudioIntelligenceMutation();

  // ── Form ──
  const form = useForm<ComposeForm>({
    resolver: zodResolver(composeSchema),
    defaultValues: { platform: 'INSTAGRAM', postType: 'IMAGE' },
  });
  const { watch, setValue, getValues } = form;

  const platform = watch('platform');
  const caption = watch('caption');
  const postType = watch('postType');
  const charLimit = PLATFORM_LIMITS[platform] ?? 2200;
  const charCount = caption?.length ?? 0;

  // ── Editor state ──
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<VideoFileInfo | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>();
  const [threadEntries, setThreadEntries] = useState<ThreadEntry[]>([{ id: '1', text: '' }]);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropTargetIdx, setCropTargetIdx] = useState(0);
  const [draftId, setDraftId] = useState<string>();
  const [showFirstComment, setShowFirstComment] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Chat state ──
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([INITIAL_CHAT]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Panel state ──
  const [activePanel, setActivePanel] = useState<'chat' | 'intel' | 'settings'>('chat');

  // ── Multi-platform ──
  const [multiPlatform, setMultiPlatform] = useState(false);
  const [extraPlatforms, setExtraPlatforms] = useState<string[]>([]);
  const [platformOverrides, setPlatformOverrides] = useState<Record<string, { caption?: string; hashtags?: string[] }>>({});

  // ── Intelligence ──
  const [intel, setIntel] = useState<IntelData | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);

  // ── Scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Autosave ──
  useEffect(() => {
    if (!caption || caption.length < 10 || !draftId) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      autosavePost({ id: draftId, caption });
    }, 5000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [caption, draftId, autosavePost]);

  // ── Chat send ──
  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || agentLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: userMsg, timestamp: Date.now() }]);

    try {
      const result = await studioCompose({ topic: userMsg, platform }).unwrap();
      const data = result.data as { caption?: string; hashtags?: string[]; hooks?: string[]; mediaPrompt?: string } | null;

      let responseText = '';
      if (data?.caption) {
        responseText = `Here's what I came up with:\n\n`;
        if (data.hooks?.length) responseText += `**Hooks:**\n${data.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n`;
        responseText += `${data.caption}\n\n`;
        if (data.hashtags?.length) responseText += `Hashtags: ${data.hashtags.join(' ')}\n\n`;
        if (data.mediaPrompt) responseText += `_Image idea: ${data.mediaPrompt}_\n\n`;
        responseText += `_Click "Apply" to use this in your post._`;
      } else {
        responseText = 'I generated some ideas but the format was unexpected. Try being more specific!';
      }

      setChatMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: 'ai', content: responseText, timestamp: Date.now(), action: data?.caption ? 'apply' : undefined }]);
    } catch {
      setChatMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: 'ai', content: "Sorry, I hit an error. Try again or rephrase your request.", timestamp: Date.now() }]);
    }
  }, [chatInput, agentLoading, studioCompose, platform]);

  const applyFromChat = useCallback((msg: ChatMessage) => {
    const lines = msg.content.split('\n').filter(Boolean);
    const captionLines = lines.filter((l) => !l.startsWith('**') && !l.startsWith('Hashtags:') && !l.startsWith('_') && !l.startsWith("Here's"));
    if (captionLines.length > 0) setValue('caption', captionLines.join('\n'));
    const hashtagLine = lines.find((l) => l.startsWith('Hashtags:'));
    if (hashtagLine) setValue('hashtags', hashtagLine.replace('Hashtags: ', ''));
    message.success('Applied to your post!');
  }, [setValue]);

  // ── AI Actions ──
  const handleAiOptimize = useCallback(async () => {
    const values = getValues();
    try {
      const result = await runAgent({
        agentType: 'PUBLISHING',
        input: { action: 'format', caption: values.caption || '', hashtags: values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [], platform, postType: values.postType },
      }).unwrap();
      const data = result.data as { caption?: string; hashtags?: string[] } | null;
      if (data?.caption) setValue('caption', data.caption);
      if (data?.hashtags) setValue('hashtags', data.hashtags.join(', '));
      message.success('Post optimized!');
    } catch { message.error('Optimization failed'); }
  }, [getValues, runAgent, platform, setValue]);

  const handleValidate = useCallback(async () => {
    const values = getValues();
    try {
      const result = await runAgent({
        agentType: 'PUBLISHING',
        input: { action: 'validate', caption: values.caption || '', hashtags: values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [], platform, postType: values.postType },
      }).unwrap();
      const data = result.data as { isValid?: boolean; errors?: string[]; warnings?: string[] } | null;
      if (data?.isValid) { message.success('Post looks great!'); }
      else { message.warning([...(data?.errors ?? []), ...(data?.warnings ?? [])][0] || 'Issues found'); }
    } catch { message.error('Validation failed'); }
  }, [getValues, runAgent, platform]);

  // ── Intelligence ──
  const fetchIntelligence = useCallback(async () => {
    const values = getValues();
    if (!values.caption && !values.hashtags) { message.warning('Write some content first to get insights'); return; }
    setIntelLoading(true);
    try {
      const result = await studioIntelligence({ caption: values.caption || '', hashtags: values.hashtags || '', platform, postType }).unwrap();
      setIntel(result.data as IntelData);
      setActivePanel('intel');
    } catch { message.error('Failed to load intelligence'); }
    finally { setIntelLoading(false); }
  }, [getValues, studioIntelligence, platform, postType]);

  // ── Multi-platform adapt ──
  const handleMultiPlatformAdapt = useCallback(async () => {
    const values = getValues();
    if (!values.caption) return;
    try {
      const result = await runAgent({
        agentType: 'PUBLISHING',
        input: { action: 'multi_platform', caption: values.caption || '', hashtags: values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [], targetPlatforms: extraPlatforms, postType: values.postType },
      }).unwrap();
      const data = result.data as { platforms?: Array<{ platform: string; caption?: string; hashtags?: string[] }> } | null;
      if (data?.platforms) {
        const overrides: Record<string, { caption?: string; hashtags?: string[] }> = {};
        for (const p of data.platforms) { overrides[p.platform] = { caption: p.caption, hashtags: p.hashtags }; }
        setPlatformOverrides(overrides);
        message.success('Captions adapted for each platform!');
      }
    } catch { message.error('Platform adaptation failed'); }
  }, [getValues, runAgent, extraPlatforms]);

  // ── Submit ──
  const onSubmit = useCallback(async (values: ComposeForm, status: 'DRAFT' | 'SCHEDULED' = 'DRAFT') => {
    try {
      const hashtags = values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [];
      const allMedia = [...mediaUrls];
      if (videoFile) allMedia.push(videoFile.url);
      const base = {
        ...values, hashtags,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        status: values.scheduledAt ? 'SCHEDULED' : status,
        firstComment: values.firstComment || undefined,
        thumbnailUrl: thumbnailUrl || values.thumbnailUrl || undefined,
        mediaUrls: allMedia,
        threadEntries: values.postType === 'THREAD' ? threadEntries : undefined,
        platformOverrides: Object.keys(platformOverrides).length ? platformOverrides : undefined,
      };

      if (multiPlatform && extraPlatforms.length > 0) {
        const bulkGroupId = crypto.randomUUID();
        await createPost({ ...base, bulkGroupId }).unwrap();
        for (const p of extraPlatforms) {
          const override = platformOverrides[p];
          await createPost({ ...base, platform: p, caption: override?.caption || values.caption, hashtags: override?.hashtags || hashtags, bulkGroupId }).unwrap();
        }
      } else {
        await createPost(base).unwrap();
      }

      message.success(status === 'SCHEDULED' ? 'Post scheduled!' : 'Draft saved!');
      navigate('/calendar');
    } catch { message.error('Failed to save post'); }
  }, [mediaUrls, videoFile, thumbnailUrl, threadEntries, platformOverrides, multiPlatform, extraPlatforms, createPost, navigate]);

  return {
    // Form
    form, platform, caption, postType, charLimit, charCount,
    // API loading
    saving, agentLoading,
    // Editor state
    mediaUrls, setMediaUrls,
    videoFile, setVideoFile,
    thumbnailUrl, setThumbnailUrl,
    threadEntries, setThreadEntries,
    cropperOpen, setCropperOpen,
    cropTargetIdx, setCropTargetIdx,
    showFirstComment, setShowFirstComment,
    showSchedule, setShowSchedule,
    // Chat
    chatMessages, chatInput, setChatInput, chatEndRef, sendChat, applyFromChat,
    // Panel
    activePanel, setActivePanel,
    // Multi-platform
    multiPlatform, setMultiPlatform,
    extraPlatforms, setExtraPlatforms,
    platformOverrides, setPlatformOverrides,
    // Intelligence
    intel, intelLoading, fetchIntelligence,
    // Actions
    handleAiOptimize, handleValidate, handleMultiPlatformAdapt, onSubmit,
  };
}
