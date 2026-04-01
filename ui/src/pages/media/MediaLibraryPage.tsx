import { useState, useRef, useCallback, useMemo } from 'react';
import { Button, Input, Tag, Modal, Checkbox, message } from 'antd';
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
import {
  DeleteOutlined,
  TagOutlined,
} from '@ant-design/icons';
import {
  useGetMediaFoldersQuery,
  useGetMediaAssetsQuery,
  useCreateMediaFolderMutation,
  useDeleteMediaFolderMutation,
  useUploadMediaAssetMutation,
  useDeleteMediaAssetMutation,
} from '@/store/endpoints/media';
import type { MediaFolder, MediaAsset } from '@/types';
import s from './styles/MediaLibrary.module.scss';

const { Search } = Input;

const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: foldersRes } = useGetMediaFoldersQuery({ parentId: currentFolder });
  const { data: assetsRes } = useGetMediaAssetsQuery({ folderId: currentFolder, search: search || undefined });

  const [createFolder] = useCreateMediaFolderMutation();
  const [deleteFolder] = useDeleteMediaFolderMutation();
  const [uploadAsset] = useUploadMediaAssetMutation();
  const [deleteAsset] = useDeleteMediaAssetMutation();

  const folders: MediaFolder[] = foldersRes?.data ?? [];
  const assets: MediaAsset[] = assetsRes?.data?.items ?? [];

  const totalUsed = useMemo(() => assets.reduce((sum, a) => sum + a.size, 0), [assets]);
  const pct = Math.min((totalUsed / STORAGE_LIMIT) * 100, 100);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => prev.size === assets.length ? new Set() : new Set(assets.map((a) => a.id)));
  }, [assets]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selected) {
      await deleteAsset(id);
    }
    setSelected(new Set());
    message.success(`Deleted ${selected.size} assets`);
  }, [selected, deleteAsset]);

  const navigateToFolder = useCallback((folder: MediaFolder) => {
    setCurrentFolder(folder.id);
    setFolderPath((p) => [...p, { id: folder.id, name: folder.name }]);
    setSelected(new Set());
  }, []);

  const navigateToBreadcrumb = useCallback((idx: number) => {
    const item = folderPath[idx];
    setCurrentFolder(item.id);
    setFolderPath((p) => p.slice(0, idx + 1));
    setSelected(new Set());
  }, [folderPath]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    await createFolder({ name: newFolderName.trim(), parentId: currentFolder });
    setNewFolderName('');
    setFolderModalOpen(false);
  }, [newFolderName, currentFolder, createFolder]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      if (currentFolder) fd.append('folderId', currentFolder);
      await uploadAsset(fd);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    message.success(`Uploaded ${files.length} file(s)`);
  }, [currentFolder, uploadAsset]);

  return (
    <div>
      {/* Header */}
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <FontAwesomeIcon icon={faPhotoFilm} className={s.page_title__icon} />
          Media Library
        </h1>
      </div>

      {/* Storage meter */}
      <div className={s.storage_meter}>
        <span className={s.storage_label}>Storage</span>
        <div className={s.storage_bar}>
          <div
            className={`${s.storage_bar__fill} ${pct > 90 ? s['storage_bar__fill--danger'] : pct > 70 ? s['storage_bar__fill--warn'] : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={s.storage_label}>{formatSize(totalUsed)} / {formatSize(STORAGE_LIMIT)}</span>
      </div>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.breadcrumb}>
          {folderPath.map((f, i) => (
            <span key={i}>
              {i > 0 && <span className={s.breadcrumb__sep}>/</span>}
              <button
                className={`${s.breadcrumb__item} ${i === folderPath.length - 1 ? s['breadcrumb__item--current'] : ''}`}
                onClick={() => navigateToBreadcrumb(i)}
              >
                {f.name}
              </button>
            </span>
          ))}
        </div>
        <div className={s.toolbar__actions}>
          <Search placeholder="Search files…" onSearch={setSearch} allowClear style={{ width: 220 }} />
          <Button icon={<FontAwesomeIcon icon={faFolderPlus} />} onClick={() => setFolderModalOpen(true)}>
            New Folder
          </Button>
          <Button type="primary" icon={<FontAwesomeIcon icon={faUpload} />} onClick={() => fileInputRef.current?.click()}>
            Upload
          </Button>
          <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className={s.bulk_bar}>
          <Checkbox checked={selected.size === assets.length} indeterminate={selected.size > 0 && selected.size < assets.length} onChange={toggleAll} />
          <span className={s.bulk_bar__count}>{selected.size} selected</span>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>Delete</Button>
          <Button size="small" icon={<TagOutlined />} disabled>Tag</Button>
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <>
          <div className={s.section_title}>Folders</div>
          <div className={s.folder_grid}>
            {folders.map((f) => (
              <div key={f.id} className={s.folder_card} onClick={() => navigateToFolder(f)}>
                <Button
                  type="text"
                  size="small"
                  danger
                  className={s.folder_card__delete}
                  onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
                <div className={s.folder_card__icon}>
                  <FontAwesomeIcon icon={faFolder} />
                </div>
                <div className={s.folder_card__name}>{f.name}</div>
                <div className={s.folder_card__meta}>
                  {f._count?.assets ?? 0} files · {f._count?.children ?? 0} folders
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Assets grid */}
      {assets.length > 0 && (
        <>
          <div className={s.section_title}>Files</div>
          <div className={s.asset_grid}>
            {assets.map((a) => (
              <div key={a.id} className={`${s.asset_card} ${selected.has(a.id) ? s['asset_card--selected'] : ''}`}>
                <div className={s.asset_card__checkbox}>
                  <Checkbox checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} />
                </div>
                <Button
                  type="text"
                  size="small"
                  danger
                  className={s.asset_card__delete}
                  onClick={() => deleteAsset(a.id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
                <AssetPreview asset={a} />
                <div className={s.asset_card__info}>
                  <div className={s.asset_card__name}>{a.filename}</div>
                  <div className={s.asset_card__tags}>
                    <Tag style={{ fontSize: 10, margin: 0 }}>{formatSize(a.size)}</Tag>
                    {a.tags.slice(0, 2).map((t) => <Tag key={t} style={{ fontSize: 10, margin: 0 }}>{t}</Tag>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {assets.length === 0 && folders.length === 0 && (
        <div className={s.empty_state}>No files or folders yet. Upload something!</div>
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

/** Inline asset thumbnail with broken-image fallback */
function AssetPreview({ asset }: { asset: MediaAsset }) {
  const [broken, setBroken] = useState(false);

  if (asset.mimeType.startsWith('image/') && !broken) {
    return (
      <img
        src={asset.thumbnailUrl || asset.url}
        alt={asset.filename}
        className={s.asset_card__preview}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div className={s.asset_card__fallback}>
      <FontAwesomeIcon icon={iconForMime(asset.mimeType)} />
    </div>
  );
}
