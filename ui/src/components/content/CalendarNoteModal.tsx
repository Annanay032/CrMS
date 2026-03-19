import { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Switch, ColorPicker, TimePicker } from 'antd';
import { useCreateCalendarNoteMutation, useUpdateCalendarNoteMutation } from '@/store/endpoints/content';
import type { CalendarNote } from '@/types';
import dayjs from 'dayjs';

interface CalendarNoteModalProps {
  open: boolean;
  onClose: () => void;
  note?: CalendarNote;
  defaultDate?: string; // YYYY-MM-DD
}

export function CalendarNoteModal({ open, onClose, note, defaultDate }: CalendarNoteModalProps) {
  const [form] = Form.useForm();
  const [createNote, { isLoading: creating }] = useCreateCalendarNoteMutation();
  const [updateNote, { isLoading: updating }] = useUpdateCalendarNoteMutation();

  const isEdit = !!note;

  useEffect(() => {
    if (open) {
      if (note) {
        form.setFieldsValue({
          title: note.title,
          description: note.description,
          date: dayjs(note.date),
          color: note.color,
          isAllDay: note.isAllDay,
          startTime: note.startTime ? dayjs(note.startTime, 'HH:mm') : undefined,
          endTime: note.endTime ? dayjs(note.endTime, 'HH:mm') : undefined,
        });
      } else {
        form.resetFields();
        if (defaultDate) {
          form.setFieldValue('date', dayjs(defaultDate));
        }
      }
    }
  }, [open, note, defaultDate, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      title: values.title,
      description: values.description || undefined,
      date: values.date.format('YYYY-MM-DD'),
      color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() ?? '#1677ff',
      isAllDay: values.isAllDay ?? true,
      startTime: values.startTime ? values.startTime.format('HH:mm') : undefined,
      endTime: values.endTime ? values.endTime.format('HH:mm') : undefined,
    };

    if (isEdit && note) {
      await updateNote({ id: note.id, data: payload });
    } else {
      await createNote(payload);
    }
    onClose();
  };

  return (
    <Modal
      title={isEdit ? 'Edit Calendar Note' : 'Add Calendar Note'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={creating || updating}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ isAllDay: true, color: '#1677ff' }}>
        <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
          <Input placeholder="e.g. Product launch, Team sync" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Optional details" />
        </Form.Item>

        <Form.Item name="date" label="Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="color" label="Color">
          <ColorPicker />
        </Form.Item>

        <Form.Item name="isAllDay" label="All day" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.isAllDay !== cur.isAllDay}>
          {({ getFieldValue }) =>
            !getFieldValue('isAllDay') && (
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item name="startTime" label="Start" style={{ flex: 1 }}>
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="endTime" label="End" style={{ flex: 1 }}>
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </div>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  );
}
