'use client';

import { useState, useEffect } from 'react';
import { Comment } from '@/types';

interface CommentSectionProps {
  artworkId: string;
}

export function CommentSection({ artworkId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 댓글 목록 불러오기
  useEffect(() => {
    fetchComments();
  }, [artworkId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/artworks/${artworkId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorName.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    if (!content.trim()) {
      setError('댓글 내용을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/artworks/${artworkId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          authorName: authorName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '댓글 작성에 실패했습니다.');
      }

      const newComment = await response.json();
      setComments((prev) => [newComment, ...prev]);
      setTotal((prev) => prev + 1);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="border-t border-neutral-200">
      {/* 댓글 입력 */}
      <div className="p-4 border-b border-neutral-100">
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="이름"
              maxLength={50}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-neutral-50"
            />
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="댓글을 입력하세요..."
                maxLength={500}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-neutral-50"
              />
              {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isSubmitting ? '...' : '작성'}
            </button>
          </div>
        </form>
      </div>

      {/* 댓글 목록 */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-neutral-500 text-sm">
            댓글을 불러오는 중...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 text-sm">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해 보세요!
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-neutral-800">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 댓글 수 */}
      {total > 0 && (
        <div className="px-4 py-2 bg-neutral-50 text-xs text-neutral-500 text-center">
          댓글 {total}개
        </div>
      )}
    </div>
  );
}

export default CommentSection;
