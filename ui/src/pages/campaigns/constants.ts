export const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'blue',
  CANCELLED: 'error',
};

export const STAGE_COLOR: Record<string, string> = {
  BRIEF: 'default',
  RECRUITING: 'blue',
  IN_PROGRESS: 'processing',
  REVIEW: 'warning',
  COMPLETED: 'success',
};

export const STAGE_LABELS: Record<string, string> = {
  BRIEF: 'Brief',
  RECRUITING: 'Recruiting',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
};

export const DELIVERABLE_STATUS_COLOR: Record<string, string> = {
  PENDING: 'default',
  IN_PROGRESS: 'processing',
  SUBMITTED: 'blue',
  REVISION_REQUESTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

export const DELIVERABLE_TYPE_OPTIONS = [
  { value: 'POST', label: 'Post' },
  { value: 'STORY', label: 'Story' },
  { value: 'REEL', label: 'Reel' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'UNBOXING', label: 'Unboxing' },
  { value: 'TUTORIAL', label: 'Tutorial' },
  { value: 'OTHER', label: 'Other' },
];

export const DELIVERABLE_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'REVISION_REQUESTED', label: 'Revision Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export const PLATFORM_OPTIONS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'Twitter / X' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'PINTEREST', label: 'Pinterest' },
  { value: 'SNAPCHAT', label: 'Snapchat' },
  { value: 'THREADS', label: 'Threads' },
];

export const CAMPAIGN_STAGES = ['BRIEF', 'RECRUITING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const;
