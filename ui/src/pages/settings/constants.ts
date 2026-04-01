import {
  faInstagram, faYoutube, faTiktok, faXTwitter,
  faLinkedinIn, faThreads, faBluesky, faFacebookF,
  faPinterestP, faMastodon,
} from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface ChannelMeta {
  icon: IconDefinition;
  color: string;
  bg: string;
  label: string;
  subtitle: string;
}

export const CHANNEL_META: Record<string, ChannelMeta> = {
  INSTAGRAM: { icon: faInstagram, color: '#E4405F', bg: '#fde8ee', label: 'Instagram', subtitle: 'Business, Creator, or Personal' },
  THREADS: { icon: faThreads, color: '#000000', bg: '#f0f0f0', label: 'Threads', subtitle: 'Connect via Meta' },
  LINKEDIN: { icon: faLinkedinIn, color: '#0A66C2', bg: '#e8f1fb', label: 'LinkedIn', subtitle: 'Page or Profile' },
  FACEBOOK: { icon: faFacebookF, color: '#1877F2', bg: '#e8f0fe', label: 'Facebook', subtitle: 'Page' },
  BLUESKY: { icon: faBluesky, color: '#0085FF', bg: '#e6f2ff', label: 'Bluesky', subtitle: 'Handle & App Password' },
  YOUTUBE: { icon: faYoutube, color: '#FF0000', bg: '#fee8e8', label: 'YouTube', subtitle: 'Channel' },
  TIKTOK: { icon: faTiktok, color: '#000000', bg: '#f0f0f0', label: 'TikTok', subtitle: 'Creator or Business' },
  MASTODON: { icon: faMastodon, color: '#6364FF', bg: '#ededff', label: 'Mastodon', subtitle: 'Any instance' },
  PINTEREST: { icon: faPinterestP, color: '#E60023', bg: '#fde8eb', label: 'Pinterest', subtitle: 'Business account' },
  TWITTER: { icon: faXTwitter, color: '#000000', bg: '#f0f0f0', label: 'X (Twitter)', subtitle: 'Profile' },
};
