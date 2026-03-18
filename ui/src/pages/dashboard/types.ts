export interface UpcomingPost {
  title: string;
  platform: string;
  time: string;
  status: 'SCHEDULED' | 'REVIEW' | 'DRAFT';
}

export interface RecentCampaign {
  title: string;
  creators: number;
  status: 'ACTIVE' | 'COMPLETED';
}
