import { useState } from 'react';
import { Card, Form, Input, InputNumber, Button, message } from 'antd';
import { useAppSelector } from '@/hooks/store';
import { useSetupBrandProfileMutation } from '@/store/endpoints/auth';

const INDUSTRY_OPTIONS = [
  'Health & Fitness', 'Fashion & Beauty', 'Technology', 'Food & Beverage',
  'Travel & Hospitality', 'Finance', 'Education', 'Entertainment', 'E-commerce', 'Other',
];

export function BrandProfileForm() {
  const user = useAppSelector((s) => s.auth.user);
  const profile = user?.brandProfile;
  const [setupProfile, { isLoading }] = useSetupBrandProfileMutation();

  const [companyName, setCompanyName] = useState(profile?.companyName ?? '');
  const [industry, setIndustry] = useState(profile?.industry ?? '');
  const [website, setWebsite] = useState(profile?.website ?? '');
  const [budgetLow, setBudgetLow] = useState<number | undefined>(profile?.budgetRangeLow ?? undefined);
  const [budgetHigh, setBudgetHigh] = useState<number | undefined>(profile?.budgetRangeHigh ?? undefined);

  const save = async () => {
    if (!companyName.trim()) {
      message.warning('Company name is required');
      return;
    }
    try {
      await setupProfile({
        companyName,
        industry: industry || undefined,
        website: website || undefined,
        budgetRangeLow: budgetLow,
        budgetRangeHigh: budgetHigh,
      }).unwrap();
      message.success('Brand profile saved');
    } catch {
      message.error('Failed to save brand profile');
    }
  };

  return (
    <Card title="Brand Profile" style={{ marginBottom: 24 }}>
      <Form layout="vertical">
        <Form.Item label="Company Name" required>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" />
        </Form.Item>
        <Form.Item label="Industry">
          <Input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Health & Fitness"
            list="industry-options"
          />
          <datalist id="industry-options">
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </Form.Item>
        <Form.Item label="Website">
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" type="url" />
        </Form.Item>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item label="Budget Range (Low)" style={{ flex: 1 }}>
            <InputNumber value={budgetLow} onChange={(v) => setBudgetLow(v ?? undefined)} min={0} style={{ width: '100%' }} prefix="$" />
          </Form.Item>
          <Form.Item label="Budget Range (High)" style={{ flex: 1 }}>
            <InputNumber value={budgetHigh} onChange={(v) => setBudgetHigh(v ?? undefined)} min={0} style={{ width: '100%' }} prefix="$" />
          </Form.Item>
        </div>
        <Button type="primary" onClick={save} loading={isLoading}>Save Brand Profile</Button>
      </Form>
    </Card>
  );
}
