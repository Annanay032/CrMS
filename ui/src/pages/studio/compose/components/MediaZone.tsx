import { ImageUploader, VideoUploader, CarouselUploader, StoryUploader, ThreadEditor } from '../uploaders';
import type { VideoFileInfo, ThreadEntry } from '../types';

interface Props {
  postType: string;
  platform: string;
  charLimit: number;
  mediaUrls: string[];
  onSetMediaUrls: React.Dispatch<React.SetStateAction<string[]>>;
  videoFile: VideoFileInfo | null;
  onSetVideoFile: React.Dispatch<React.SetStateAction<VideoFileInfo | null>>;
  thumbnailUrl?: string;
  onSetThumbnailUrl: (url: string | undefined) => void;
  onSetFormThumbnail: (url: string) => void;
  threadEntries: ThreadEntry[];
  onSetThreadEntries: React.Dispatch<React.SetStateAction<ThreadEntry[]>>;
  onCrop: (idx: number) => void;
}

export function MediaZone({
  postType, platform, charLimit,
  mediaUrls, onSetMediaUrls,
  videoFile, onSetVideoFile,
  thumbnailUrl, onSetThumbnailUrl, onSetFormThumbnail,
  threadEntries, onSetThreadEntries,
  onCrop,
}: Props) {
  switch (postType) {
    case 'IMAGE':
      return <ImageUploader mediaUrls={mediaUrls} onSetMediaUrls={onSetMediaUrls} onCrop={onCrop} />;
    case 'CAROUSEL':
      return <CarouselUploader mediaUrls={mediaUrls} onSetMediaUrls={onSetMediaUrls} onCrop={onCrop} />;
    case 'VIDEO':
    case 'REEL':
    case 'SHORT':
      return <VideoUploader postType={postType} videoFile={videoFile} thumbnailUrl={thumbnailUrl} onSetVideoFile={onSetVideoFile} onSetThumbnailUrl={onSetThumbnailUrl} onSetFormThumbnail={onSetFormThumbnail} />;
    case 'STORY':
      return <StoryUploader mediaUrls={mediaUrls} videoFile={videoFile} onSetMediaUrls={onSetMediaUrls} onSetVideoFile={onSetVideoFile} />;
    case 'THREAD':
      return <ThreadEditor entries={threadEntries} onSetEntries={onSetThreadEntries} charLimit={charLimit} platform={platform} />;
    default:
      return null;
  }
}
