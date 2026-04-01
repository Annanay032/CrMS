import { useState } from 'react';
import { Card, Form, Input, Button, Alert, message, Tag, Avatar } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector, useAppDispatch } from '@/hooks/store';
import { setUser } from '@/store/auth.slice';
import { useUpdateProfileMutation, useSetPasswordMutation } from '@/store/endpoints/auth';
import { getInitials } from '@/utils/format';

const ROLE_COLORS: Record<string, string> = {
  CREATOR: 'blue',
  BRAND: 'green',
  AGENCY: 'purple',
  ADMIN: 'red',
};

const TEAM_ROLE_COLORS: Record<string, string> = {
  OWNER: 'gold',
  ADMIN: 'red',
  EDITOR: 'blue',
  CONTRIBUTOR: 'green',
  VIEWER: 'default',
};

export function ProfileForm() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [setPasswordApi, { isLoading: settingPw }] = useSetPasswordMutation();
  const [name, setName] = useState(user?.name ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const save = async () => {
    try {
      const result = await updateProfile({ name }).unwrap();
      dispatch(setUser(result.data));
      message.success('Profile saved');
    } catch {
      message.error('Failed to save');
    }
  };

  const handleSetPassword = async () => {
    setPwError('');
    setPwSuccess(false);
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    try {
      await setPasswordApi({ password: newPassword }).unwrap();
      setPwSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      message.success('Password set! You can now login with email and password.');
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      setPwError(e?.data?.error || 'Failed to set password');
    }
  };

  const teams = user?.teams ?? [];

  return (
    <>
      {/* ── Account Overview Card ── */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <Avatar size={56} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: 20, fontWeight: 700 }}>
            {getInitials(user?.name ?? '?')}
          </Avatar>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{user?.email}</div>
            <div style={{ marginTop: 4 }}>
              <Tag color={ROLE_COLORS[user?.role ?? 'CREATOR']} style={{ marginRight: 4 }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 4 }} />
                {user?.role}
              </Tag>
              {user?.createdAt && (
                <Tag>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </Tag>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Edit Profile ── */}
      <Card title="Profile" style={{ marginBottom: 24 }}>
        <Form layout="vertical">
          <Form.Item label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Form.Item>
          <Form.Item label="Email">
            <Input value={user?.email ?? ''} disabled />
          </Form.Item>
          <Form.Item label="Role">
            <Input
              value={user?.role ?? ''}
              disabled
              addonAfter={
                <Tag color={ROLE_COLORS[user?.role ?? 'CREATOR']} style={{ margin: 0 }}>
                  {user?.role}
                </Tag>
              }
            />
          </Form.Item>
          <Button type="primary" onClick={save} loading={isLoading}>Save Changes</Button>
        </Form>
      </Card>

      {/* ── Teams ── */}
      {teams.length > 0 && (
        <Card
          title={
            <span>
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: 8 }} />
              My Teams
            </span>
          }
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {teams.map((team) => (
              <div
                key={team.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: '#f8f9fb',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Avatar size={36} style={{ background: '#6366f1', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {getInitials(team.name)}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{team.name}</div>
                  {team.memberCount && (
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{team.memberCount} members</div>
                  )}
                </div>
                <Tag color={TEAM_ROLE_COLORS[team.teamRole] ?? 'default'}>
                  {team.teamRole}
                </Tag>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Set Password ── */}
      {user?.hasPassword === false && (
        <Card title="Set Password" style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 16, color: '#666' }}>
            You signed up with Google. Set a password to also login with your email and password.
          </p>
          {pwError && <Alert type="error" message={pwError} showIcon closable onClose={() => setPwError('')} style={{ marginBottom: 16 }} />}
          {pwSuccess && <Alert type="success" message="Password set successfully!" showIcon style={{ marginBottom: 16 }} />}
          <Form layout="vertical">
            <Form.Item label="New Password">
              <Input.Password value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
            </Form.Item>
            <Form.Item label="Confirm Password">
              <Input.Password value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </Form.Item>
            <Button type="primary" onClick={handleSetPassword} loading={settingPw}>Set Password</Button>
          </Form>
        </Card>
      )}
    </>
  );
}
