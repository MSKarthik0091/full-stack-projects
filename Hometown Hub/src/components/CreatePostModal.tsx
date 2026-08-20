import React, { useState, useRef } from 'react';
import { api } from '../api.ts';
import { X, Pin, Globe, Lock, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react';

interface CreatePostModalProps {
  communityId: string;
  communityName: string;
  isAdmin: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export function CreatePostModal({
  communityId,
  communityName,
  isAdmin,
  onClose,
  onPostCreated
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isPinned, setIsPinned] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'General',
    'Discussion',
    'Local News',
    'Culture',
    'Announcement',
    'Initiative'
  ];

  const handleAddMediaUrl = () => {
    if (mediaUrl.trim()) {
      setMediaList([...mediaList, mediaUrl.trim()]);
      setMediaUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files (JPEG, PNG, WebP) are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    setUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.uploadMedia(base64, file.name);
        setMediaList(prev => [...prev, res.url]);
      } catch (err: any) {
        setError(err.message || 'Failed to upload image.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError('Error reading local file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = (idx: number) => {
    setMediaList(mediaList.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.createPost({
        communityId,
        title: title.trim(),
        content: content.trim(),
        category,
        visibility,
        isPinned: isAdmin ? isPinned : false,
        media: mediaList
      });
      onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F3] text-[#1F2D24] rounded-3xl max-w-xl w-full border border-[#2D6A4F]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-[#183120] text-[#FAF8F3] p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-white">Create Neighborhood Post</h3>
            <p className="text-xs text-[#FAF8F3]/70">Posting to {communityName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2D6A4F]/40 text-[#FAF8F3] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-[#C85A32]/15 text-[#C85A32] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#183120]">Post Title</label>
            <input
              id="post-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neighborhood Clean-up Drive or Local Traffic Update..."
              className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F] text-[#1F2D24]"
            />
          </div>

          {/* Category & Visibility Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#183120]">Category</label>
              <select
                id="post-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs focus:outline-none text-[#1F2D24]"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#183120]">Visibility</label>
              <select
                id="post-visibility-select"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs focus:outline-none text-[#1F2D24]"
              >
                <option value="public">🌐 Public (Visible to all visitors)</option>
                <option value="private">🔒 Members Only (Verified members only)</option>
              </select>
            </div>
          </div>

          {/* Admin Pin Toggle */}
          {isAdmin && (
            <div className="p-3 rounded-xl bg-[#E9A019]/15 border border-[#E9A019]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-[#E9A019] fill-current" />
                <div>
                  <p className="text-xs font-bold text-[#183120]">Pin Post to Top of Feed</p>
                  <p className="text-[10px] text-[#1F2D24]/70">Admin privilege for urgent local announcements</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 text-[#2D6A4F] rounded border-[#2D6A4F] focus:ring-[#2D6A4F]"
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#183120]">Content</label>
            <textarea
              id="post-content-input"
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share details, context, schedule, location, or community feedback..."
              className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#2D6A4F] text-[#1F2D24]"
            />
          </div>

          {/* Media Attachments & Upload */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#183120] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#2D6A4F]" />
                Media & Photos (Section 78.2)
              </span>
              <span className="text-[10px] text-[#1F2D24]/60">JPEG, PNG, WebP</span>
            </label>

            {/* Direct File Upload & URL input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
                id="post-media-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#2D6A4F]/15 border border-[#2D6A4F]/30 text-xs font-bold text-[#183120] hover:bg-[#2D6A4F]/25 transition"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#2D6A4F]" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Upload Image</span>
                  </>
                )}
              </button>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Or paste image URL..."
                  className="flex-1 bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs focus:outline-none text-[#1F2D24]"
                />
                <button
                  type="button"
                  onClick={handleAddMediaUrl}
                  className="px-3.5 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#183120]"
                >
                  Add
                </button>
              </div>
            </div>

            {mediaList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {mediaList.map((url, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[#2D6A4F]/40 shadow-xs">
                    <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#2D6A4F]/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#2D6A4F]/30 text-xs font-semibold text-[#1F2D24] hover:bg-[#EAF4EC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
