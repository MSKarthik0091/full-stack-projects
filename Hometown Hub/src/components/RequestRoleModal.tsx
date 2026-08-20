import React, { useState } from 'react';
import { api } from '../api.ts';
import { Shield, ShieldAlert, Sparkles, X, Check, HelpCircle } from 'lucide-react';

interface RequestRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
  currentRole: string;
  onRequestSubmitted?: () => void;
}

export function RequestRoleModal({
  isOpen,
  onClose,
  communityId,
  communityName,
  currentRole,
  onRequestSubmitted
}: RequestRoleModalProps) {
  const [requestedRole, setRequestedRole] = useState<'moderator' | 'communityAdmin'>('moderator');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    try {
      const res = await api.requestRole(communityId, { requestedRole, reason });
      setSuccessMessage(res.message || 'Request submitted successfully!');
      if (onRequestSubmitted) onRequestSubmitted();
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit role request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF8F3] border border-[#2D6A4F]/20 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#183120] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2D6A4F] text-[#E9A019]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Request Community Leadership Role</h3>
              <p className="text-xs text-white/70">{communityName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {successMessage ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center mx-auto shadow-md">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#183120]">Request Submitted!</h4>
            <p className="text-xs text-[#1F2D24]/80 max-w-sm mx-auto leading-relaxed">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#183120] mb-2 uppercase tracking-wider">
                Select Desired Role
              </label>

              <div className="grid grid-cols-1 gap-3">
                
                {/* Option 1: Moderator */}
                <label 
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                    requestedRole === 'moderator'
                      ? 'border-[#2D6A4F] bg-[#EAF4EC]/60 ring-2 ring-[#2D6A4F]/10'
                      : 'border-[#2D6A4F]/20 hover:border-[#2D6A4F]/40 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="requestedRole"
                    value="moderator"
                    checked={requestedRole === 'moderator'}
                    onChange={() => setRequestedRole('moderator')}
                    className="mt-1 text-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#2D6A4F]" />
                      <span className="font-bold text-sm text-[#183120]">Community Moderator</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF4EC] text-[#2D6A4F] font-semibold">
                        Reviewed by Community Admin
                      </span>
                    </div>
                    <p className="text-xs text-[#1F2D24]/70 leading-relaxed">
                      Assist in reviewing event proposals, maintaining civil local discussions, and highlighting neighborhood announcements.
                    </p>
                  </div>
                </label>

                {/* Option 2: Community Admin */}
                <label 
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                    requestedRole === 'communityAdmin'
                      ? 'border-[#C85A32] bg-[#C85A32]/5 ring-2 ring-[#C85A32]/10'
                      : 'border-[#2D6A4F]/20 hover:border-[#2D6A4F]/40 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="requestedRole"
                    value="communityAdmin"
                    checked={requestedRole === 'communityAdmin'}
                    onChange={() => setRequestedRole('communityAdmin')}
                    className="mt-1 text-[#C85A32] focus:ring-[#C85A32]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#C85A32]" />
                      <span className="font-bold text-sm text-[#183120]">Community Admin</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C85A32]/10 text-[#C85A32] font-semibold">
                        Handled by Platform Admin
                      </span>
                    </div>
                    <p className="text-xs text-[#1F2D24]/70 leading-relaxed">
                      Manage community verification, oversee local moderators, and steward official locality operations.
                    </p>
                  </div>
                </label>

              </div>
            </div>

            {/* Reason Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#183120]">
                Why would you like to request this role? (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Share your local background, community involvement, or reason for stepping up..."
                rows={3}
                className="w-full p-3 rounded-xl border border-[#2D6A4F]/20 bg-white text-xs text-[#183120] focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition"
              />
            </div>

            {/* Note box */}
            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#2D6A4F]/10 flex items-start gap-2 text-[11px] text-[#1F2D24]/70">
              <HelpCircle className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <span>
                {requestedRole === 'moderator'
                  ? 'Your Moderator request will be sent to the Community Admins of this locality for review.'
                  : 'Community Admin requests are routed directly to Platform Admins for verification and governance review.'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#2D6A4F]/20 hover:bg-gray-100 text-xs font-bold text-[#1F2D24]/70 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
