'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Comment } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { getSession } from '@/lib/supabase';

interface CommentSectionProps {
  artworkId: string;
}

export function CommentSection({ artworkId }: CommentSectionProps) {
  const { user, isAuthenticated, isLoading: isUserLoading } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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

    if (!content.trim()) {
      setError('댓글 내용을 입력해 주세요.');
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 세션 토큰 가져오기
      const { session, error: sessionError } = await getSession();

      if (sessionError || !session) {
        setError('세션이 만료되었습니다. 다시 로그인해주세요.');
        return;
      }

      const response = await fetch(`/api/artworks/${artworkId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          authorName: user?.nickname || 'Anonymous',
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
        {isUserLoading ? (
          <div className="flex items-center justify-center py-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isAuthenticated && user ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {user.nickname.charAt(0).toUpperCase()}
              </div>
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
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-neutral-600 mb-2">
              댓글을 작성하려면 로그인이 필요합니다.
            </p>
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/gallery')}`}
              className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              로그인
            </Link>
          </div>
        )}
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
