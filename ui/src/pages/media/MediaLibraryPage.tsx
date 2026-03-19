import { useState, useRef } from 'react';
import { Card, Button, Input, Tag, Empty, Upload, Modal, Space, Typography, Breadcrumb } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPhotoFilm,
  faFolderPlus,
  faUpload,
  faTrash,
  faFolder,
  faImage,
  faVideo,
  faFile,
} from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '@/components/common';
import {
  useGetMediaFoldersQuery,
  useGetMediaAssetsQuery,
  useCreateMediaFolderMutation,
  useDeleteMediaFolderMutation,
  useUploadMediaAssetMutation,
  useDeleteMediaAssetMutation,
} from '@/store/endpoints/media';
import type { MediaFolder, MediaAsset } from '@/types';

const { Text } = Typography;
const { Search } = Input;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function iconForMime(mime: string) {
  if (mime.startsWith('image/')) return faImage;
  if (mime.startsWith('video/')) return faVideo;
  return faFile;
}

export function MediaLibraryPage() {
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<Array<{ id?: string; name: string }>>([{ name: 'Root' }]);
  const [search, setSearch] = useState('');
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: foldersRes } = useGetMediaFoldersQuery({ parentId: currentFolder });
  const { data: assetsRes } = useGetMediaAssetsQuery({ folderId: currentFolder, search: search || undefined });

  const [createFolder] = useCreateMediaFolderMutation();
  const [deleteFolder] = useDeleteMediaFolderMutation();
  const [uploadAsset] = useUploadMediaAssetMutation();
  const [deleteAsset] = useDeleteMediaAssetMutation();

  const folders: MediaFolder[] = foldersRes?.data ?? [];
  const assets: MediaAsset[] = assetsRes?.data?.items ?? [];

  const navigateToFolder = (folder: MediaFolder) => {
    setCurrentFolder(folder.id);
    setFolderPath((p) => [...p, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (idx: number) => {
    const item = folderPath[idx];
    setCurrentFolder(item.id);
    setFolderPath((p) => p.slice(0, idx + 1));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder({ name: newFolderName.trim(), parentId: currentFolder });
    setNewFolderName('');
    setFolderModalOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      if (currentFolder) fd.append('folderId', currentFolder);
      await uploadAsset(fd);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <PageHeader icon={faPhotoFilm} title="Media Library" />

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Breadcrumb
          items={folderPath.map((f, i) => ({
            title: <a onClick={() => navigateToBreadcrumb(i)}>{f.name}</a>,
          }))}
        />
        <Space>
          <Search placeholder="Search files..." onSearch={setSearch} allowClear style={{ width: 220 }} />
          <Button icon={<FontAwesomeIcon icon={faFolderPlus} />} onClick={() => setFolderModalOpen(true)}>
            New Folder
          </Button>
          <Button type="primary" icon={<FontAwesomeIcon icon={faUpload} />} onClick={() => fileInputRef.current?.click()}>
            Upload
          </Button>
          <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} />
        </Space>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {folders.map((f) => (
            <Card
              key={f.id}
              hoverable
              size="small"
              onClick={() => navigateToFolder(f)}
              style={{ textAlign: 'center' }}
              actions={[
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }}
                  key="del"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>,
              ]}
            >
              <FontAwesomeIcon icon={faFolder} style={{ fontSize: 28, color: '#faad14', marginBottom: 8 }} />
              <div><Text strong ellipsis>{f.name}</Text></div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {f._count?.assets ?? 0} files · {f._count?.children ?? 0} folders
              </Text>
            </Card>
          ))}
        </div>
      )}

      {/* Assets grid */}
      {assets.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {assets.map((a) => (
            <Card
              key={a.id}
              hoverable
              size="small"
              cover={
                a.mimeType.startsWith('image/')
                  ? <img src={a.url} alt={a.filename} style={{ height: 120, objectFit: 'cover' }} />
                  : <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                      <FontAwesomeIcon icon={iconForMime(a.mimeType)} style={{ fontSize: 32, color: '#94a3b8' }} />
                    </div>
              }
              actions={[
                <Button type="text" size="small" danger onClick={() => deleteAsset(a.id)} key="del">
                  <FontAwesomeIcon icon={faTrash} />
                </Button>,
              ]}
            >
              <Text strong ellipsis style={{ fontSize: 12 }}>{a.filename}</Text>
              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                <Tag style={{ fontSize: 10, margin: 0 }}>{formatSize(a.size)}</Tag>
                {a.tags.slice(0, 2).map((t) => <Tag key={t} style={{ fontSize: 10, margin: 0 }}>{t}</Tag>)}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        folders.length === 0 && <Empty description="No files or folders yet. Upload something!" />
      )}

      {/* New Folder Modal */}
      <Modal
        title="Create Folder"
        open={folderModalOpen}
        onOk={handleCreateFolder}
        onCancel={() => setFolderModalOpen(false)}
        okText="Create"
      >
        <Input
          placeholder="Folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onPressEnter={handleCreateFolder}
          autoFocus
        />
      </Modal>
    </div>
  );
}
