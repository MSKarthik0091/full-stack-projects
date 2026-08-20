import React, { useState } from 'react';
import { api } from '../api.ts';
import { User } from '../types.ts';
import { X, MapPin, Sparkles, Building, FileText, CheckCircle, ShieldCheck } from 'lucide-react';

interface RequestCommunityModalProps {
  currentUser?: User | null;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

export function RequestCommunityModal({
  currentUser,
  onClose,
  onRequestSubmitted
}: RequestCommunityModalProps) {
  const isPlatformAdmin = currentUser?.platformRole === 'platformAdmin';
  const [communityName, setCommunityName] = useState('');
  const [townOrLocality, setTownOrLocality] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [description, setDescription] = useState('');
  const [reasonForCreation, setReasonForCreation] = useState('');
  const [applicantCredentials, setApplicantCredentials] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdDirectly, setCreatedDirectly] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityName.trim() || !townOrLocality.trim() || !district.trim() || !state.trim()) {
      setError('Please fill in community name, locality, district, and state.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.createCommunityRequest({
        proposedCommunityName: communityName.trim(),
        communityName: communityName.trim(),
        location: {
          country: country.trim() || 'India',
          state: state.trim(),
          district: district.trim(),
          townOrLocality: townOrLocality.trim()
        },
        townOrLocality: townOrLocality.trim(),
        district: district.trim(),
        state: state.trim(),
        country: country.trim() || 'India',
        description: description.trim(),
        reasonForCreation: reasonForCreation.trim(),
        applicantCredentials: applicantCredentials.trim()
      });
      setCreatedDirectly(Boolean((res as any)?.autoApproved || isPlatformAdmin));
      setSuccess(true);
      setTimeout(() => {
        onRequestSubmitted();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
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
        
        {/* Header */}
        <div className="bg-[#183120] text-[#FAF8F3] p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isPlatformAdmin ? (
              <ShieldCheck className="w-5 h-5 text-[#E9A019]" />
            ) : (
              <Building className="w-5 h-5 text-[#E9A019]" />
            )}
            <div>
              <h3 className="font-bold text-base text-white">
                {isPlatformAdmin ? 'Create Official Locality Hub (Platform Admin)' : 'Propose a New Hometown Community'}
              </h3>
              <p className="text-xs text-[#FAF8F3]/70">
                {isPlatformAdmin ? 'Direct Creation • Instant Activation' : 'Section 5: Community Proposal & Verification'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2D6A4F]/40 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/20 text-[#2D6A4F] flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-[#2D6A4F]" />
            </div>
            <h3 className="text-xl font-bold text-[#183120]">
              {createdDirectly ? 'Community Initialized & Activated!' : 'Proposal Submitted Successfully!'}
            </h3>
            <p className="text-xs text-[#1F2D24]/80 max-w-md mx-auto leading-relaxed">
              {createdDirectly
                ? `Official locality hub "${communityName}" has been created automatically and is now live.`
                : `Your proposal for ${communityName} has been routed to the Platform Administration queue for review. Upon approval, you will automatically be designated as the founding Community Admin.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            {isPlatformAdmin && (
              <div className="p-3 rounded-xl bg-[#EAF4EC] border border-[#2D6A4F]/30 text-[#183120] font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                <span>As Platform Admin, this locality community will be created and activated immediately without approval queues.</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-[#C85A32]/15 text-[#C85A32] font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-[#183120]">Proposed Community Name *</label>
              <input
                type="text"
                required
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                placeholder="e.g. Besant Nagar Resident Collective"
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-[#1F2D24] text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#183120]">Town / Locality / Village *</label>
                <input
                  type="text"
                  required
                  value={townOrLocality}
                  onChange={(e) => setTownOrLocality(e.target.value)}
                  placeholder="e.g. Besant Nagar"
                  className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-[#1F2D24] text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#183120]">District *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-[#1F2D24] text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#183120]">State / Province *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Tamil Nadu"
                  className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-[#1F2D24] text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#183120]">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India"
                  className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-[#1F2D24] text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#183120]">Community Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the focus of this neighborhood community?"
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl p-2.5 text-[#1F2D24] text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#183120]">Reason / Need for Creation</label>
              <textarea
                rows={2}
                value={reasonForCreation}
                onChange={(e) => setReasonForCreation(e.target.value)}
                placeholder="Why is a dedicated community hub required for this locality?"
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl p-2.5 text-[#1F2D24] text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#183120]">Applicant Credentials / Local Connection</label>
              <input
                type="text"
                value={applicantCredentials}
                onChange={(e) => setApplicantCredentials(e.target.value)}
                placeholder="e.g. Resident Association Secretary, 12 years living in 4th Main Road"
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-[#1F2D24] text-xs focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-[#2D6A4F]/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#2D6A4F]/30 text-xs font-semibold hover:bg-[#EAF4EC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white font-bold transition shadow-sm flex items-center gap-1.5"
              >
                {submitting
                  ? 'Processing...'
                  : isPlatformAdmin
                  ? 'Create & Activate Community Hub'
                  : 'Submit Community Proposal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
