import React, { useState } from 'react';
import { X, Image as ImageIcon, CheckCircle, Save } from 'lucide-react';
import { ImageSelector } from './ImageSelector.tsx';
import { api } from '../api.ts';

interface CommunityBrandingModalProps {
  community: any;
  onClose: () => void;
  onSaved: (updatedCommunity: any) => void;
}

export function CommunityBrandingModal({ community, onClose, onSaved }: CommunityBrandingModalProps) {
  const [profileImage, setProfileImage] = useState(community.profileImage || '');
  const [coverImage, setCoverImage] = useState(community.coverImage || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await api.updateCommunityBranding(community._id, {
        profileImage,
        coverImage
      });

      if (res && res.success) {
        setSuccess('Community branding images updated successfully!');
        setTimeout(() => {
          onSaved(res.community);
          onClose();
        }, 800);
      } else {
        setError('Failed to update community branding.');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating community images.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#183120]/10 text-[#183120] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#2D6A4F]/15 pb-4">
          <div className="p-3 bg-[#2D6A4F]/10 rounded-2xl text-[#2D6A4F]">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#183120]">Manage Community Branding Images</h2>
            <p className="text-xs text-[#1F2D24]/70">
              Update {community.name}'s profile picture and header cover banner from device file or web URL
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Profile Photo Selector */}
          <ImageSelector
            value={profileImage}
            onChange={setProfileImage}
            label="Community Profile Logo / Avatar"
            aspectRatio="avatar"
            placeholderFallback="https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80"
            idPrefix="comm-profile-img"
          />

          {/* Cover Banner Selector */}
          <ImageSelector
            value={coverImage}
            onChange={setCoverImage}
            label="Community Header Cover Banner"
            aspectRatio="cover"
            placeholderFallback="https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&auto=format&fit=crop&q=80"
            idPrefix="comm-cover-img"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2D6A4F]/15">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#2D6A4F]/30 text-xs font-bold text-[#1F2D24] hover:bg-[#2D6A4F]/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Branding Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
