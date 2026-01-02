import React, { useState } from 'react';
import { designVersionsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { DesignComment } from '../../types';
import './DesignComponents.css';

interface DesignCommentThreadProps {
  versionId: string;
  comments: DesignComment[];
  onCommentAdded: () => void;
}

const DesignCommentThread: React.FC<DesignCommentThreadProps> = ({
  versionId,
  comments,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('FEEDBACK');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const commentTypes = [
    { value: 'FEEDBACK', label: 'Feedback' },
    { value: 'QUESTION', label: 'Question' },
    { value: 'APPROVAL', label: 'Approval' },
    { value: 'REVISION_REQUEST', label: 'Revision Request' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await designVersionsApi.addComment(versionId, newComment.trim(), commentType);
      setNewComment('');
      setCommentType('FEEDBACK');
      onCommentAdded();
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getCommentTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      FEEDBACK: '#0066cc',
      QUESTION: '#ff9800',
      APPROVAL: '#4caf50',
      REVISION_REQUEST: '#f44336',
    };
    return colors[type || 'FEEDBACK'] || '#0066cc';
  };

  return (
    <div className="design-comment-thread">
      {/* Comments List */}
      <div className="design-comment-thread__list">
        {comments.length === 0 ? (
          <div className="design-comment-thread__empty">
            <p>No comments yet. Be the first to add feedback!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="design-comment-thread__comment">
              <div className="design-comment-thread__comment-header">
                <div className="design-comment-thread__comment-author">
                  {comment.user
                    ? `${comment.user.firstName} ${comment.user.lastName}`
                    : 'Unknown User'}
                </div>
                {comment.commentType && (
                  <span
                    className="design-comment-thread__comment-type"
                    style={{ backgroundColor: getCommentTypeColor(comment.commentType) + '20', color: getCommentTypeColor(comment.commentType) }}
                  >
                    {formatLabel(comment.commentType)}
                  </span>
                )}
                <div className="design-comment-thread__comment-date">
                  {new Date(comment.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="design-comment-thread__comment-body">
                {comment.comment}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="design-comment-thread__form">
        {error && <div className="design-comment-thread__error">{error}</div>}
        
        <div className="design-comment-thread__form-row">
          <select
            value={commentType}
            onChange={(e) => setCommentType(e.target.value)}
            className="design-comment-thread__type-select"
          >
            {commentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or feedback..."
          rows={4}
          className="design-comment-thread__textarea"
        />

        <div className="design-comment-thread__form-actions">
          <button
            type="submit"
            className="design-comment-thread__submit-button"
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DesignCommentThread;


