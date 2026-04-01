import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Alert, Checkbox, Modal, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useLoginMutation, useForgotPasswordMutation } from '@/store/endpoints/auth';
import { useAppDispatch } from '@/hooks/store';
import { setCredentials } from '@/store/auth.slice';
import { loginSchema, forgotPasswordSchema, type LoginForm } from './constants';
import { BrandPanel } from './components/BrandPanel';
import { FeatureList } from './components/FeatureList';
import { SSOButtons } from './components/SSOButtons';
import styles from './Auth.module.scss';

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();
  const [forgotPasswordApi, { isLoading: sendingReset }] = useForgotPasswordMutation();
  const [error, setError] = useState(params.get('error') === 'oauth_failed' ? 'OAuth sign-in failed. Please try again.' : '');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

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

  const handleForgotPassword = async () => {
    const result = forgotPasswordSchema.safeParse({ email: forgotEmail });
    if (!result.success) {
      message.error('Enter a valid email address');
      return;
    }
    try {
      await forgotPasswordApi({ email: forgotEmail }).unwrap();
      message.success('If that email exists, a password reset link has been sent.');
      setForgotOpen(false);
      setForgotEmail('');
    } catch {
      message.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className={styles.auth}>
      <BrandPanel
        tagline={<>Manage creators,<br />amplify brands,<br />grow together.</>}
      >
        <FeatureList />
      </BrandPanel>

      <div className={styles.auth__form}>
        <div className={styles.auth__card}>
          <div className={styles.auth__mobile_logo}>
            <h1>CrMS</h1>
            <p>Creator Management System</p>
          </div>

          <div className={styles.auth__form_logo}>
            <div className={styles.auth__form_logo_mark}>Cr</div>
            <span className={styles.auth__form_logo_text}>CrMS</span>
          </div>

          <div className={styles.auth__heading}>
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <SSOButtons action="Sign in" />

          <div className={styles.auth__divider}>
            <span>or sign in with email</span>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              closable
              onClose={() => setError('')}
            />
          )}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Email"
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="you@example.com"
                    size="large"
                    prefix={<FontAwesomeIcon icon={faEnvelope} style={{ color: '#94a3b8', fontSize: 13 }} />}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} placeholder="Enter your password" size="large" />
                )}
              />
            </Form.Item>

            <div className={styles.auth__form_extras}>
              <Checkbox defaultChecked>Remember me</Checkbox>
              <button
                type="button"
                className={styles.auth__forgot_link}
                onClick={() => setForgotOpen(true)}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              size="large"
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

      <Modal
        title="Reset your password"
        open={forgotOpen}
        onCancel={() => setForgotOpen(false)}
        onOk={handleForgotPassword}
        confirmLoading={sendingReset}
        okText="Send reset link"
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        <Input
          size="large"
          placeholder="you@example.com"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          prefix={<FontAwesomeIcon icon={faEnvelope} style={{ color: '#94a3b8', fontSize: 13 }} />}
        />
      </Modal>
    </div>
  );
}
