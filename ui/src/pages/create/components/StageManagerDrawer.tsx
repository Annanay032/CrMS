import { useState, useCallback } from 'react';
import { Drawer, Button, Input, ColorPicker, Popconfirm, Select, Empty } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faGripVertical, faTrash, faCheck, faPen } from '@fortawesome/free-solid-svg-icons';
import {
  useGetStagesQuery,
  useCreateStageMutation,
  useUpdateStageMutation,
  useReorderStagesMutation,
  useDeleteStageMutation,
} from '@/store/endpoints/ideas';
import type { IdeaStage } from '@/types';
import s from '../styles/Create.module.scss';

interface StageManagerDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function StageManagerDrawer({ open, onClose }: StageManagerDrawerProps) {
  const { data: stagesResp } = useGetStagesQuery(undefined, { skip: !open });
  const [createStage] = useCreateStageMutation();
  const [updateStage] = useUpdateStageMutation();
  const [reorderStages] = useReorderStagesMutation();
  const [deleteStage] = useDeleteStageMutation();

  const stages = stagesResp?.data ?? [];

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | undefined>(undefined);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleAdd = useCallback(async () => {
    if (!newName.trim()) return;
    await createStage({ name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor('#6366f1');
  }, [newName, newColor, createStage]);

  const handleStartEdit = useCallback((stage: IdeaStage) => {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditColor(stage.color);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editName.trim()) return;
    await updateStage({ id: editingId, data: { name: editName.trim(), color: editColor } });
    setEditingId(null);
  }, [editingId, editName, editColor, updateStage]);

  const handleDelete = useCallback(async (stageId: string) => {
    await deleteStage({ id: stageId, moveToStageId: deleteTarget });
    setDeleteTarget(undefined);
  }, [deleteStage, deleteTarget]);

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...stages];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setDragIdx(idx);
    reorderStages({ stageIds: reordered.map((st) => st.id) });
  }, [dragIdx, stages, reorderStages]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
  }, []);

  return (
    <Drawer
      title="Manage Stages"
      open={open}
      onClose={onClose}
      width={420}
      styles={{ body: { padding: 0 } }}
    >
      <div className={s.stage_manager}>
        <div className={s.stage_manager__add}>
          <div
            className={s.stage_manager__color_swatch}
            style={{ background: newColor }}
          >
            <ColorPicker
              value={newColor}
              onChange={(c) => setNewColor(c.toHexString())}
              size="small"
            >
              <button className={s.stage_manager__color_btn} type="button" aria-label="Pick color" />
            </ColorPicker>
          </div>
          <Input
            placeholder="New stage name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onPressEnter={handleAdd}
            className={s.stage_manager__input}
          />
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={handleAdd}
            disabled={!newName.trim()}
          >
            Add
          </Button>
        </div>

        {stages.length === 0 && (
          <Empty description="No stages yet" className={s.stage_manager__empty} />
        )}

        <div className={s.stage_manager__list}>
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              className={`${s.stage_manager__item} ${dragIdx === idx ? s['stage_manager__item--dragging'] : ''}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <FontAwesomeIcon icon={faGripVertical} className={s.stage_manager__grip} />

              {editingId === stage.id ? (
                <>
                  <div
                    className={s.stage_manager__color_swatch}
                    style={{ background: editColor }}
                  >
                    <ColorPicker
                      value={editColor}
                      onChange={(c) => setEditColor(c.toHexString())}
                      size="small"
                    >
                      <button className={s.stage_manager__color_btn} type="button" aria-label="Pick color" />
                    </ColorPicker>
                  </div>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onPressEnter={handleSaveEdit}
                    size="small"
                    className={s.stage_manager__input}
                    autoFocus
                  />
                  <Button type="text" size="small" icon={<FontAwesomeIcon icon={faCheck} />} onClick={handleSaveEdit} />
                </>
              ) : (
                <>
                  <div className={s.stage_manager__color_dot} style={{ background: stage.color }} />
                  <span className={s.stage_manager__name}>{stage.name}</span>
                  <span className={s.stage_manager__count}>{stage._count?.ideas ?? 0}</span>
                  <Button type="text" size="small" icon={<FontAwesomeIcon icon={faPen} />} onClick={() => handleStartEdit(stage)} />
                  <Popconfirm
                    title="Delete this stage?"
                    description={
                      stage._count?.ideas ? (
                        <div>
                          <p style={{ margin: '8px 0' }}>
                            {stage._count.ideas} idea{stage._count.ideas > 1 ? 's' : ''} will be moved to:
                          </p>
                          <Select
                            size="small"
                            placeholder="Select stage…"
                            style={{ width: '100%' }}
                            value={deleteTarget}
                            onChange={setDeleteTarget}
                            options={stages.filter((st) => st.id !== stage.id).map((st) => ({ value: st.id, label: st.name }))}
                          />
                        </div>
                      ) : undefined
                    }
                    onConfirm={() => handleDelete(stage.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
                  </Popconfirm>
                </>
              )}
            </div>
          ))}
        </div>

        <p className={s.stage_manager__hint}>
          Drag to reorder. Ideas on the board will follow this order.
        </p>
      </div>
    </Drawer>
  );
}
