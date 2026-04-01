import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage, RegisterPage, OAuthCallbackPage } from '@/pages/auth';
import { DashboardPage } from '@/pages/dashboard';
import { CalendarPage, CreatePostPage, ContentListPage, PostDetailPage } from '@/pages/content';
import { AnalyticsPage } from '@/pages/analytics';
import { CampaignsPage } from '@/pages/campaigns';
import { DiscoverPage } from '@/pages/discover';
import { CommunityPage } from '@/pages/community';
import { TrendsPage } from '@/pages/trends';
import { ListeningPage } from '@/pages/listening';
import { CompetitivePage } from '@/pages/competitive';
import { AiAssistantPage } from '@/pages/ai';
import { SettingsPage } from '@/pages/settings';
import { TeamSettingsPage } from '@/pages/settings';
import { BioBuilderPage } from '@/pages/bio';
import { CreatePage } from '@/pages/create';
import { UsagePage } from '@/pages/usage';
import { MediaLibraryPage } from '@/pages/media';
import RevenuePage from '@/pages/revenue/RevenuePage';
import ContractsPage from '@/pages/revenue/ContractsPage';
import GrowthCopilotPage from '@/pages/growth/GrowthCopilotPage';
import { PricingPage } from '@/pages/pricing';
import { StudioLayout, StudioCompose, StudioMediaLab, StudioTemplates, StudioAiCopilot, StudioVideoLab, StudioVideoAnalysis } from '@/pages/studio';
import { ChannelLayout, ChannelOverview, ChannelPosts, ChannelAnalytics, ChannelAiInsights } from '@/pages/channel';
import { AdminUsersPage, AdminAgentLogsPage, AdminSystemPage } from '@/pages/admin';
import { ContactsPage, ContactDetailPage, PipelinePage, SignalsDashboard } from '@/pages/crm';
import { TeamPage } from '@/pages/teams';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/content" element={<ContentListPage />} />
        <Route path="/content/new" element={<CreatePostPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/campaigns/my" element={<CampaignsPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/listening" element={<ListeningPage />} />
        <Route path="/competitive" element={<CompetitivePage />} />
        <Route path="/ai" element={<AiAssistantPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/team" element={<TeamSettingsPage />} />
        <Route path="/teams" element={<TeamPage />} />
        <Route path="/bio" element={<BioBuilderPage />} />
        <Route path="/usage" element={<UsagePage />} />
        <Route path="/media" element={<MediaLibraryPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/growth" element={<GrowthCopilotPage />} />
        <Route path="/studio" element={<StudioLayout />}>
          <Route index element={<StudioCompose />} />
          <Route path="compose" element={<StudioCompose />} />
          <Route path="media-lab" element={<StudioMediaLab />} />
          <Route path="templates" element={<StudioTemplates />} />
          <Route path="video-lab" element={<StudioVideoLab />} />
          <Route path="video-analysis" element={<StudioVideoAnalysis />} />
          <Route path="ai" element={<StudioAiCopilot />} />
        </Route>
        <Route path="/channel/:platform" element={<ChannelLayout />}>
          <Route index element={<ChannelOverview />} />
          <Route path="posts" element={<ChannelPosts />} />
          <Route path="analytics" element={<ChannelAnalytics />} />
          <Route path="insights" element={<ChannelAiInsights />} />
        </Route>
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/agents" element={<AdminAgentLogsPage />} />
        <Route path="/admin/system" element={<AdminSystemPage />} />
        <Route path="/crm/contacts" element={<ContactsPage />} />
        <Route path="/crm/contacts/:id" element={<ContactDetailPage />} />
        <Route path="/crm/pipeline" element={<PipelinePage />} />
        <Route path="/crm/signals" element={<SignalsDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
