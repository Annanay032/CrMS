import { useState } from 'react';
import { Row, Col, Button, Spin, Empty, Form } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn, faPlus } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useGetCampaignsQuery, useGetMyCampaignsQuery, useCreateCampaignMutation } from '@/store/endpoints/campaigns';
import { useAppSelector } from '@/hooks/store';
import { PageHeader } from '@/components/common';
import type { Campaign } from '@/types';
import { CampaignCard } from './components/CampaignCard';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { CampaignDetailDrawer } from './components/CampaignDetailDrawer';

export function CampaignsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const isBrandOrAgency = user?.role === 'BRAND' || user?.role === 'AGENCY';

  const allQuery = useGetCampaignsQuery(undefined, { skip: isBrandOrAgency });
  const myQuery = useGetMyCampaignsQuery(undefined, { skip: !isBrandOrAgency });
  const [createCampaign, { isLoading: creating }] = useCreateCampaignMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [form] = Form.useForm();

  const campaigns: Campaign[] = isBrandOrAgency
    ? (myQuery.data?.data ?? [])
    : (allQuery.data?.data ?? []);
  const loading = isBrandOrAgency ? myQuery.isLoading : allQuery.isLoading;

  const handleCreate = async (values: Record<string, unknown>) => {
    const [start, end] = (values.dateRange as [dayjs.Dayjs, dayjs.Dayjs]) ?? [];
    await createCampaign({
      title: values.title as string,
      description: values.description as string,
      targetPlatforms: values.targetPlatforms as string[],
      budget: values.budget as number,
      startDate: start?.toISOString(),
      endDate: end?.toISOString(),
    });
    form.resetFields();
    setCreateOpen(false);
  };

  return (
    <div>
      <PageHeader
        icon={faBullhorn}
        title={isBrandOrAgency ? 'My Campaigns' : 'All Campaigns'}
        extra={
          isBrandOrAgency && (
            <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setCreateOpen(true)}>
              New Campaign
            </Button>
          )
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : campaigns.length === 0 ? (
        <Empty
          description={isBrandOrAgency ? 'No campaigns yet. Create your first!' : 'No campaigns available.'}
          style={{ padding: 80 }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {campaigns.map((c) => (
            <Col key={c.id} xs={24} sm={12} lg={8} xl={6}>
              <CampaignCard campaign={c} onClick={() => setSelected(c)} />
            </Col>
          ))}
        </Row>
      )}

      <CreateCampaignModal
        open={createOpen}
        form={form}
        loading={creating}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onFinish={handleCreate}
      />

      <CampaignDetailDrawer campaign={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
