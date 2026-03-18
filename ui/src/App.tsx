import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OAuthCallbackPage } from './pages/auth/OAuthCallbackPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CalendarPage } from './pages/content/CalendarPage';
import { CreatePostPage } from './pages/content/CreatePostPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { CampaignsPage } from './pages/campaigns/CampaignsPage';
import { DiscoverPage } from './pages/discover/DiscoverPage';
import { CommunityPage } from './pages/community/CommunityPage';
import { TrendsPage } from './pages/trends/TrendsPage';
import { AiAssistantPage } from './pages/ai/AiAssistantPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/content/new" element={<CreatePostPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/ai" element={<AiAssistantPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
