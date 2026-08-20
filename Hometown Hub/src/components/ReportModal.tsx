import React, { useState } from 'react';
import { api } from '../api.ts';
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReportModalProps {
  targetType: 'post' | 'comment';
  targetId: string;
  snippet: string;
  onClose: () => void;
}

export function ReportModal({
  targetType,
  targetId,
  snippet,
  onClose
}: ReportModalProps) {
  const [reason, setReason] = useState('Inappropriate Content');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const reportReasons = [
    'Inappropriate Content',
    'Harassment or Hate Speech',
    'Spam or Commercial Promotion',
    'False Local Information',
    'Community Guidelines Violation',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.createReport({
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
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
        className="bg-[#FAF8F3] text-[#1F2D24] rounded-3xl max-w-md w-full border border-[#2D6A4F]/30 shadow-2xl overflow-hidden flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-[#183120] text-[#FAF8F3] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#C85A32]" />
            <h3 className="font-bold text-sm text-white">
              Report {targetType === 'post' ? 'Post' : 'Comment'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#2D6A4F]/40 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-[#2D6A4F] mx-auto" />
            <h4 className="font-bold text-base text-[#183120]">Report Logged</h4>
            <p className="text-xs text-[#1F2D24]/70 leading-relaxed">
              Thank you for keeping our community safe. Local Community Admins and Moderators have received your report in the moderation queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-[#C85A32]/15 text-[#C85A32] font-semibold">
                {error}
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#EAF4EC] border border-[#2D6A4F]/20 text-[#1F2D24]/80">
              <span className="font-bold text-[#183120]">Selected Snippet:</span> "{snippet}"
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#183120]">Select Violation Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs text-[#1F2D24] focus:outline-none"
              >
                {reportReasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#183120]">Additional Context (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why this content violates local neighborhood rules..."
                className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl p-3 text-xs text-[#1F2D24] focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-[#2D6A4F]/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#2D6A4F]/30 font-semibold hover:bg-[#EAF4EC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#C85A32] hover:bg-[#C85A32]/90 text-white font-bold transition shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
