import { Modal, Form, Input, Select, Row, Col, InputNumber, DatePicker } from 'antd';
import type { FormInstance } from 'antd';
import { PLATFORM_OPTIONS } from '../constants';

const { RangePicker } = DatePicker;

interface CreateCampaignModalProps {
  open: boolean;
  form: FormInstance;
  loading: boolean;
  onCancel: () => void;
  onFinish: (values: Record<string, unknown>) => void;
}

export function CreateCampaignModal({ open, form, loading, onCancel, onFinish }: CreateCampaignModalProps) {
  return (
    <Modal
      title="Create Campaign"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Create"
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="Campaign title" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} placeholder="Describe your campaign..." />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="budget" label="Budget ($)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="maxCreators" label="Max Creators">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="targetPlatforms" label="Platforms" rules={[{ required: true }]}>
          <Select mode="multiple" placeholder="Select platforms" options={PLATFORM_OPTIONS} />
        </Form.Item>
        <Form.Item name="dateRange" label="Campaign Dates">
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
