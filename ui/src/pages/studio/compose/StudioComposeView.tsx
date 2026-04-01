import { useState, useRef, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import { Input, Typography, Tag, Segmented, Button, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare, faImage, faSliders, faRobot, faBrain, faStar, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { CHANNEL_META } from '@/pages/settings/constants';
import { MediaCropper } from '@/components/content/MediaCropper';
import { useCreateTemplateMutation } from '@/store/endpoints/content';
import { useComposeForm } from './useComposeForm';
import { ComposeToolbar, MediaZone, ChatPanel, IntelPanel, SettingsPanel } from './components';
import { PLATFORM_LIMITS, PLATFORM_OPTIONS, PLATFORM_POST_TYPES } from './constants';
import styles from './styles/compose.module.scss';
import type { ChatMessage } from './types';

const { Text } = Typography;
const { TextArea } = Input;

type EditorTab = 'write' | 'media' | 'details';

const MIN_PANEL = 320;

export function StudioComposeView() {
  const ctx = useComposeForm();
  const [createTemplate] = useCreateTemplateMutation();
  const [editorTab, setEditorTab] = useState<EditorTab>('write');
  const [panelWidth, setPanelWidth] = useState(380);
  const [selectedPlatform, setSelectedPlatform] = useState<string>(ctx.platform);
  const composeRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const showPerPlatform = ctx.multiPlatform && ctx.extraPlatforms.length > 0 && ctx.mediaStrategy === 'customize';
  const allPlatforms = [ctx.platform, ...ctx.extraPlatforms];

  // Derive effective active platform from selection + props
  const activePlatform = !showPerPlatform
    ? ctx.platform
    : (allPlatforms.includes(selectedPlatform) ? selectedPlatform : ctx.platform);
  const isPrimary = activePlatform === ctx.platform;

  // Derive caption/hashtags/charLimit for the active platform
  const activeState = !isPrimary ? ctx.platformEditorStates[activePlatform] : null;
  const activeCaption = isPrimary ? (ctx.form.watch('caption') ?? '') : (activeState?.caption ?? '');
  const activeHashtags = isPrimary ? (ctx.form.watch('hashtags') ?? '') : (activeState?.hashtags ?? '');
  const activeCharLimit = PLATFORM_LIMITS[activePlatform] ?? 2200;
  const activeCharCount = activeCaption.length;
  const activeMeta = CHANNEL_META[activePlatform];
  const activeLabel = activeMeta?.label ?? PLATFORM_OPTIONS.find((o) => o.value === activePlatform)?.label ?? activePlatform;
  const activePostTypeLabel = (PLATFORM_POST_TYPES[activePlatform] ?? []).find((o) => o.value === ctx.postType)?.label ?? ctx.postType;

  const handleHashtagClick = (tag: string) => {
    const curr = ctx.form.watch('hashtags') || '';
    const clean = tag.startsWith('#') ? tag.slice(1) : tag;
    if (!curr.includes(clean)) {
      ctx.form.setValue('hashtags', curr ? `${curr}, ${clean}` : clean);
    }
  };

  const handleCrop = (idx: number) => {
    ctx.setCropTargetIdx(idx);
    ctx.setCropperOpen(true);
  };

  /* ── Chat → Studio media sync ── */
  const handleChatMediaUpload = useCallback((url: string, type: 'image' | 'video') => {
    if (type === 'video') {
      ctx.setVideoFile({ url, serverUrl: url, name: url.split('/').pop() || 'video', size: 0 });
    } else {
      ctx.setMediaUrls((prev) => [...prev, url]);
    }
  }, [ctx]);

  /* ── Chat → Studio apply (enhanced) ── */
  const handleApplyFromChat = useCallback((msg: ChatMessage) => {
    if (msg.applyData) {
      const d = msg.applyData;
      if (d.caption) ctx.form.setValue('caption', d.caption);
      if (d.hashtags?.length) ctx.form.setValue('hashtags', d.hashtags.join(', '));
      if (d.firstComment) { ctx.setShowFirstComment(true); ctx.form.setValue('firstComment', d.firstComment); }
      if (d.scheduledAt) { ctx.setShowSchedule(true); ctx.form.setValue('scheduledAt', d.scheduledAt); }
      if (d.mediaUrl) handleChatMediaUpload(d.mediaUrl, 'image');
    } else {
      ctx.applyFromChat(msg);
    }
  }, [ctx, handleChatMediaUpload]);

  /* ── Save as Template ── */
  const handleSaveAsTemplate = useCallback(async () => {
    const caption = ctx.form.getValues('caption') || '';
    const hashtags = ctx.form.getValues('hashtags') || '';
    if (!caption.trim()) {
      message.warning('Write some content before saving as a template');
      return;
    }
    try {
      await createTemplate({
        name: caption.slice(0, 60),
        body: caption,
        hashtags,
        platform: ctx.platform,
        category: ctx.postType,
      }).unwrap();
      message.success('Template saved');
    } catch {
      message.error('Failed to save template');
    }
  }, [ctx.form, ctx.platform, ctx.postType, createTemplate]);

  /* ── Resize drag ── */
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !composeRef.current) return;
      const rect = composeRef.current.getBoundingClientRect();
      const maxPanel = rect.width * 0.5;
      const newWidth = Math.max(MIN_PANEL, Math.min(maxPanel, rect.right - e.clientX));
      setPanelWidth(newWidth);
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  return (
    <div className={styles.compose} ref={composeRef}>
      {/* ── Left: Editor ── */}
      <div className={styles.editor}>
        {/* Toolbar */}
        <ComposeToolbar
          control={ctx.form.control}
          platform={ctx.platform}
          postType={ctx.postType}
          activePanel={ctx.activePanel}
          multiPlatform={ctx.multiPlatform}
          extraPlatforms={ctx.extraPlatforms}
          mediaStrategy={ctx.mediaStrategy}
          agentLoading={ctx.agentLoading}
          intelLoading={ctx.intelLoading}
          showFirstComment={ctx.showFirstComment}
          showSchedule={ctx.showSchedule}
          onMultiPlatformChange={ctx.setMultiPlatform}
          onExtraPlatformsChange={ctx.setExtraPlatforms}
          onMediaStrategyChange={ctx.setMediaStrategy}
          onFetchIntelligence={ctx.fetchIntelligence}
          onAiOptimize={ctx.handleAiOptimize}
          onValidate={ctx.handleValidate}
          onToggleFirstComment={() => ctx.setShowFirstComment((p) => !p)}
          onToggleSchedule={() => ctx.setShowSchedule((p) => !p)}
          onSaveAsTemplate={handleSaveAsTemplate}
        />

        {/* Platform strip — shown when per-platform mode is active */}
        {showPerPlatform && (
          <div className={styles.mps_strip}>
            {allPlatforms.map((p) => {
              const meta = CHANNEL_META[p];
              const label = meta?.label ?? PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p;
              const isP = p === ctx.platform;
              const isActive = p === activePlatform;
              const hasEdits = !isP && !!ctx.platformEditorStates[p]?.caption;

              return (
                <button
                  key={p}
                  className={`${styles.mps_pill} ${isActive ? styles['mps_pill--active'] : ''}`}
                  onClick={() => setSelectedPlatform(p)}
                  style={isActive && meta ? { '--pill-color': meta.color, '--pill-bg': meta.bg } as React.CSSProperties : undefined}
                >
                  {meta?.icon && (
                    <FontAwesomeIcon
                      icon={meta.icon}
                      className={styles.mps_pill_icon}
                      style={isActive ? { color: meta.color } : undefined}
                    />
                  )}
                  <span className={styles.mps_pill_label}>{label}</span>
                  {isP && <FontAwesomeIcon icon={faStar} className={styles.mps_pill_star} />}
                  {hasEdits && (
                    <span className={styles.mps_pill_dot}>
                      <FontAwesomeIcon icon={faCheck} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Editor tab bar */}
        <div className={styles.editor_tabs}>
          {showPerPlatform && !isPrimary && (
            <div className={styles.editor_platform_ctx}>
              {activeMeta?.icon && (
                <FontAwesomeIcon icon={activeMeta.icon} style={{ color: activeMeta.color, fontSize: 14 }} />
              )}
              <Text strong style={{ fontSize: 13 }}>{activeLabel}</Text>
              <span className={styles.editor_platform_type}>{activePostTypeLabel}</span>
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                {activeCharCount} / {activeCharLimit}
              </Text>
            </div>
          )}
          <Segmented
            value={editorTab}
            onChange={(v) => setEditorTab(v as EditorTab)}
            options={[
              { label: 'Write', value: 'write', icon: <FontAwesomeIcon icon={faPenToSquare} /> },
              { label: 'Media', value: 'media', icon: <FontAwesomeIcon icon={faImage} /> },
              { label: 'Details', value: 'details', icon: <FontAwesomeIcon icon={faSliders} /> },
            ]}
            block
            size="middle"
          />
        </div>

        {/* Tab content */}
        <div className={styles.editor_content}>
          {editorTab === 'write' && (
            <div className={styles.write_tab}>
              {/* Caption — primary uses Controller, others use local state */}
              <div className={styles.write_area}>
                {isPrimary ? (
                  <Controller name="caption" control={ctx.form.control} render={({ field }) => (
                    <TextArea
                      {...field}
                      autoSize={{ minRows: 12, maxRows: 40 }}
                      placeholder="Start writing your post..."
                      className={styles.write_textarea}
                      bordered={false}
                    />
                  )} />
                ) : (
                  <TextArea
                    value={activeCaption}
                    onChange={(e) => {
                      const s = ctx.platformEditorStates[activePlatform] ?? { caption: '', hashtags: '', mediaUrls: [], videoFile: null };
                      ctx.updatePlatformEditorState(activePlatform, { ...s, caption: e.target.value });
                    }}
                    autoSize={{ minRows: 12, maxRows: 40 }}
                    placeholder={`Write ${activeLabel}-specific content...`}
                    className={styles.write_textarea}
                    bordered={false}
                  />
                )}
              </div>
              <div className={styles.write_footer}>
                {isPrimary ? (
                  <Controller name="hashtags" control={ctx.form.control} render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="#hashtags, comma separated..."
                      bordered={false}
                      prefix={<Tag color="blue" style={{ marginRight: 4 }}>#</Tag>}
                      className={styles.write_hashtag}
                    />
                  )} />
                ) : (
                  <Input
                    value={activeHashtags}
                    onChange={(e) => {
                      const s = ctx.platformEditorStates[activePlatform] ?? { caption: '', hashtags: '', mediaUrls: [], videoFile: null };
                      ctx.updatePlatformEditorState(activePlatform, { ...s, hashtags: e.target.value });
                    }}
                    placeholder="#hashtags, comma separated..."
                    bordered={false}
                    prefix={<Tag color="blue" style={{ marginRight: 4 }}>#</Tag>}
                    className={styles.write_hashtag}
                  />
                )}
                <Text
                  type={activeCharCount > activeCharLimit ? 'danger' : activeCharCount > activeCharLimit * 0.9 ? 'warning' : 'secondary'}
                  className={styles.write_charcount}
                >
                  {activeCharCount} / {activeCharLimit}
                </Text>
              </div>
            </div>
          )}

          {editorTab === 'media' && (
            <div className={styles.media_tab}>
              {isPrimary ? (
                <MediaZone
                  postType={ctx.postType}
                  platform={ctx.platform}
                  charLimit={ctx.charLimit}
                  mediaUrls={ctx.mediaUrls}
                  onSetMediaUrls={ctx.setMediaUrls}
                  videoFile={ctx.videoFile}
                  onSetVideoFile={ctx.setVideoFile}
                  thumbnailUrl={ctx.thumbnailUrl}
                  onSetThumbnailUrl={ctx.setThumbnailUrl}
                  onSetFormThumbnail={(url) => ctx.form.setValue('thumbnailUrl', url)}
                  threadEntries={ctx.threadEntries}
                  onSetThreadEntries={ctx.setThreadEntries}
                  onCrop={handleCrop}
                />
              ) : (
                <MediaZone
                  postType={ctx.postType}
                  platform={activePlatform}
                  charLimit={activeCharLimit}
                  mediaUrls={activeState?.mediaUrls ?? []}
                  onSetMediaUrls={(action) => {
                    const s = ctx.platformEditorStates[activePlatform] ?? { caption: '', hashtags: '', mediaUrls: [], videoFile: null };
                    const next = typeof action === 'function' ? action(s.mediaUrls) : action;
                    ctx.updatePlatformEditorState(activePlatform, { ...s, mediaUrls: next });
                  }}
                  videoFile={activeState?.videoFile ?? null}
                  onSetVideoFile={(action) => {
                    const s = ctx.platformEditorStates[activePlatform] ?? { caption: '', hashtags: '', mediaUrls: [], videoFile: null };
                    const next = typeof action === 'function' ? action(s.videoFile) : action;
                    ctx.updatePlatformEditorState(activePlatform, { ...s, videoFile: next });
                  }}
                  thumbnailUrl={activeState?.thumbnailUrl}
                  onSetThumbnailUrl={(url) => {
                    const s = ctx.platformEditorStates[activePlatform] ?? { caption: '', hashtags: '', mediaUrls: [], videoFile: null };
                    ctx.updatePlatformEditorState(activePlatform, { ...s, thumbnailUrl: url });
                  }}
                  onSetFormThumbnail={(url) => {
                    const s = ctx.platformEditorStates[activePlatform] ?? { caption: '', hashtags: '', mediaUrls: [], videoFile: null };
                    ctx.updatePlatformEditorState(activePlatform, { ...s, thumbnailUrl: url });
                  }}
                  threadEntries={ctx.threadEntries}
                  onSetThreadEntries={ctx.setThreadEntries}
                  onCrop={handleCrop}
                />
              )}
            </div>
          )}

          {editorTab === 'details' && (
            <div className={styles.details_tab}>
              <SettingsPanel
                control={ctx.form.control}
                watch={ctx.form.watch}
                multiPlatform={ctx.multiPlatform}
                extraPlatforms={ctx.extraPlatforms}
                agentLoading={ctx.agentLoading}
                onAdaptAll={ctx.handleMultiPlatformAdapt}
                showFirstComment={ctx.showFirstComment}
                showSchedule={ctx.showSchedule}
              />
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className={styles.actions}>
          <Button loading={ctx.saving} onClick={ctx.form.handleSubmit((v) => ctx.onSubmit(v))}>
            Save Draft
          </Button>
          <Button loading={ctx.saving} onClick={ctx.form.handleSubmit((v) => ctx.onSubmit(v, 'SCHEDULED'))}>
            Schedule
          </Button>
          <Button type="primary" loading={ctx.saving} onClick={ctx.form.handleSubmit((v) => ctx.onSubmit(v, 'PUBLISHED'))}>
            Publish Now
          </Button>
        </div>
      </div>

      {/* ── Resize handle ── */}
      <div className={styles.resize_handle} onMouseDown={onDragStart}>
        <div className={styles.resize_grip} />
      </div>

      {/* ── Right: Panel ── */}
      <div className={styles.panel} style={{ width: panelWidth }}>
        <div className={styles.panel_header}>
          <Segmented
            value={ctx.activePanel}
            onChange={(v) => ctx.setActivePanel(v as 'chat' | 'intel' | 'settings')}
            options={[
              { label: 'AI Copilot', value: 'chat', icon: <FontAwesomeIcon icon={faRobot} /> },
              { label: 'Intel', value: 'intel', icon: <FontAwesomeIcon icon={faBrain} /> },
            ]}
            size="small"
          />
        </div>

        {ctx.activePanel === 'chat' ? (
          <ChatPanel
            messages={ctx.chatMessages}
            input={ctx.chatInput}
            loading={ctx.agentLoading}
            onInputChange={ctx.setChatInput}
            onSend={ctx.sendChat}
            onApply={handleApplyFromChat}
            onMediaUpload={handleChatMediaUpload}
            chatEndRef={ctx.chatEndRef}
          />
        ) : (
          <IntelPanel
            intel={ctx.intel}
            loading={ctx.intelLoading}
            onHashtagClick={handleHashtagClick}
          />
        )}
      </div>

      {/* Cropper */}
      {ctx.mediaUrls[ctx.cropTargetIdx] && (
        <MediaCropper
          open={ctx.cropperOpen}
          onClose={() => ctx.setCropperOpen(false)}
          imageUrl={ctx.mediaUrls[ctx.cropTargetIdx]}
          platform={ctx.platform}
          onCrop={(croppedUrl) => {
            ctx.setMediaUrls((prev) => prev.map((u, i) => (i === ctx.cropTargetIdx ? croppedUrl : u)));
          }}
        />
      )}
    </div>
  );
}
