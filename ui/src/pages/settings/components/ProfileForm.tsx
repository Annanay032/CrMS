import { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { useAppSelector, useAppDispatch } from '@/hooks/store';
import { setUser } from '@/store/auth.slice';
import { useUpdateProfileMutation } from '@/store/endpoints/auth';

export function ProfileForm() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [name, setName] = useState(user?.name ?? '');

  const save = async () => {
    try {
      const result = await updateProfile({ name }).unwrap();
      dispatch(setUser(result.data));
      message.success('Profile saved');
    } catch {
      message.error('Failed to save');
    }
  };

  return (
    <Card title="Profile" style={{ marginBottom: 24 }}>
      <Form layout="vertical">
        <Form.Item label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item label="Email">
          <Input value={user?.email ?? ''} disabled />
        </Form.Item>
        <Form.Item label="Role">
          <Input value={user?.role ?? ''} disabled />
        </Form.Item>
        <Button type="primary" onClick={save} loading={isLoading}>Save Changes</Button>
      </Form>
    </Card>
  );
}
