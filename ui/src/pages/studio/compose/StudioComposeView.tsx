import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Input, Typography, Tag, Segmented, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare, faImage, faSliders, faRobot, faBrain, faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { MediaCropper } from '@/components/content/MediaCropper';
import { useComposeForm } from './useComposeForm';
import { ComposeToolbar } from './ComposeToolbar';
import { MediaZone } from './MediaZone';
import { ChatPanel } from './ChatPanel';
import { IntelPanel } from './IntelPanel';
import { SettingsPanel } from './SettingsPanel';
import styles from './compose.module.scss';

const { Text } = Typography;
const { TextArea } = Input;

type EditorTab = 'write' | 'media' | 'details';

export function StudioComposeView() {
  const ctx = useComposeForm();
  const [editorTab, setEditorTab] = useState<EditorTab>('write');

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

  return (
    <div className={styles.compose}>
      {/* ── Left: Editor ── */}
      <div className={styles.editor}>
        {/* Toolbar */}
        <ComposeToolbar
          control={ctx.form.control}
          platform={ctx.platform}
          activePanel={ctx.activePanel}
          multiPlatform={ctx.multiPlatform}
          extraPlatforms={ctx.extraPlatforms}
          agentLoading={ctx.agentLoading}
          intelLoading={ctx.intelLoading}
          showFirstComment={ctx.showFirstComment}
          showSchedule={ctx.showSchedule}
          onMultiPlatformChange={ctx.setMultiPlatform}
          onExtraPlatformsChange={ctx.setExtraPlatforms}
          onFetchIntelligence={ctx.fetchIntelligence}
          onAiOptimize={ctx.handleAiOptimize}
          onValidate={ctx.handleValidate}
          onToggleFirstComment={() => ctx.setShowFirstComment((p) => !p)}
          onToggleSchedule={() => ctx.setShowSchedule((p) => !p)}
        />

        {/* Editor tab bar */}
        <div className={styles.editor_tabs}>
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
              {/* Caption */}
              <div className={styles.write_area}>
                <Controller name="caption" control={ctx.form.control} render={({ field }) => (
                  <TextArea
                    {...field}
                    autoSize={{ minRows: 12, maxRows: 40 }}
                    placeholder="Start writing your post..."
                    className={styles.write_textarea}
                    bordered={false}
                  />
                )} />
              </div>
              <div className={styles.write_footer}>
                <Controller name="hashtags" control={ctx.form.control} render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="#hashtags, comma separated..."
                    bordered={false}
                    prefix={<Tag color="blue" style={{ marginRight: 4 }}>#</Tag>}
                    className={styles.write_hashtag}
                  />
                )} />
                <Text
                  type={ctx.charCount > ctx.charLimit ? 'danger' : ctx.charCount > ctx.charLimit * 0.9 ? 'warning' : 'secondary'}
                  className={styles.write_charcount}
                >
                  {ctx.charCount} / {ctx.charLimit}
                </Text>
              </div>
            </div>
          )}

          {editorTab === 'media' && (
            <div className={styles.media_tab}>
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
            </div>
          )}

          {editorTab === 'details' && (
            <div className={styles.details_tab}>
              <SettingsPanel
                control={ctx.form.control}
                watch={ctx.form.watch}
                multiPlatform={ctx.multiPlatform}
                extraPlatforms={ctx.extraPlatforms}
                platformOverrides={ctx.platformOverrides}
                onSetPlatformOverrides={ctx.setPlatformOverrides}
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
          <Button type="primary" loading={ctx.saving} onClick={ctx.form.handleSubmit((v) => ctx.onSubmit(v))}>
            Save Draft
          </Button>
          <Button loading={ctx.saving} onClick={ctx.form.handleSubmit((v) => ctx.onSubmit(v, 'SCHEDULED'))}>
            Schedule
          </Button>
        </div>
      </div>

      {/* ── Right: Panel ── */}
      <div className={styles.panel}>
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
            onApply={ctx.applyFromChat}
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
