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
  type ComposeForm,
  type ChatMessage,
  type IntelData,
  type VideoFileInfo,
  type ThreadEntry,
  type MediaStrategy,
  type PlatformEditorState,
} from './types';
import { PLATFORM_LIMITS, PLATFORM_POST_TYPES, PLATFORM_DEFAULT_TYPE, POST_TYPE_COMPATIBLE_PLATFORMS } from './constants';

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
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

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
  const [mediaStrategy, setMediaStrategy] = useState<MediaStrategy>('reuse');
  const [platformMedia, setPlatformMedia] = useState<Record<string, { mediaUrls?: string[]; videoUrl?: string }>>({});
  const [platformEditorStates, setPlatformEditorStates] = useState<Record<string, PlatformEditorState>>({});

  const updatePlatformEditorState = useCallback((p: string, state: PlatformEditorState) => {
    setPlatformEditorStates((prev) => ({ ...prev, [p]: state }));
    // Also sync into platformOverrides for the submit flow
    setPlatformOverrides((prev) => ({
      ...prev,
      [p]: {
        caption: state.caption || undefined,
        hashtags: state.hashtags ? state.hashtags.split(',').map((h) => h.trim()).filter(Boolean) : undefined,
      },
    }));
  }, []);

  // ── Wrapped multi-platform setters that clear per-platform media when needed ──
  const handleSetMultiPlatform = useCallback((enabled: boolean) => {
    setMultiPlatform(enabled);
    if (!enabled) {
      // Turning off multi-platform — clear per-platform states
      setPlatformEditorStates({});
      setPlatformMedia({});
      setPlatformOverrides({});
      setExtraPlatforms([]);
    }
  }, []);

  const handleSetExtraPlatforms = useCallback((platforms: string[]) => {
    setExtraPlatforms((prev) => {
      // Clear editor state for removed platforms
      const removed = prev.filter((p) => !platforms.includes(p));
      if (removed.length > 0) {
        setPlatformEditorStates((s) => {
          const next = { ...s };
          for (const p of removed) delete next[p];
          return next;
        });
        setPlatformMedia((s) => {
          const next = { ...s };
          for (const p of removed) delete next[p];
          return next;
        });
        setPlatformOverrides((s) => {
          const next = { ...s };
          for (const p of removed) delete next[p];
          return next;
        });
      }
      return platforms;
    });
  }, []);

  // ── Intelligence ──
  const [intel, setIntel] = useState<IntelData | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);

  // ── Scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Reset media when main platform changes ──
  const prevPlatformRef = useRef(platform);
  useEffect(() => {
    if (prevPlatformRef.current !== platform) {
      prevPlatformRef.current = platform;
      // Clear primary media
      setMediaUrls([]);
      setVideoFile(null);
      setThumbnailUrl(undefined);
      // Clear per-platform editor states & media
      setPlatformEditorStates({});
      setPlatformMedia({});
    }
  }, [platform]);

  // ── Auto-switch post type when platform changes ──
  useEffect(() => {
    const allowed = PLATFORM_POST_TYPES[platform];
    if (!allowed) return;
    const currentType = getValues('postType');
    const isAllowed = allowed.some((o) => o.value === currentType);
    if (!isAllowed) {
      setValue('postType', (PLATFORM_DEFAULT_TYPE[platform] ?? allowed[0].value) as ComposeForm['postType']);
    }
  }, [platform, getValues, setValue]);

  // ── Auto-remove incompatible extra platforms when post type changes ──
  const prevPostTypeRef = useRef(postType);
  useEffect(() => {
    if (prevPostTypeRef.current !== postType) {
      prevPostTypeRef.current = postType;
      // Clear media when post type changes (image ↔ video are incompatible)
      setMediaUrls([]);
      setVideoFile(null);
      setThumbnailUrl(undefined);
      setPlatformEditorStates({});
      setPlatformMedia({});
    }
    if (!multiPlatform || extraPlatforms.length === 0) return;
    const compatible = POST_TYPE_COMPATIBLE_PLATFORMS[postType] ?? [];
    const filtered = extraPlatforms.filter((p) => compatible.includes(p));
    if (filtered.length !== extraPlatforms.length) {
      setExtraPlatforms(filtered);
    }
  }, [postType, multiPlatform, extraPlatforms]);

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
      const data = result.data as { caption?: string; hashtags?: string[]; hooks?: string[]; mediaPrompt?: string; firstComment?: string; scheduledAt?: string } | null;

      let responseText = '';
      if (data?.caption) {
        responseText = `Here's what I came up with:\n\n`;
        if (data.hooks?.length) responseText += `**Hooks:**\n${data.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n`;
        responseText += `${data.caption}\n\n`;
        if (data.hashtags?.length) responseText += `Hashtags: ${data.hashtags.join(' ')}\n\n`;
        if (data.firstComment) responseText += `First comment: ${data.firstComment}\n\n`;
        if (data.mediaPrompt) responseText += `_Image idea: ${data.mediaPrompt}_\n\n`;
        responseText += `_Click "Apply" to use this in your post._`;
      } else {
        responseText = 'I generated some ideas but the format was unexpected. Try being more specific!';
      }

      setChatMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`, role: 'ai', content: responseText, timestamp: Date.now(),
        action: data?.caption ? 'apply' : undefined,
        applyData: data?.caption ? {
          caption: data.caption,
          hashtags: data.hashtags,
          firstComment: data.firstComment,
          scheduledAt: data.scheduledAt,
        } : undefined,
      }]);
    } catch {
      setChatMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: 'ai', content: "Sorry, I hit an error. Try again or rephrase your request.", timestamp: Date.now() }]);
    }
  }, [chatInput, agentLoading, studioCompose, platform]);

  const applyFromChat = useCallback((msg: ChatMessage) => {
    // Use structured applyData when available
    if (msg.applyData) {
      const d = msg.applyData;
      if (d.caption) setValue('caption', d.caption);
      if (d.hashtags?.length) setValue('hashtags', d.hashtags.join(', '));
      if (d.firstComment) { setValue('firstComment', d.firstComment); setShowFirstComment(true); }
      if (d.scheduledAt) { setValue('scheduledAt', d.scheduledAt); setShowSchedule(true); }
      message.success('Applied to your post!');
      return;
    }
    // Fallback: parse from text
    const lines = msg.content.split('\n').filter(Boolean);
    const captionLines = lines.filter((l) => !l.startsWith('**') && !l.startsWith('Hashtags:') && !l.startsWith('First comment:') && !l.startsWith('_') && !l.startsWith("Here's"));
    if (captionLines.length > 0) setValue('caption', captionLines.join('\n'));
    const hashtagLine = lines.find((l) => l.startsWith('Hashtags:'));
    if (hashtagLine) setValue('hashtags', hashtagLine.replace('Hashtags: ', ''));
    const commentLine = lines.find((l) => l.startsWith('First comment:'));
    if (commentLine) { setValue('firstComment', commentLine.replace('First comment: ', '')); setShowFirstComment(true); }
    message.success('Applied to your post!');
  }, [setValue, setShowFirstComment, setShowSchedule]);

  // ── AI Actions ──
  const handleRewrite = useCallback(async (intent: string, tone?: string) => {
    const currentCaption = getValues('caption');
    if (!currentCaption) { message.warning('Write some content first to rewrite'); return; }
    try {
      const result = await studioRewrite({ caption: currentCaption, intent, platform, tone }).unwrap();
      const data = result.data;
      if (data?.caption) setValue('caption', data.caption);
      if (data?.hashtags?.length) setValue('hashtags', data.hashtags.join(', '));
      message.success(data?.notes || 'Caption rewritten!');
    } catch { message.error('Rewrite failed'); }
  }, [getValues, studioRewrite, platform, setValue]);

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
  const onSubmit = useCallback(async (values: ComposeForm, status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' = 'DRAFT') => {
    try {
      const hashtags = values.hashtags?.split(',').map((h) => h.trim()).filter(Boolean) ?? [];
      const allMedia = [...mediaUrls];
      if (videoFile) {
        if (!videoFile.serverUrl) {
          message.error('Video upload is incomplete. Please remove and re-upload the video.');
          return;
        }
        allMedia.push(videoFile.serverUrl);
      }
      const base = {
        ...values, hashtags,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        status: values.scheduledAt && status !== 'PUBLISHED' ? 'SCHEDULED' : status,
        firstComment: values.firstComment || undefined,
        thumbnailUrl: thumbnailUrl || values.thumbnailUrl || undefined,
        mediaUrls: allMedia,
        threadEntries: values.postType === 'THREAD' ? threadEntries : undefined,
        platformOverrides: Object.keys(platformOverrides).length ? platformOverrides : undefined,
      };

      if (multiPlatform && extraPlatforms.length > 0) {
        const bulkGroupId = crypto.randomUUID();
        const primary = await createPost({ ...base, bulkGroupId }).unwrap();
        if (status === 'DRAFT' && primary.data?.id) setDraftId(primary.data.id);
        for (const p of extraPlatforms) {
          const override = platformOverrides[p];
          await createPost({ ...base, platform: p, caption: override?.caption || values.caption, hashtags: override?.hashtags || hashtags, bulkGroupId }).unwrap();
        }
      } else {
        const result = await createPost(base).unwrap();
        if (status === 'DRAFT' && result.data?.id) setDraftId(result.data.id);
      }

      const msgs: Record<string, string> = { DRAFT: 'Draft saved!', SCHEDULED: 'Post scheduled!', PUBLISHED: 'Publishing now!' };
      message.success(msgs[status] || 'Saved!');
      navigate('/calendar');
    } catch { message.error('Failed to save post'); }
  }, [mediaUrls, videoFile, thumbnailUrl, threadEntries, platformOverrides, multiPlatform, extraPlatforms, createPost, navigate]);

  // ── Content adaptation ──
  const handleConvertToShort = useCallback(() => {
    const pt = platform === 'YOUTUBE' ? 'SHORT' : platform === 'INSTAGRAM' ? 'REEL' : 'SHORT';
    setValue('postType', pt as ComposeForm['postType']);
    message.info(`Switched to ${pt === 'REEL' ? 'Reel' : 'Short'} format — use vertical 9:16 video`);
  }, [platform, setValue]);

  const handleConvertToStory = useCallback(() => {
    if (['INSTAGRAM', 'FACEBOOK'].includes(platform)) {
      setValue('postType', 'STORY' as ComposeForm['postType']);
      message.info('Switched to Story format — 9:16 vertical, 15s max');
    } else {
      message.warning('Stories are only available on Instagram and Facebook');
    }
  }, [platform, setValue]);

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
    multiPlatform, setMultiPlatform: handleSetMultiPlatform,
    extraPlatforms, setExtraPlatforms: handleSetExtraPlatforms,
    platformOverrides, setPlatformOverrides,
    mediaStrategy, setMediaStrategy,
    platformMedia, setPlatformMedia,
    platformEditorStates, updatePlatformEditorState,
    // Intelligence
    intel, intelLoading, fetchIntelligence,
    // Actions
    handleRewrite, handleAiOptimize, handleValidate, handleMultiPlatformAdapt,
    handleConvertToShort, handleConvertToStory,
    onSubmit,
  };
}
