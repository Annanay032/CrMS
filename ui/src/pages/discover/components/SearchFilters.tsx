import { Input, Select, Button, Typography } from 'antd';
import { PLATFORM_OPTIONS } from '../constants';

const { Text } = Typography;

interface SearchFiltersProps {
  niche: string;
  platform: string;
  isLoading: boolean;
  onNicheChange: (val: string) => void;
  onPlatformChange: (val: string) => void;
  onSearch: () => void;
}

export function SearchFilters({ niche, platform, isLoading, onNicheChange, onPlatformChange, onSearch }: SearchFiltersProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Niche</Text>
        <Input placeholder="fitness, lifestyle..." value={niche} onChange={(e) => onNicheChange(e.target.value)} />
      </div>
      <div style={{ width: 160 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Platform</Text>
        <Select value={platform} onChange={onPlatformChange} style={{ width: '100%' }} options={[...PLATFORM_OPTIONS]} />
      </div>
      <Button type="primary" onClick={onSearch} loading={isLoading}>Search</Button>
    </div>
  );
}
