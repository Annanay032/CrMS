import { useState } from 'react';
import { Card, Row, Col, Button, Input, Select, Tag, Progress, Spin, Empty, Tabs, List, Space, Form, Typography } from 'antd';
import { BulbOutlined, FireOutlined, ThunderboltOutlined, CalendarOutlined } from '@ant-design/icons';
import {
  useGetDailyRecommendationQuery,
  useGenerateHooksMutation,
  usePredictViralityMutation,
  useGetWeeklyPlanQuery,
} from '@/store/endpoints/growth';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'];

function DailyRecommendationTab() {
  const { data, isLoading, refetch } = useGetDailyRecommendationQuery();
  const rec = data?.data;

  if (isLoading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  if (!rec) return <Empty description="No recommendation yet"><Button onClick={() => refetch()}>Generate</Button></Empty>;

  return (
    <Card>
      <Title level={4}><BulbOutlined /> {rec.title}</Title>
      <Paragraph>{rec.description}</Paragraph>
      <Row gutter={16}>
        <Col span={8}><Text type="secondary">Platform</Text><br /><Tag color="blue">{rec.targetPlatform}</Tag></Col>
        <Col span={8}><Text type="secondary">Content Type</Text><br /><Tag>{rec.contentType}</Tag></Col>
        <Col span={8}><Text type="secondary">Estimated Reach</Text><br /><Tag color="green">{rec.estimatedReach}</Tag></Col>
      </Row>
      {rec.hooks?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Hook Options:</Text>
          <List
            size="small"
            dataSource={rec.hooks}
            renderItem={(hook: string, i: number) => <List.Item>{i + 1}. {hook}</List.Item>}
          />
        </div>
      )}
      {rec.reasoning && <Paragraph style={{ marginTop: 12 }} type="secondary">{rec.reasoning}</Paragraph>}
      <Button style={{ marginTop: 12 }} onClick={() => refetch()}>Refresh</Button>
    </Card>
  );
}

function HookGeneratorTab() {
  const [generateHooks, { data, isLoading }] = useGenerateHooksMutation();
  const [form] = Form.useForm();

  return (
    <Card>
      <Form form={form} layout="inline" onFinish={(values) => generateHooks(values)} style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Form.Item name="topic" rules={[{ required: true }]}>
          <Input placeholder="Topic (e.g. morning routines)" style={{ width: 250 }} />
        </Form.Item>
        <Form.Item name="platform" rules={[{ required: true }]}>
          <Select placeholder="Platform" style={{ width: 140 }} options={PLATFORMS.map(p => ({ label: p, value: p }))} />
        </Form.Item>
        <Form.Item name="tone">
          <Input placeholder="Tone (optional)" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} icon={<FireOutlined />}>Generate Hooks</Button>
        </Form.Item>
      </Form>

      {data?.data?.hooks && (
        <List
          dataSource={data.data.hooks}
          renderItem={(hook: { text: string; type: string; estimatedStrength: number; bestForFormat: string; reasoning: string }) => (
            <List.Item>
              <List.Item.Meta
                title={<><Tag color="orange">{hook.type}</Tag> {hook.text}</>}
                description={<>Strength: <Progress percent={hook.estimatedStrength} size="small" style={{ width: 120, display: 'inline-flex' }} /> | Best for: {hook.bestForFormat} — {hook.reasoning}</>}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

function ViralityPredictorTab() {
  const [predict, { data, isLoading }] = usePredictViralityMutation();
  const [form] = Form.useForm();

  const prediction = data?.data;

  return (
    <Card>
      <Form form={form} layout="vertical" onFinish={(values) => predict({ ...values, niche: values.niche?.split(',').map((s: string) => s.trim()) ?? [] })}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="title" label="Content Title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
              <Select options={PLATFORMS.map(p => ({ label: p, value: p }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="contentType" label="Content Type" rules={[{ required: true }]}>
              <Select options={['REEL', 'VIDEO', 'CAROUSEL', 'SHORT', 'IMAGE', 'STORY'].map(t => ({ label: t, value: t }))} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Description">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item name="niche" label="Niche (comma-separated)">
          <Input placeholder="fitness, lifestyle" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading} icon={<ThunderboltOutlined />}>Predict Virality</Button>
      </Form>

      {prediction && (
        <div style={{ marginTop: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Card>
                <Title level={3} style={{ textAlign: 'center', margin: 0 }}>{prediction.viralityScore}</Title>
                <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>Virality Score</Text>
                <Progress percent={prediction.viralityScore} showInfo={false} strokeColor={prediction.viralityScore > 70 ? '#52c41a' : prediction.viralityScore > 40 ? '#faad14' : '#ff4d4f'} />
              </Card>
            </Col>
            <Col span={8}>
              <Card><Title level={3} style={{ textAlign: 'center', margin: 0 }}>{prediction.confidence}%</Title><Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>Confidence</Text></Card>
            </Col>
            <Col span={8}>
              <Card><Title level={3} style={{ textAlign: 'center', margin: 0 }}>{prediction.estimatedReach}</Title><Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>Estimated Reach</Text></Card>
            </Col>
          </Row>
          {prediction.suggestions?.length > 0 && (
            <Card title="Suggestions" style={{ marginTop: 16 }}>
              <List size="small" dataSource={prediction.suggestions} renderItem={(s: string) => <List.Item>{s}</List.Item>} />
            </Card>
          )}
        </div>
      )}
    </Card>
  );
}

function WeeklyPlanTab() {
  const { data, isLoading, refetch } = useGetWeeklyPlanQuery();
  const plan = data?.data;

  if (isLoading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  if (!plan) return <Empty description="No weekly plan"><Button onClick={() => refetch()}>Generate Plan</Button></Empty>;

  return (
    <Card>
      <Title level={4}><CalendarOutlined /> {plan.weekGoal}</Title>
      <Row gutter={[16, 16]}>
        {plan.days?.map((day, i) => (
          <Col span={8} key={i}>
            <Card size="small" title={day.dayOfWeek} extra={<Tag>{day.platform}</Tag>}>
              <Text strong>{day.title}</Text>
              <Paragraph type="secondary" ellipsis={{ rows: 2 }}>{day.description}</Paragraph>
              <Space size={4} wrap>
                <Tag color="blue">{day.contentType}</Tag>
                <Tag color="green">{day.purpose}</Tag>
                <Tag>{day.bestTime}</Tag>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
      {plan.tips?.length > 0 && (
        <Card title="Bonus Tips" style={{ marginTop: 16 }}>
          <List size="small" dataSource={plan.tips} renderItem={(t: string, i: number) => <List.Item>{i + 1}. {t}</List.Item>} />
        </Card>
      )}
      <Button style={{ marginTop: 12 }} onClick={() => refetch()}>Regenerate</Button>
    </Card>
  );
}

export default function GrowthCopilotPage() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>AI Growth Copilot</Title>
      <Tabs items={[
        { key: 'daily', label: 'Today\'s Recommendation', children: <DailyRecommendationTab />, icon: <BulbOutlined /> },
        { key: 'hooks', label: 'Hook Generator', children: <HookGeneratorTab />, icon: <FireOutlined /> },
        { key: 'predict', label: 'Virality Predictor', children: <ViralityPredictorTab />, icon: <ThunderboltOutlined /> },
        { key: 'weekly', label: 'Weekly Plan', children: <WeeklyPlanTab />, icon: <CalendarOutlined /> },
      ]} />
    </div>
  );
}
