import React, { useState, useEffect } from 'react';
import { Post, User, Comment } from '../types.ts';
import { api } from '../api.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { 
  Pin, 
  Lock, 
  Globe, 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreVertical, 
  Trash2, 
  Flag, 
  Reply, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Smile, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface PostCardProps {
  key?: React.Key;
  post: Post;
  currentUser: User | null;
  currentRole: 'platformAdmin' | 'communityAdmin' | 'moderator' | 'member' | 'guest';
  onPostUpdated: () => void | Promise<void>;
  onOpenReportModal: (targetType: 'post' | 'comment', targetId: string, snippet: string) => void;
}

export function PostCard({
  post,
  currentUser,
  currentRole,
  onPostUpdated,
  onOpenReportModal
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{ type: 'post' | 'comment'; commentId?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = currentUser && currentUser._id === post.authorId;
  const isCommAdmin = currentRole === 'communityAdmin' || currentUser?.platformRole === 'platformAdmin';
  const isMod = currentRole === 'moderator';
  const canDelete = isAuthor || isMod || isCommAdmin;

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, post._id]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.getComments(post._id);
      setComments(res.comments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleReaction = async (type: string) => {
    try {
      await api.toggleReaction(post._id, type);
      setShowReactionPicker(false);
      onPostUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    try {
      await api.createComment(post._id, { content: newCommentText.trim() });
      setNewCommentText('');
      loadComments();
      onPostUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      await api.createComment(post._id, { content: replyText.trim(), parentCommentId: parentId });
      setReplyText('');
      setReplyToId(null);
      loadComments();
      onPostUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = () => {
    setDeleteConfirmData({ type: 'post' });
  };

  const handleDeleteComment = (commentId: string) => {
    setDeleteConfirmData({ type: 'comment', commentId });
  };

  const executeDelete = async () => {
    if (!deleteConfirmData) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmData.type === 'post') {
        await api.deletePost(post._id);
        onPostUpdated();
      } else if (deleteConfirmData.type === 'comment' && deleteConfirmData.commentId) {
        await api.deleteComment(deleteConfirmData.commentId);
        loadComments();
        onPostUpdated();
      }
      setDeleteConfirmData(null);
    } catch (e: any) {
      console.error(e);
      setDeleteConfirmData(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      await api.updatePost(post._id, { isPinned: !post.isPinned });
      onPostUpdated();
      setShowMenu(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Category Color Map - Morning Dew Canvas Palette
  const categoryStyles: Record<string, string> = {
    'Announcement': 'bg-[#E8A227] text-[#183120] font-bold border-[#E8A227] shadow-xs',
    'Initiative': 'bg-[#2A7B5F] text-white font-bold border-[#2A7B5F] shadow-xs',
    'News': 'bg-[#C85A32] text-white font-bold border-[#C85A32] shadow-xs',
    'Local News': 'bg-[#C85A32] text-white font-bold border-[#C85A32] shadow-xs',
    'Alert': 'bg-[#C85A32] text-white font-bold border-[#C85A32] shadow-xs',
    'Event': 'bg-[#E0856E] text-white font-bold border-[#E0856E] shadow-xs',
    'Question': 'bg-[#E0856E] text-white font-bold border-[#E0856E] shadow-xs',
    'Recommendation': 'bg-[#E0856E] text-white font-bold border-[#E0856E] shadow-xs',
    'Culture': 'bg-[#E0856E] text-white font-bold border-[#E0856E] shadow-xs',
    'Discussion': 'bg-[#EAF2ED] text-[#1D2A24] font-semibold border-[#2A7B5F]/40',
    'General': 'bg-[#EAF2ED] text-[#1D2A24] font-semibold border-[#2A7B5F]/30'
  };

  return (
    <article
      id={`post-${post._id}`}
      className={`bg-[#EAF2ED]/30 rounded-2xl border transition-all shadow-sm hover:shadow-md ${
        post.isPinned
          ? 'border-2 border-[#E8A227] bg-[#FAF8F3]'
          : 'border-[#2A7B5F]/20'
      }`}
    >
      {/* Pinned Announcement Ribbon */}
      {post.isPinned && (
        <div className="bg-[#E8A227] text-[#183120] px-4 py-1.5 rounded-t-xl text-xs font-bold flex items-center justify-between border-b border-[#183120]/20">
          <div className="flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 fill-current text-[#183120]" />
            <span>PINNED OFFICIAL ANNOUNCEMENT</span>
          </div>
          <span className="text-[10px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded bg-[#183120] text-[#E8A227]">Community Notice</span>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-4">
        
        {/* Post Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {post.author?.profilePhoto ? (
              <img
                src={post.author.profilePhoto}
                alt={post.author.firstName}
                className="w-10 h-10 rounded-full object-cover border border-[#2D6A4F]/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm">
                {post.author?.firstName?.[0] || 'U'}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#183120]">
                  {post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Community Member'}
                </span>
                <span className="text-xs text-[#1F2D24]/60">
                  @{post.author?.username || 'resident'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#1F2D24]/60">
                <span>{new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {post.visibility === 'private' ? (
                    <>
                      <Lock className="w-3 h-3 text-[#C85A32]" />
                      <span>Members Only</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3 text-[#2D6A4F]" />
                      <span>Public</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right category tag & Post action menu */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryStyles[post.category] || categoryStyles['General']}`}>
              {post.category}
            </span>

            {/* Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-[#EAF4EC] text-[#1F2D24]/60 hover:text-[#183120] transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#FAF8F3] rounded-xl shadow-xl border border-[#2D6A4F]/30 py-1.5 z-30 text-xs text-[#1F2D24]">
                  {isCommAdmin && (
                    <button
                      onClick={handleTogglePin}
                      className="w-full text-left px-3 py-2 hover:bg-[#EAF4EC] flex items-center gap-2 font-medium"
                    >
                      <Pin className="w-3.5 h-3.5 text-[#E9A019]" />
                      <span>{post.isPinned ? 'Unpin Post' : 'Pin to Top (Admin)'}</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={handleDeletePost}
                      className="w-full text-left px-3 py-2 hover:bg-[#C85A32]/15 text-[#C85A32] flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Post (Soft)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenReportModal('post', post._id, post.title);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#EAF4EC] flex items-center gap-2 text-[#1F2D24]/80"
                  >
                    <Flag className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Report Post</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Title & Content */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-[#183120] leading-snug">
            {post.title}
          </h3>
          <p className="text-sm text-[#1F2D24] leading-relaxed whitespace-pre-line font-normal">
            {post.content}
          </p>
        </div>

        {/* Post Media Images Grid */}
        {post.media && post.media.length > 0 && (
          <div className={`grid gap-2 rounded-xl overflow-hidden ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.media.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt={`Post media ${idx + 1}`}
                className="w-full h-48 sm:h-64 object-cover rounded-lg border border-[#2D6A4F]/20"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        )}

        {/* Actions Bar (Reactions, Comments, Share) */}
        <div className="pt-3 border-t border-[#2D6A4F]/15 flex items-center justify-between text-xs text-[#1F2D24]/80">
          
          {/* Reaction Button & Picker */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                post.userReaction
                  ? 'bg-[#2D6A4F] text-white font-bold'
                  : 'hover:bg-[#EAF4EC] text-[#1F2D24]'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.userReaction ? 'fill-white text-white' : 'text-[#C85A32]'}`} />
              <span>{post.likeCount > 0 ? post.likeCount : 'React'}</span>
              {post.userReaction && <span className="capitalize">({post.userReaction})</span>}
            </button>

            {showReactionPicker && (
              <div className="absolute left-0 bottom-full mb-2 bg-[#FAF8F3] border border-[#2D6A4F]/30 rounded-full shadow-2xl p-1.5 flex items-center gap-1 z-30 animate-in fade-in zoom-in-95">
                {[
                  { type: 'like', emoji: '👍', label: 'Like' },
                  { type: 'helpful', emoji: '💡', label: 'Helpful' },
                  { type: 'heart', emoji: '❤️', label: 'Heart' },
                  { type: 'celebrate', emoji: '🎉', label: 'Celebrate' }
                ].map(r => (
                  <button
                    key={r.type}
                    onClick={() => handleReaction(r.type)}
                    title={r.label}
                    className="p-1.5 hover:scale-125 transition-transform text-base rounded-full hover:bg-[#EAF4EC]"
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Comment Toggle Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#EAF4EC] text-[#1F2D24] transition font-medium"
            >
              <MessageSquare className="w-4 h-4 text-[#2D6A4F]" />
              <span>{post.commentCount} Comments</span>
            </button>

            {/* Share Link Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#EAF4EC] text-[#1F2D24] transition"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-[#2D6A4F]" />
                  <span className="text-[#2D6A4F] font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#1F2D24]/60" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nested Comments Section */}
        {showComments && (
          <div className="pt-4 border-t border-[#2D6A4F]/15 space-y-4 bg-[#EAF4EC]/30 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-5 sm:p-6 rounded-b-2xl">
            
            {/* Add Comment Input */}
            {currentRole !== 'guest' ? (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Add a constructive local comment or reply..."
                  className="flex-1 bg-white rounded-xl px-3.5 py-2 text-xs border border-[#2D6A4F]/30 focus:outline-none focus:border-[#2D6A4F] text-[#1F2D24]"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            ) : (
              <div className="text-center p-3 bg-white/60 rounded-xl text-xs text-[#1F2D24]/70 border border-[#2D6A4F]/20">
                You must be an approved member to participate in discussions.
              </div>
            )}

            {/* Comments List / Tree */}
            {loadingComments ? (
              <div className="text-center py-4 text-xs text-[#1F2D24]/60">Loading replies...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-3 text-xs text-[#1F2D24]/60">
                No comments yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment: any) => (
                  <div key={comment._id} className="space-y-2">
                    {/* Top Level Comment */}
                    <div className="bg-white rounded-xl p-3.5 border border-[#2D6A4F]/15 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#183120]">
                            {comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : 'Resident'}
                          </span>
                          <span className="text-[10px] text-[#1F2D24]/50">
                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {currentRole !== 'guest' && (
                            <button
                              onClick={() => setReplyToId(replyToId === comment._id ? null : comment._id)}
                              className="text-[11px] text-[#2D6A4F] hover:underline flex items-center gap-1"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                          )}

                          {(currentUser?._id === comment.authorId || isCommAdmin || isMod) && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-[#C85A32] hover:opacity-80 p-1"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[#1F2D24] text-xs leading-relaxed">
                        {comment.content}
                      </p>
                    </div>

                    {/* Inline Reply Input */}
                    {replyToId === comment._id && (
                      <div className="pl-6 pt-1 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply to ${comment.author?.firstName || 'comment'}...`}
                          className="flex-1 bg-white rounded-xl px-3 py-1.5 text-xs border border-[#2D6A4F]/30 focus:outline-none text-[#1F2D24]"
                        />
                        <button
                          onClick={() => handleAddReply(comment._id)}
                          className="px-3 py-1.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => setReplyToId(null)}
                          className="px-2 py-1 text-xs text-[#1F2D24]/60"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Nested Replies List */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="pl-6 space-y-2 border-l-2 border-[#2D6A4F]/30 ml-3">
                        {comment.replies.map((reply: any) => (
                          <div key={reply._id} className="bg-white/90 rounded-xl p-3 border border-[#2D6A4F]/15 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#183120]">
                                {reply.author ? `${reply.author.firstName} ${reply.author.lastName}` : 'Resident'}
                              </span>
                              {(currentUser?._id === reply.authorId || isCommAdmin || isMod) && (
                                <button
                                  onClick={() => handleDeleteComment(reply._id)}
                                  className="text-[#C85A32] p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-[#1F2D24]">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deleteConfirmData)}
          title={deleteConfirmData?.type === 'post' ? 'Soft-Delete Post?' : 'Delete Comment?'}
          message={
            deleteConfirmData?.type === 'post'
              ? 'Are you sure you want to soft-delete this post? It can be restored from the community trash within 30 days.'
              : 'Are you sure you want to delete this comment?'
          }
          confirmLabel={deleteConfirmData?.type === 'post' ? 'Delete Post' : 'Delete Comment'}
          cancelLabel="Cancel"
          isDestructive={true}
          isLoading={isDeleting}
          onConfirm={executeDelete}
          onCancel={() => setDeleteConfirmData(null)}
        />

      </div>
    </article>
  );
}
