import { useState, useCallback, useRef, useEffect } from 'react';
import { Input, Dropdown, Typography, List, Tag, Spin, Empty } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useSearchContentQuery } from '@/store/endpoints/content';
import type { ContentPost } from '@/types';

const { Text, Paragraph } = Typography;

interface GlobalSearchProps {
  style?: React.CSSProperties;
}

export function GlobalSearch({ style }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState('');
  const { data, isLoading } = useSearchContentQuery({ q: debouncedQ }, { skip: !debouncedQ.trim() });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const results: ContentPost[] = data?.data ?? [];

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setOpen(false);
        return;
      }
      debounceRef.current = setTimeout(() => {
        setDebouncedQ(value);
        setOpen(true);
      }, 350);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'default',
    SCHEDULED: 'blue',
    PUBLISHED: 'green',
    FAILED: 'red',
    REVIEW: 'orange',
    APPROVED: 'cyan',
  };

  const dropdownContent = (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,.12)',
        maxHeight: 400,
        overflowY: 'auto',
        width: 400,
        padding: 8,
      }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="small" />
        </div>
      ) : results.length === 0 ? (
        <Empty description="No results" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          size="small"
          dataSource={results}
          renderItem={(post) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '6px 8px' }}
              onClick={() => {
                window.location.href = `/content/${post.id}`;
                setOpen(false);
              }}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag color={STATUS_COLORS[post.status] ?? 'default'} style={{ fontSize: 10 }}>
                      {post.status}
                    </Tag>
                    <Tag style={{ fontSize: 10 }}>{post.platform}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {post.postType}
                    </Text>
                  </div>
                }
                description={
                  <Paragraph ellipsis={{ rows: 1 }} style={{ fontSize: 12, margin: 0 }}>
                    {post.caption || '(no caption)'}
                  </Paragraph>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      open={open && !!query.trim()}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      trigger={['click']}
    >
      <Input
        prefix={<FontAwesomeIcon icon={faSearch} style={{ color: '#94a3b8' }} />}
        placeholder="Search posts, hashtags..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        allowClear
        onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
        style={{ width: 300, ...style }}
      />
    </Dropdown>
  );
}
