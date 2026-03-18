import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useRegisterMutation } from '@/store/endpoints/auth';
import { useAppDispatch } from '@/hooks/store';
import { setCredentials } from '@/store/auth.slice';
import { registerSchema, ROLE_OPTIONS, type RegisterForm } from './constants';
import { BrandPanel } from './components/BrandPanel';
import { StatGrid } from './components/StatGrid';
import { GoogleButton } from './components/GoogleButton';
import styles from './Auth.module.scss';

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [registerApi, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState('');

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CREATOR' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterForm) => {
    setError('');
    try {
      const result = await registerApi(values).unwrap();
      dispatch(setCredentials({
        user: result.data.user,
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      }));
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      setError(e?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className={styles.auth}>
      <BrandPanel
        tagline={<>Join thousands of<br />creators &amp; brands<br />growing together.</>}
      >
        <StatGrid />
      </BrandPanel>

      <div className={styles.auth__form}>
        <div className={styles.auth__card} style={{ maxWidth: 460 }}>
          <div className={styles.auth__mobile_logo}>
            <h1>CrMS</h1>
            <p>Creator Management System</p>
          </div>

          <div className={styles.auth__form_logo}>
            <div className={styles.auth__form_logo_mark}>Cr</div>
            <span className={styles.auth__form_logo_text}>CrMS</span>
          </div>

          <div className={styles.auth__heading}>
            <h2>Create your account</h2>
            <p>Get started free &mdash; no credit card required</p>
          </div>

          <GoogleButton />

          <div className={styles.auth__divider}>
            <span>or register with email</span>
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
              label="Full Name"
              validateStatus={errors.name ? 'error' : ''}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Jane Creator" size="large" />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="you@example.com" size="large" />
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
                  <Input.Password {...field} placeholder="Min 8 characters" size="large" />
                )}
              />
            </Form.Item>

            <Form.Item label="I am a...">
              <div className={styles.auth__role_grid}>
                {ROLE_OPTIONS.map(({ value, label, icon, desc }) => (
                  <label
                    key={value}
                    className={`${styles.auth__role_card} ${selectedRole === value ? styles['auth__role_card--selected'] : ''}`}
                    onClick={() => setValue('role', value)}
                  >
                    <input type="radio" value={value} checked={selectedRole === value} readOnly />
                    <div className={styles.auth__role_icon_wrap}>
                      <FontAwesomeIcon icon={icon} />
                    </div>
                    <span className={styles.auth__role_label}>{label}</span>
                    <span className={styles.auth__role_desc}>{desc}</span>
                  </label>
                ))}
              </div>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              size="large"
              icon={<FontAwesomeIcon icon={faArrowRight} />}
              iconPosition="end"
            >
              Create account
            </Button>
          </Form>

          <p className={styles.auth__footer}>
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
