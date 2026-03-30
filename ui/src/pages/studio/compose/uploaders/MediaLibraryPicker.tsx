import { useState } from 'react';
import { Modal, Input, Button, Empty, Spin, Checkbox, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPhotoFilm } from '@fortawesome/free-solid-svg-icons';
import { useGetMediaAssetsQuery } from '@/store/endpoints/media';
import type { MediaAsset } from '@/types';
import styles from '../styles/compose.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  accept?: 'image' | 'video' | 'all';
  multiple?: boolean;
}

export function MediaLibraryPicker({ open, onClose, onSelect, accept = 'all', multiple = true }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const { data: res, isLoading } = useGetMediaAssetsQuery(
    { search: search || undefined, page, limit: 30 },
    { skip: !open },
  );

  const assets = (res?.data?.items ?? []).filter((a: MediaAsset) => {
    if (accept === 'image') return a.mimeType.startsWith('image/');
    if (accept === 'video') return a.mimeType.startsWith('video/');
    return true;
  });
  const total = res?.data?.total ?? 0;

  const toggle = (url: string) => {
    if (!multiple) {
      setSelected([url]);
      return;
    }
    setSelected((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  const handleConfirm = () => {
    onSelect(selected);
    setSelected([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={() => { setSelected([]); onClose(); }}
      title={
        <span>
          <FontAwesomeIcon icon={faPhotoFilm} style={{ marginRight: 8 }} />
          Import from Media Library
        </span>
      }
      width={720}
      footer={[
        <Button key="cancel" onClick={() => { setSelected([]); onClose(); }}>Cancel</Button>,
        <Button key="import" type="primary" disabled={selected.length === 0} onClick={handleConfirm}>
          Import {selected.length > 0 ? `(${selected.length})` : ''}
        </Button>,
      ]}
    >
      <Input
        placeholder="Search media..."
        prefix={<FontAwesomeIcon icon={faSearch} style={{ color: '#94a3b8' }} />}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        style={{ marginBottom: 16 }}
        allowClear
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : assets.length === 0 ? (
        <Empty description="No media found" />
      ) : (
        <>
          <div className={styles.library_grid}>
            {assets.map((asset: MediaAsset) => {
              const isSelected = selected.includes(asset.url);
              const isVideo = asset.mimeType.startsWith('video/');
              return (
                <div
                  key={asset.id}
                  className={`${styles.library_item} ${isSelected ? styles['library_item--selected'] : ''}`}
                  onClick={() => toggle(asset.url)}
                >
                  {isVideo ? (
                    <video src={asset.url} className={styles.library_preview} muted />
                  ) : (
                    <img src={asset.thumbnailUrl || asset.url} alt="" className={styles.library_preview} />
                  )}
                  <div className={styles.library_check}>
                    <Checkbox checked={isSelected} />
                  </div>
                  {isVideo && <Tag color="blue" className={styles.library_tag}>Video</Tag>}
                  <div className={styles.library_name}>{asset.filename}</div>
                </div>
              );
            })}
          </div>
          {total > 30 && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span style={{ margin: '0 12px', fontSize: 12, color: '#64748b' }}>Page {page}</span>
              <Button size="small" disabled={assets.length < 30} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
