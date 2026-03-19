import { Typography, Space, Avatar, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import type { StartPage } from '@/types';
import { getInitials } from '@/utils/format';

const { Title, Paragraph, Text } = Typography;

const THEME_STYLES: Record<string, React.CSSProperties> = {
  default: { background: '#ffffff', color: '#1a1a1a' },
  minimal: { background: '#fafafa', color: '#333333' },
  bold: { background: '#6366f1', color: '#ffffff' },
  gradient: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#ffffff' },
  dark: { background: '#1a1a2e', color: '#e4e4e7' },
};

const BUTTON_STYLES: Record<string, React.CSSProperties> = {
  default: { background: '#f0f0f0', color: '#1a1a1a', border: '1px solid #d9d9d9' },
  minimal: { background: 'transparent', color: '#333', border: '1px solid #d4d4d4' },
  bold: { background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' },
  gradient: { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' },
  dark: { background: '#16213e', color: '#e4e4e7', border: '1px solid #374151' },
};

interface PagePreviewProps {
  page: StartPage;
}

export function PagePreview({ page }: PagePreviewProps) {
  const theme = page.theme || 'default';
  const containerStyle = THEME_STYLES[theme] ?? THEME_STYLES.default;
  const btnStyle = BUTTON_STYLES[theme] ?? BUTTON_STYLES.default;
  const links = page.links?.filter((l) => l.isActive) ?? [];

  return (
    <div
      style={{
        ...containerStyle,
        borderRadius: 16,
        padding: '32px 24px',
        minHeight: 400,
        textAlign: 'center',
      }}
    >
      <Space direction="vertical" align="center" size="middle" style={{ width: '100%' }}>
        <Avatar
          size={80}
          src={page.avatarUrl || page.user?.avatarUrl}
          style={{ backgroundColor: theme === 'dark' ? '#374151' : '#d9d9d9' }}
        >
          {getInitials(page.title)}
        </Avatar>

        <Title level={4} style={{ color: containerStyle.color, margin: 0 }}>
          {page.title}
        </Title>

        {page.bio && (
          <Paragraph style={{ color: containerStyle.color, opacity: 0.8, maxWidth: 300, margin: '0 auto' }}>
            {page.bio}
          </Paragraph>
        )}

        <Space direction="vertical" style={{ width: '100%', maxWidth: 320, marginTop: 8 }} size="middle">
          {links.map((link) => (
            <Button
              key={link.id}
              block
              size="large"
              style={{
                ...btnStyle,
                borderRadius: 12,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {link.icon && <span>{link.icon}</span>}
              <span>{link.title}</span>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: 11, opacity: 0.6 }} />
            </Button>
          ))}
        </Space>

        {links.length === 0 && (
          <Text style={{ color: containerStyle.color, opacity: 0.5 }}>No links yet</Text>
        )}
      </Space>
    </div>
  );
}
