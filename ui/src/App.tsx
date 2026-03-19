import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage, RegisterPage, OAuthCallbackPage } from '@/pages/auth';
import { DashboardPage } from '@/pages/dashboard';
import { CalendarPage, CreatePostPage } from '@/pages/content';
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
import GrowthCopilotPage from '@/pages/growth/GrowthCopilotPage';
import { PricingPage } from '@/pages/pricing';

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
        <Route path="/content/new" element={<CreatePostPage />} />
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
        <Route path="/bio" element={<BioBuilderPage />} />
        <Route path="/usage" element={<UsagePage />} />
        <Route path="/media" element={<MediaLibraryPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route path="/growth" element={<GrowthCopilotPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
