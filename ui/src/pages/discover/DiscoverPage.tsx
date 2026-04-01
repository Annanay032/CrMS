import { useState, useEffect } from 'react';
import { Card, Empty, Row, Col, Typography, Spin, Tag, InputNumber, Button, Input, Select } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useLazyDiscoverCreatorsQuery } from '@/store/endpoints/matching';
import type { Creator } from './types';
import { SearchFilters } from './components/SearchFilters';
import { CreatorCard } from './components/CreatorCard';
import { SORT_OPTIONS } from './constants';

const { Title, Text } = Typography;

export function DiscoverPage() {
  const [trigger, { data, isLoading }] = useLazyDiscoverCreatorsQuery();
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('');
  const [minFollowers, setMinFollowers] = useState<number | undefined>();
  const [minEngagement, setMinEngagement] = useState<number | undefined>();
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [minReliability, setMinReliability] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState('');

  const creators: Creator[] = (data?.data as unknown as Creator[]) ?? [];
  const total = (data as unknown as { pagination?: { total: number } })?.pagination?.total ?? creators.length;

  const search = () => trigger({
    niche,
    platform,
    minFollowers,
    minEngagement,
  });

  const clearAll = () => {
    setNiche(''); setPlatform(''); setMinFollowers(undefined); setMinEngagement(undefined);
    setLocation(''); setLanguage(''); setMinReliability(undefined); setSortBy('');
    trigger({ niche: '', platform: '' });
  };

  useEffect(() => { trigger({ niche: '', platform: '' }); }, [trigger]);

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
          <div style={{ width: 160 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Location</Text>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Los Angeles"
            />
          </div>
          <div style={{ width: 140 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Language</Text>
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. English"
            />
          </div>
          <div style={{ width: 140 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Min Reliability</Text>
            <InputNumber
              value={minReliability}
              onChange={(v) => setMinReliability(v ?? undefined)}
              placeholder="0-100"
              style={{ width: '100%' }}
              min={0}
              max={100}
            />
          </div>
          <div style={{ width: 160 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Sort By</Text>
            <Select value={sortBy} onChange={setSortBy} style={{ width: '100%' }} options={[...SORT_OPTIONS]} />
          </div>
          <Button onClick={clearAll}>Clear Filters</Button>
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
