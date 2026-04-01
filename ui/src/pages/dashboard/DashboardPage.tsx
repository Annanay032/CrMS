import { useAppSelector } from '@/hooks/store';
import { CreatorDashboard } from './components/CreatorDashboard';
import { BrandDashboard } from './components/BrandDashboard';
import s from './styles/Dashboard.module.scss';

export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div>
      <div className={s.page_header}>
        <h1 className={s.page_title}>Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className={s.page_subtitle}>
          Here&apos;s what&apos;s happening with your {user?.role === 'BRAND' ? 'campaigns' : 'content'} today.
        </p>
      </div>
      {user?.role === 'BRAND' ? <BrandDashboard /> : <CreatorDashboard />}
    </div>
  );
}
