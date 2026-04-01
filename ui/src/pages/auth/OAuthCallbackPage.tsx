import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result } from 'antd';
import { useAppDispatch } from '@/hooks/store';
import { setUser } from '@/store/auth.slice';
import { useGetMeQuery } from '@/store/endpoints/auth';
import styles from './Auth.module.scss';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const dispatch = useAppDispatch();

  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  const hasTokens = !!accessToken && !!refreshToken;

  // Store tokens then mark ready so the /me query fires
  const [ready, setReady] = useState(false);
  const { data, isError } = useGetMeQuery(undefined, { skip: !ready });

  useEffect(() => {
    if (!hasTokens) return;
    localStorage.setItem('accessToken', accessToken!);
    localStorage.setItem('refreshToken', refreshToken!);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must trigger query after storing tokens
    setReady(true);
  }, [hasTokens, accessToken, refreshToken]);

  useEffect(() => {
    if (data?.data) {
      dispatch(setUser(data.data));
      navigate('/dashboard');
    }
    if (isError) {
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [data, isError, dispatch, navigate]);

  const error = isError ? 'Failed to load profile. Redirecting...' : '';

  if (!hasTokens || error) {
    return (
      <div className={styles.auth__callback}>
        <Result status="error" title="Authentication failed" subTitle={error || 'No tokens received.'} extra={<a href="/login">Return to login</a>} />
      </div>
    );
  }

  return (
    <div className={styles.auth__callback}>
      <Spin size="large" tip="Signing you in..." />
    </div>
  );
}
