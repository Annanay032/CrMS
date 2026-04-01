import { Drawer, Button, Form, Input, Slider, Tag, Descriptions, Empty } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faSave } from '@fortawesome/free-solid-svg-icons';
import { useGetVoiceProfileQuery, useUpsertVoiceProfileMutation } from '@/store/endpoints/community';


interface VoiceProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function VoiceProfileDrawer({ open, onClose }: VoiceProfileDrawerProps) {
  const { data, isLoading } = useGetVoiceProfileQuery();
  const [upsertProfile, { isLoading: saving }] = useUpsertVoiceProfileMutation();
  const [form] = Form.useForm();
  const profile = data?.data;

  const handleSave = async () => {
    const values = await form.validateFields();
    await upsertProfile({
      tonePreferences: values.tonePreferences.split(',').map((t: string) => t.trim()).filter(Boolean),
      vocabulary: values.vocabulary.split(',').map((v: string) => v.trim()).filter(Boolean),
      formalityLevel: values.formalityLevel,
      personalityTraits: values.personalityTraits ? values.personalityTraits.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      sampleReplies: values.sampleReplies ? values.sampleReplies.split('\n---\n').map((r: string) => r.trim()).filter(Boolean) : [],
    });
  };

  return (
    <Drawer
      title={<><FontAwesomeIcon icon={faMicrophone} /> Voice Profile</>}
      open={open}
      onClose={onClose}
      width={520}
    >
      {profile && !isLoading ? (
        <div style={{ marginBottom: 24 }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Tone">{(profile.tonePreferences ?? []).map((t) => <Tag key={t}>{t}</Tag>)}</Descriptions.Item>
            <Descriptions.Item label="Formality">{profile.formalityLevel}/10</Descriptions.Item>
            <Descriptions.Item label="Vocabulary">{(profile.vocabulary ?? []).slice(0, 10).map((v) => <Tag key={v}>{v}</Tag>)}</Descriptions.Item>
            {(profile.personalityTraits ?? []).length > 0 && (
              <Descriptions.Item label="Personality">{profile.personalityTraits.map((t) => <Tag key={t}>{t}</Tag>)}</Descriptions.Item>
            )}
          </Descriptions>
        </div>
      ) : !isLoading ? (
        <Empty description="No voice profile yet. Fill out the form below to teach AI your voice." style={{ marginBottom: 24 }} />
      ) : null}

      <Form
        form={form}
        layout="vertical"
        initialValues={profile ? {
          tonePreferences: (profile.tonePreferences ?? []).join(', '),
          vocabulary: (profile.vocabulary ?? []).join(', '),
          formalityLevel: profile.formalityLevel,
          personalityTraits: (profile.personalityTraits ?? []).join(', '),
          sampleReplies: (profile.sampleReplies ?? []).join('\n---\n'),
        } : { formalityLevel: 5 }}
      >
        <Form.Item name="tonePreferences" label="Tone Preferences (comma-separated)" rules={[{ required: true }]}>
          <Input placeholder="friendly, witty, encouraging, casual" />
        </Form.Item>
        <Form.Item name="vocabulary" label="Preferred Words/Phrases (comma-separated)" rules={[{ required: true }]}>
          <Input.TextArea rows={2} placeholder="awesome, love this, keep it up, fire 🔥" />
        </Form.Item>
        <Form.Item name="formalityLevel" label="Formality Level" rules={[{ required: true }]}>
          <Slider min={0} max={10} marks={{ 0: 'Very Casual', 5: 'Balanced', 10: 'Very Formal' }} />
        </Form.Item>
        <Form.Item name="personalityTraits" label="Personality Traits (comma-separated)">
          <Input placeholder="humorous, empathetic, energetic" />
        </Form.Item>
        <Form.Item name="sampleReplies" label="Sample Replies (separate with ---)">
          <Input.TextArea rows={4} placeholder={"Thank you so much! Really appreciate the love 🙏\n---\nHaha yes that's exactly what I was going for! 😂"} />
        </Form.Item>
        <Button type="primary" icon={<FontAwesomeIcon icon={faSave} />} onClick={handleSave} loading={saving}>
          Save Voice Profile
        </Button>
      </Form>
    </Drawer>
  );
}
