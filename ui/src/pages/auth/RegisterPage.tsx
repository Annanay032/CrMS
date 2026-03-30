import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Checkbox, Steps, Progress } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faEnvelope, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { useRegisterMutation } from '@/store/endpoints/auth';
import { useAppDispatch } from '@/hooks/store';
import { setCredentials } from '@/store/auth.slice';
import { registerSchema, ROLE_OPTIONS, type RegisterForm } from './constants';
import { BrandPanel } from './components/BrandPanel';
import { StatGrid } from './components/StatGrid';
import { SSOButtons } from './components/SSOButtons';
import styles from './Auth.module.scss';

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [registerApi, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  const { control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CREATOR', agreeTerms: undefined as unknown as true },
  });

  const selectedRole = watch('role');
  const password = watch('password');

  // Password strength meter
  const getPasswordStrength = (pw: string | undefined): { percent: number; status: 'exception' | 'active' | 'success'; label: string } => {
    if (!pw) return { percent: 0, status: 'exception', label: '' };
    let score = 0;
    if (pw.length >= 8) score += 25;
    if (pw.length >= 12) score += 15;
    if (/[A-Z]/.test(pw)) score += 20;
    if (/[0-9]/.test(pw)) score += 20;
    if (/[^A-Za-z0-9]/.test(pw)) score += 20;
    if (score < 40) return { percent: score, status: 'exception', label: 'Weak' };
    if (score < 70) return { percent: score, status: 'active', label: 'Fair' };
    return { percent: score, status: 'success', label: 'Strong' };
  };

  const pwStrength = getPasswordStrength(password);

  const nextStep = async () => {
    if (step === 0) {
      const valid = await trigger(['name', 'email', 'password']);
      if (valid) setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const onSubmit = async (values: RegisterForm) => {
    setError('');
    try {
      const result = await registerApi({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        inviteCode: values.inviteCode,
      }).unwrap();
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
        <div className={styles.auth__card} style={{ maxWidth: 480 }}>
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

          <Steps
            current={step}
            size="small"
            className={styles.auth__steps}
            items={[
              { title: 'Account' },
              { title: 'Role' },
              { title: 'Confirm' },
            ]}
          />

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              closable
              onClose={() => setError('')}
              style={{ marginTop: 16 }}
            />
          )}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ marginTop: 20 }}>
            {/* ── Step 0: Account Info ── */}
            <div style={{ display: step === 0 ? 'block' : 'none' }}>
              <SSOButtons action="Sign up" />

              <div className={styles.auth__divider}>
                <span>or register with email</span>
              </div>

              <Form.Item
                label="Full Name"
                validateStatus={errors.name ? 'error' : ''}
                help={errors.name?.message}
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Jane Creator"
                      size="large"
                      prefix={<FontAwesomeIcon icon={faUser} style={{ color: '#94a3b8', fontSize: 13 }} />}
                    />
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
                    <Input.Password
                      {...field}
                      placeholder="Min 8 characters"
                      size="large"
                      prefix={<FontAwesomeIcon icon={faLock} style={{ color: '#94a3b8', fontSize: 13 }} />}
                    />
                  )}
                />
              </Form.Item>

              {password && (
                <div className={styles.auth__pw_strength}>
                  <Progress percent={pwStrength.percent} status={pwStrength.status} showInfo={false} size="small" />
                  <span className={styles[`auth__pw_${pwStrength.status}`]}>{pwStrength.label}</span>
                </div>
              )}

              <Button type="primary" block size="large" onClick={nextStep}>
                Continue <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 8 }} />
              </Button>
            </div>

            {/* ── Step 1: Role Selection ── */}
            <div style={{ display: step === 1 ? 'block' : 'none' }}>
              <Form.Item label="I am a...">
                <div className={styles.auth__role_grid}>
                  {ROLE_OPTIONS.map(({ value, label, icon, desc, requiresInvite }) => (
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
                      {requiresInvite && (
                        <span className={styles.auth__role_badge}>Invite only</span>
                      )}
                    </label>
                  ))}
                </div>
              </Form.Item>

              {selectedRole === 'ADMIN' && (
                <Form.Item
                  label="Admin Invite Code"
                  validateStatus={errors.inviteCode ? 'error' : ''}
                  help={errors.inviteCode?.message || 'Required for admin registration'}
                >
                  <Controller
                    name="inviteCode"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Enter your invite code" size="large" />
                    )}
                  />
                </Form.Item>
              )}

              <div className={styles.auth__step_nav}>
                <Button size="large" onClick={prevStep}>
                  <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 8 }} /> Back
                </Button>
                <Button type="primary" size="large" onClick={nextStep}>
                  Continue <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 8 }} />
                </Button>
              </div>
            </div>

            {/* ── Step 2: Confirm ── */}
            <div style={{ display: step === 2 ? 'block' : 'none' }}>
              <div className={styles.auth__confirm_card}>
                <div className={styles.auth__confirm_row}>
                  <span className={styles.auth__confirm_label}>Name</span>
                  <span>{watch('name')}</span>
                </div>
                <div className={styles.auth__confirm_row}>
                  <span className={styles.auth__confirm_label}>Email</span>
                  <span>{watch('email')}</span>
                </div>
                <div className={styles.auth__confirm_row}>
                  <span className={styles.auth__confirm_label}>Role</span>
                  <span className={styles.auth__confirm_role}>
                    {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label}
                  </span>
                </div>
              </div>

              <Form.Item
                validateStatus={errors.agreeTerms ? 'error' : ''}
                help={errors.agreeTerms?.message}
                style={{ marginTop: 16 }}
              >
                <Controller
                  name="agreeTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value === true}
                      onChange={(e) => field.onChange(e.target.checked ? true : undefined)}
                    >
                      I agree to the <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{' '}
                      <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                    </Checkbox>
                  )}
                />
              </Form.Item>

              <div className={styles.auth__step_nav}>
                <Button size="large" onClick={prevStep}>
                  <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 8 }} /> Back
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  size="large"
                  icon={<FontAwesomeIcon icon={faArrowRight} />}
                  iconPosition="end"
                >
                  Create account
                </Button>
              </div>
            </div>
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
