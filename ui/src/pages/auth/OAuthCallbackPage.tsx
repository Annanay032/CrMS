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
  const [error, setError] = useState('');

  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  const hasTokens = !!accessToken && !!refreshToken;

  // Only fetch me once tokens are stored
  const [ready, setReady] = useState(false);
  const { data, isError } = useGetMeQuery(undefined, { skip: !ready });

  useEffect(() => {
    if (!hasTokens) return;
    localStorage.setItem('accessToken', accessToken!);
    localStorage.setItem('refreshToken', refreshToken!);
    setReady(true);
  }, [hasTokens, accessToken, refreshToken]);

  useEffect(() => {
    if (data?.data) {
      dispatch(setUser(data.data));
      navigate('/dashboard');
    }
    if (isError) {
      setError('Failed to load profile. Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [data, isError, dispatch, navigate]);

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
