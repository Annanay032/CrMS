import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppSelector, useAppDispatch } from '@/hooks/store';
import { setUser } from '@/store/auth.slice';
import { useGetMeQuery } from '@/store/endpoints/auth';
import styles from './AppLayout.module.scss';

export function AppLayout() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const { data } = useGetMeQuery(undefined, { skip: !isAuthenticated || !!user });

  useEffect(() => {
    if (data?.data) dispatch(setUser(data.data));
  }, [data, dispatch]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.layout__main}>
        <TopBar />
        <main className={styles.layout__content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
