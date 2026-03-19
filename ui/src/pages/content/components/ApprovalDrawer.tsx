import { useState } from 'react';
import { Drawer, Button, Input, Tag, Space, Typography, Timeline, Divider, message, Popconfirm } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPen, faTimes, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import {
  useGetPostCommentsQuery,
  useAddPostCommentMutation,
  useApprovePostMutation,
  useRequestPostChangesMutation,
  useRejectPostMutation,
} from '@/store/endpoints/teams';
import type { ContentPost, PostComment } from '@/types';

const { Text, Title } = Typography;
const { TextArea } = Input;

const APPROVAL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NONE: { label: 'No Review', color: 'default' },
  PENDING_REVIEW: { label: 'Pending Review', color: 'orange' },
  CHANGES_REQUESTED: { label: 'Changes Requested', color: 'red' },
  APPROVED: { label: 'Approved', color: 'green' },
  REJECTED: { label: 'Rejected', color: 'red' },
};

interface Props {
  post: ContentPost | null;
  open: boolean;
  onClose: () => void;
}

export function ApprovalDrawer({ post, open, onClose }: Props) {
  const { data: commentsRes } = useGetPostCommentsQuery(post?.id ?? '', { skip: !post });
  const [addComment] = useAddPostCommentMutation();
  const [approvePost] = useApprovePostMutation();
  const [requestChanges] = useRequestPostChangesMutation();
  const [rejectPost] = useRejectPostMutation();
  const [comment, setComment] = useState('');

  const comments = commentsRes?.data ?? [];

  const handleAction = async (action: 'approve' | 'request_changes' | 'reject') => {
    if (!post) return;
    try {
      if (action === 'approve') {
        await approvePost({ postId: post.id, comment: comment || undefined }).unwrap();
        message.success('Post approved');
      } else if (action === 'request_changes') {
        await requestChanges({ postId: post.id, comment: comment || undefined }).unwrap();
        message.success('Changes requested');
      } else {
        await rejectPost({ postId: post.id, comment: comment || undefined }).unwrap();
        message.success('Post rejected');
      }
      setComment('');
    } catch {
      message.error('Action failed');
    }
  };

  const handleComment = async () => {
    if (!post || !comment.trim()) return;
    try {
      await addComment({ postId: post.id, body: comment }).unwrap();
      setComment('');
      message.success('Comment added');
    } catch {
      message.error('Failed to add comment');
    }
  };

  if (!post) return null;

  const status = APPROVAL_STATUS_CONFIG[post.approvalStatus ?? 'NONE'];

  return (
    <Drawer title="Post Approval" open={open} onClose={onClose} width={480}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Post Preview */}
        <div>
          <Text type="secondary">{post.platform} · {post.postType}</Text>
          <Title level={5} style={{ marginTop: 4 }}>{post.caption?.slice(0, 100) || 'Untitled Post'}</Title>
          <Tag color={status.color}>{status.label}</Tag>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* Comments / Feedback History */}
        <div>
          <Title level={5}>Feedback History</Title>
          {comments.length === 0 ? (
            <Text type="secondary">No comments yet.</Text>
          ) : (
            <Timeline
              items={comments.map((c: PostComment) => ({
                color: c.isApproval
                  ? c.approvalAction === 'approve' ? 'green'
                  : c.approvalAction === 'reject' ? 'red'
                  : 'orange'
                  : 'blue',
                children: (
                  <div>
                    <Text strong>{c.user?.name ?? 'Team Member'}</Text>
                    {c.isApproval && (
                      <Tag color={c.approvalAction === 'approve' ? 'green' : c.approvalAction === 'reject' ? 'red' : 'orange'} style={{ marginLeft: 8, fontSize: 11 }}>
                        {c.approvalAction?.replace('_', ' ')}
                      </Tag>
                    )}
                    <br />
                    <Text>{c.body}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{new Date(c.createdAt).toLocaleString()}</Text>
                  </div>
                ),
              }))}
            />
          )}
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* Comment Input */}
        <div>
          <TextArea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add feedback or a comment..."
            maxLength={2000}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button icon={<FontAwesomeIcon icon={faCommentDots} />} onClick={handleComment} disabled={!comment.trim()}>
              Comment
            </Button>

            {post.approvalStatus === 'PENDING_REVIEW' && (
              <>
                <Button type="primary" icon={<FontAwesomeIcon icon={faCheck} />} style={{ background: '#22c55e' }} onClick={() => handleAction('approve')}>
                  Approve
                </Button>
                <Button icon={<FontAwesomeIcon icon={faPen} />} style={{ color: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => handleAction('request_changes')}>
                  Request Changes
                </Button>
                <Popconfirm title="Reject this post?" onConfirm={() => handleAction('reject')}>
                  <Button danger icon={<FontAwesomeIcon icon={faTimes} />}>
                    Reject
                  </Button>
                </Popconfirm>
              </>
            )}
          </div>
        </div>
      </Space>
    </Drawer>
  );
}
