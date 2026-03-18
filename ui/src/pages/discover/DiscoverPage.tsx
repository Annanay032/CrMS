import { useState, useEffect } from 'react';
import { Card, Empty, Row, Col, Typography, Spin, Tag, InputNumber, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useLazyDiscoverCreatorsQuery } from '@/store/endpoints/matching';
import type { Creator } from './types';
import { SearchFilters } from './components/SearchFilters';
import { CreatorCard } from './components/CreatorCard';

const { Title, Text } = Typography;

export function DiscoverPage() {
  const [trigger, { data, isLoading }] = useLazyDiscoverCreatorsQuery();
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('');
  const [minFollowers, setMinFollowers] = useState<number | undefined>();
  const [minEngagement, setMinEngagement] = useState<number | undefined>();

  const creators: Creator[] = (data?.data as unknown as Creator[]) ?? [];
  const total = (data as unknown as { pagination?: { total: number } })?.pagination?.total ?? creators.length;

  const search = () => trigger({
    niche,
    platform,
    minFollowers,
    minEngagement,
  });

  useEffect(() => { trigger({ niche: '', platform: '' }); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ marginRight: 12, color: '#6366f1' }} />
          Discover Creators
        </Title>
        {total > 0 && <Tag color="blue">{total} creators found</Tag>}
      </div>

      <Card style={{ marginBottom: 24 }}>
        <SearchFilters
          niche={niche}
          platform={platform}
          isLoading={isLoading}
          onNicheChange={setNiche}
          onPlatformChange={setPlatform}
          onSearch={search}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, alignItems: 'flex-end' }}>
          <div style={{ width: 160 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Min Followers</Text>
            <InputNumber
              value={minFollowers}
              onChange={(v) => setMinFollowers(v ?? undefined)}
              placeholder="e.g. 10000"
              style={{ width: '100%' }}
              min={0}
            />
          </div>
          <div style={{ width: 160 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Min Engagement %</Text>
            <InputNumber
              value={minEngagement}
              onChange={(v) => setMinEngagement(v ?? undefined)}
              placeholder="e.g. 2.0"
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={0.1}
            />
          </div>
          <Button onClick={() => { setNiche(''); setPlatform(''); setMinFollowers(undefined); setMinEngagement(undefined); trigger({ niche: '', platform: '' }); }}>
            Clear Filters
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : creators.length === 0 ? (
        <Card><Empty description="No creators found. Try adjusting your filters." /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {creators.map((c) => (
            <Col key={c.id} xs={24} md={12} lg={8}>
              <CreatorCard creator={c} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
