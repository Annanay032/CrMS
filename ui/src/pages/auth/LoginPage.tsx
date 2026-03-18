import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useLoginMutation } from '@/store/endpoints/auth';
import { useAppDispatch } from '@/hooks/store';
import { setCredentials } from '@/store/auth.slice';
import { loginSchema, type LoginForm } from './constants';
import { BrandPanel } from './components/BrandPanel';
import { FeatureList } from './components/FeatureList';
import { GoogleButton } from './components/GoogleButton';
import styles from './Auth.module.scss';

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginForm) => {
    setError('');
    try {
      const result = await login(values).unwrap();
      dispatch(setCredentials({
        user: result.data.user,
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      }));
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      setError(e?.data?.error || 'Login failed');
    }
  };

  return (
    <div className={styles.auth}>
      <BrandPanel tagline={<>Manage creators,<br />amplify brands,<br />grow together.</>}>
        <FeatureList />
      </BrandPanel>

      <div className={styles.auth__form}>
        <div className={styles.auth__form_inner}>
          <div className={styles.auth__mobile_logo}>
            <h1>CrMS</h1>
            <p>Creator Management System</p>
          </div>

          <div className={styles.auth__heading}>
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <GoogleButton />

          <div className={styles.auth__divider}>
            <span>or sign in with email</span>
          </div>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable onClose={() => setError('')} />}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item label="Email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
              <Controller name="email" control={control} render={({ field }) => (
                <Input {...field} placeholder="you@example.com" size="large" />
              )} />
            </Form.Item>

            <Form.Item label="Password" validateStatus={errors.password ? 'error' : ''} help={errors.password?.message}>
              <Controller name="password" control={control} render={({ field }) => (
                <Input.Password {...field} placeholder="••••••••" size="large" />
              )} />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={isLoading} block size="large"
              icon={<FontAwesomeIcon icon={faArrowRight} />}
              iconPosition="end"
            >
              Sign in
            </Button>
          </Form>

          <p className={styles.auth__footer}>
            Don&apos;t have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
