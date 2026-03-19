import { Modal, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faBriefcase, faUser } from '@fortawesome/free-solid-svg-icons';

const { Text, Title } = Typography;

interface InstagramConnectChoiceProps {
  open: boolean;
  onChoose: (type: 'professional' | 'personal') => void;
  onBack: () => void;
}

export function InstagramConnectChoice({ open, onChoose, onBack }: InstagramConnectChoiceProps) {
  const options = [
    {
      type: 'professional' as const,
      icon: faBriefcase,
      title: 'Professional Account',
      subtitle: 'Business & Creator accounts',
      features: [
        'Auto-publish posts, Reels & Stories',
        'Full analytics & engagement data',
        'Schedule carousel posts',
        'Comment management',
      ],
    },
    {
      type: 'personal' as const,
      icon: faUser,
      title: 'Personal Account',
      subtitle: 'Standard Instagram accounts',
      features: [
        'Mobile push notification reminders',
        'Basic profile stats',
        'Content planning & drafts',
        'Manual posting workflow',
      ],
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <span>
          <FontAwesomeIcon icon={faInstagram} style={{ color: '#E4405F', marginRight: 10 }} />
          Choose Instagram Account Type
        </span>
      }
      footer={null}
      onCancel={onBack}
      width={560}
      destroyOnClose
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        What type of Instagram account would you like to connect?
      </Text>

      <div style={{ display: 'flex', gap: 16 }}>
        {options.map((opt) => (
          <div
            key={opt.type}
            onClick={() => onChoose(opt.type)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onChoose(opt.type); }}
            style={{
              flex: 1,
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#E4405F';
              e.currentTarget.style.background = '#fde8ee';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: opt.type === 'professional' ? '#fde8ee' : '#f0f4ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <FontAwesomeIcon
                icon={opt.icon}
                style={{ color: opt.type === 'professional' ? '#E4405F' : '#6366f1', fontSize: 18 }}
              />
            </div>
            <Title level={5} style={{ margin: '0 0 4px 0' }}>{opt.title}</Title>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
              {opt.subtitle}
            </Text>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {opt.features.map((f) => (
                <li key={f} style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
