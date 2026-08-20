import React, { useState, useEffect, FormEvent } from 'react';
import { api } from '../api.ts';
import { User, Report } from '../types.ts';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  ShieldAlert, 
  Trash2, 
  RotateCcw, 
  Phone, 
  FileText, 
  Check, 
  X, 
  AlertTriangle, 
  LogOut, 
  Shield, 
  Sparkles, 
  UserMinus, 
  Eye,
  Image as ImageIcon,
  Save
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal.tsx';
import { ImageSelector } from './ImageSelector.tsx';

interface CommunityAdminPanelProps {
  communityId: string;
  communityName: string;
  currentUser: User | null;
  currentRole: 'platformAdmin' | 'communityAdmin' | 'moderator' | 'member' | 'guest';
  onCommunityUpdated: () => void;
}

export function CommunityAdminPanel({
  communityId,
  communityName,
  currentUser,
  currentRole,
  onCommunityUpdated
}: CommunityAdminPanelProps) {
  const [subTab, setSubTab] = useState<'pending' | 'role_requests' | 'members' | 'reports' | 'trash' | 'branding'>('pending');
  const [members, setMembers] = useState<any[]>([]);
  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [trashPosts, setTrashPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Branding tab state
  const [brandingProfileImage, setBrandingProfileImage] = useState('');
  const [brandingCoverImage, setBrandingCoverImage] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState('');
  const [brandingError, setBrandingError] = useState('');

  // Verification state for pending modal
  const [selectedVerificationMethod, setSelectedVerificationMethod] = useState<'phone' | 'in_person' | 'email' | 'document_proof'>('phone');
  const [verificationNotes, setVerificationNotes] = useState('');

  const [adminLeaveModalOpen, setAdminLeaveModalOpen] = useState(false);
  const [isAdminLeaving, setIsAdminLeaving] = useState(false);
  const [stepDownData, setStepDownData] = useState<{ targetRole: 'moderator' | 'member'; message: string } | null>(null);
  const [isSteppingDown, setIsSteppingDown] = useState(false);

  const [actionConfirmData, setActionConfirmData] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isActionConfirmLoading, setIsActionConfirmLoading] = useState(false);

  const isCommAdmin = currentRole === 'communityAdmin' || currentUser?.platformRole === 'platformAdmin';
  const isMod = currentRole === 'moderator';

  useEffect(() => {
    loadData();
  }, [communityId, subTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'pending') {
        const res = await api.getCommunityMembers(communityId, 'pending');
        setMembers(res.members);
      } else if (subTab === 'role_requests') {
        const res = await api.getRoleRequests(communityId);
        setRoleRequests(res.roleRequests);
      } else if (subTab === 'members') {
        const res = await api.getCommunityMembers(communityId);
        setMembers(res.members);
      } else if (subTab === 'reports') {
        const res = await api.getReports(communityId);
        setReports(res.reports);
      } else if (subTab === 'trash') {
        const res = await api.getTrashPosts(communityId);
        setTrashPosts(res.trash);
      } else if (subTab === 'branding') {
        const res = await api.getCommunityById(communityId);
        if (res && res.community) {
          setBrandingProfileImage(res.community.profileImage || '');
          setBrandingCoverImage(res.community.coverImage || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, action: 'approve' | 'reject') => {
    try {
      await api.verifyMembership(communityId, userId, {
        action,
        verificationMethod: selectedVerificationMethod,
        notes: verificationNotes || undefined
      });
      setVerificationNotes('');
      loadData();
      onCommunityUpdated();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePromoteCoAdmin = (userId: string) => {
    setActionConfirmData({
      title: 'Issue Co-Admin Offer',
      message: 'Issue a Co-Admin Role Offer to this member? (Section 7.1)\n\nUpon acceptance by the member, they will receive equal administrative authority with independent stewardship.',
      confirmLabel: 'Issue Offer',
      isDestructive: false,
      onConfirm: async () => {
        await api.promoteCoAdmin(communityId, userId);
        loadData();
        onCommunityUpdated();
      }
    });
  };

  const handlePromoteMod = (userId: string) => {
    setActionConfirmData({
      title: 'Issue Moderator Offer',
      message: 'Issue a Moderator Role Offer to this member? (Section 7.1 & 11)\n\nUpon acceptance, they can review event proposals and moderate discussions.',
      confirmLabel: 'Issue Offer',
      isDestructive: false,
      onConfirm: async () => {
        await api.promoteModerator(communityId, userId);
        loadData();
        onCommunityUpdated();
      }
    });
  };

  const handleReviewRoleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await api.reviewRoleRequest(communityId, requestId, action);
      loadData();
      onCommunityUpdated();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRemoveMod = (userId: string) => {
    setActionConfirmData({
      title: 'Remove Moderator',
      message: 'Remove Moderator privileges from this member? They will return to regular member status.',
      confirmLabel: 'Remove Moderator',
      isDestructive: true,
      onConfirm: async () => {
        await api.removeModerator(communityId, userId);
        loadData();
        onCommunityUpdated();
      }
    });
  };

  const handleBan = async (userId: string) => {
    const reason = prompt('Please enter the reason for banning this member (Community Guidelines violation):\n\nNote: Banning will auto-cancel their future hosted events, future RSVPs, and promote waitlisted participants.');
    if (reason) {
      try {
        await api.banMember(communityId, userId, reason);
        loadData();
        onCommunityUpdated();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleUnban = (userId: string) => {
    setActionConfirmData({
      title: 'Unban Member',
      message: 'Unban this user and restore active membership status? (Co-Admins will be notified)',
      confirmLabel: 'Unban Member',
      isDestructive: false,
      onConfirm: async () => {
        await api.unbanMember(communityId, userId);
        loadData();
        onCommunityUpdated();
      }
    });
  };

  const handleResolveReport = async (reportId: string, action: 'delete_content' | 'no_action') => {
    const res = prompt('Enter resolution notes:', action === 'delete_content' ? 'Content violated local guidelines and was removed' : 'Dismissed upon review');
    try {
      await api.resolveReport(reportId, { action, resolution: res || undefined });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRestoreTrashPost = async (postId: string) => {
    try {
      await api.restorePost(postId);
      loadData();
      onCommunityUpdated();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleStepDown = async (targetRole: 'moderator' | 'member' = 'member') => {
    try {
      const res = await api.stepDownRole(communityId, { targetRole });
      if (res.warningRequired && res.isLastAdmin) {
        setStepDownData({ targetRole, message: res.message });
      } else {
        alert(res.message || 'You have successfully stepped down.');
        onCommunityUpdated();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to step down.');
    }
  };

  const executeForceStepDown = async () => {
    if (!stepDownData) return;
    setIsSteppingDown(true);
    try {
      const res = await api.stepDownRole(communityId, { targetRole: stepDownData.targetRole, force: true });
      alert(res.message || 'You have successfully stepped down.');
      setStepDownData(null);
      onCommunityUpdated();
    } catch (e: any) {
      alert(e.message || 'Failed to step down.');
    } finally {
      setIsSteppingDown(false);
    }
  };

  const handleAdminLeaveCommunity = () => {
    setAdminLeaveModalOpen(true);
  };

  const handleSaveBrandingAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBranding(true);
      setBrandingError('');
      setBrandingSuccess('');

      const res = await api.updateCommunityBranding(communityId, {
        profileImage: brandingProfileImage,
        coverImage: brandingCoverImage
      });

      if (res && res.success) {
        setBrandingSuccess('Community branding images updated successfully!');
        onCommunityUpdated();
      } else {
        setBrandingError('Failed to update community branding.');
      }
    } catch (err: any) {
      setBrandingError(err.message || 'Error updating community images.');
    } finally {
      setSavingBranding(false);
    }
  };

  const executeAdminLeaveCommunity = async () => {
    setIsAdminLeaving(true);
    try {
      await api.leaveCommunity(communityId);
      setAdminLeaveModalOpen(false);
      onCommunityUpdated();
      window.location.reload();
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsAdminLeaving(false);
    }
  };

  return (
    <div id="community-admin-panel" className="bg-[#FAF8F3] border border-[#2D6A4F]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2D6A4F]/20">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#2D6A4F]" />
            <h2 className="text-xl font-bold text-[#183120]">Community Leadership Console</h2>
          </div>
          <p className="text-xs text-[#1F2D24]/70">
            Administrative controls, verification workflows, role appointments, and moderation for {communityName}.
          </p>
        </div>

        {(isCommAdmin || isMod) && (
          <div className="flex flex-wrap items-center gap-2 self-start">
            {isCommAdmin && (
              <>
                <button
                  id="stepdown-mod-btn"
                  onClick={() => handleStepDown('moderator')}
                  title="Step down to Moderator role"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF4EC] hover:bg-[#2D6A4F] hover:text-white text-[#2D6A4F] border border-[#2D6A4F]/30 text-xs font-bold transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Step Down to Mod</span>
                </button>
                <button
                  id="resign-admin-btn"
                  onClick={() => handleStepDown('member')}
                  title="Step down to regular member"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C85A32]/10 hover:bg-[#C85A32] hover:text-white text-[#C85A32] border border-[#C85A32]/30 text-xs font-bold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Step Down to Member</span>
                </button>
              </>
            )}
            {isMod && !isCommAdmin && (
              <button
                id="resign-mod-btn"
                onClick={() => handleStepDown('member')}
                title="Step down to regular member"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C85A32]/10 hover:bg-[#C85A32] hover:text-white text-[#C85A32] border border-[#C85A32]/30 text-xs font-bold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Step Down to Member</span>
              </button>
            )}
            <button
              id="admin-leave-community-btn"
              onClick={handleAdminLeaveCommunity}
              title="Leave this community entirely"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C85A32] hover:bg-[#C85A32]/90 text-white text-xs font-bold transition shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Community</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <button
          onClick={() => setSubTab('pending')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            subTab === 'pending'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'bg-[#EAF4EC] text-[#1F2D24]/80 hover:bg-[#EAF4EC]/80'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Membership Verification Queue</span>
        </button>

        <button
          onClick={() => setSubTab('role_requests')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            subTab === 'role_requests'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'bg-[#EAF4EC] text-[#1F2D24]/80 hover:bg-[#EAF4EC]/80'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Moderator Requests Queue</span>
          {roleRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#E9A019] text-[#183120] text-[10px] font-bold">
              {roleRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('members')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            subTab === 'members'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'bg-[#EAF4EC] text-[#1F2D24]/80 hover:bg-[#EAF4EC]/80'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Member & Role Management</span>
        </button>

        <button
          onClick={() => setSubTab('reports')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            subTab === 'reports'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'bg-[#EAF4EC] text-[#1F2D24]/80 hover:bg-[#EAF4EC]/80'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Content Reports Queue</span>
        </button>

        <button
          onClick={() => setSubTab('trash')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            subTab === 'trash'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'bg-[#EAF4EC] text-[#1F2D24]/80 hover:bg-[#EAF4EC]/80'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>30-Day Trash Bin</span>
        </button>

        {isCommAdmin && (
          <button
            onClick={() => setSubTab('branding')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              subTab === 'branding'
                ? 'bg-[#2D6A4F] text-white shadow-sm'
                : 'bg-[#EAF4EC] text-[#1F2D24]/80 hover:bg-[#EAF4EC]/80'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Images & Branding</span>
          </button>
        )}
      </div>

      {/* Subtab 1: Pending Membership Verification Queue */}
      {subTab === 'pending' && (
        <div className="space-y-4">
          <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs space-y-1">
            <p className="font-bold text-[#183120] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#2D6A4F]" />
              <span>Section 6.2 & 43: Community Admin Residency Verification Mandate</span>
            </p>
            <p className="text-[#1F2D24]/80 leading-relaxed">
              To keep Hometown Hub authentic, applicants must be verified by local Community Admins using verified methods (Phone call, In-person meeting, Local reference, or Document proof).
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-[#1F2D24]/60">Loading pending requests...</div>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-[#1F2D24]/60 border border-[#2D6A4F]/15">
              No pending membership verification requests.
            </div>
          ) : (
            <div className="space-y-4">
              {members.map(m => {
                const u = m.user;
                return (
                  <div key={m._id} className="bg-white rounded-2xl p-5 border border-[#2D6A4F]/20 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm">
                          {u?.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#183120]">
                            {u?.firstName} {u?.lastName}
                          </h4>
                          <p className="text-xs text-[#1F2D24]/60">
                            @{u?.username} • Hometown: {u?.hometown || 'Not provided'} • {u?.email}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] text-[#1F2D24]/50">
                        Applied {new Date(m.joinedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {m.verificationNotes && (
                      <div className="p-3 rounded-xl bg-[#FAF8F3] text-xs text-[#1F2D24]/80 border border-[#2D6A4F]/15">
                        <span className="font-semibold text-[#183120]">Applicant Note:</span> {m.verificationNotes}
                      </div>
                    )}

                    {/* Admin Verification Controls */}
                    {isCommAdmin ? (
                      <div className="pt-3 border-t border-[#2D6A4F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#183120]">Verification Method:</span>
                          <select
                            value={selectedVerificationMethod}
                            onChange={(e) => setSelectedVerificationMethod(e.target.value as any)}
                            className="bg-[#EAF4EC] border border-[#2D6A4F]/30 rounded-lg px-2.5 py-1 text-xs text-[#1F2D24]"
                          >
                            <option value="phone">📞 Phone Confirmation</option>
                            <option value="in_person">🤝 In-Person Meeting</option>
                            <option value="email">✉️ Official Email Proof</option>
                            <option value="document_proof">📄 Utility / Address Proof</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerify(m.userId, 'approve')}
                            className="px-4 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 text-[#E9A019]" />
                            <span>Verify & Approve</span>
                          </button>
                          <button
                            onClick={() => handleVerify(m.userId, 'reject')}
                            className="px-3 py-1.5 rounded-xl bg-[#C85A32]/15 hover:bg-[#C85A32] hover:text-white text-[#C85A32] text-xs font-bold transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#1F2D24]/60 italic">
                        Moderators can view applicants. Only Community Admins can grant final verification.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab: Moderator Requests Queue */}
      {subTab === 'role_requests' && (
        <div className="space-y-4">
          <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs space-y-1">
            <p className="font-bold text-[#183120] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#2D6A4F]" />
              <span>Moderator Role Requests Review</span>
            </p>
            <p className="text-[#1F2D24]/80 leading-relaxed">
              Community members can request Moderator status. Community Admins review and accept or reject these moderator requests.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-[#1F2D24]/60">Loading moderator requests...</div>
          ) : roleRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-[#1F2D24]/60 border border-[#2D6A4F]/15">
              No pending moderator requests at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {roleRequests.map(req => {
                const u = req.user;
                return (
                  <div key={req._id} className="bg-white rounded-2xl p-5 border border-[#2D6A4F]/20 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm">
                          {u?.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#183120]">{u?.firstName} {u?.lastName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF4EC] text-[#2D6A4F] font-bold">
                              @{u?.username}
                            </span>
                          </div>
                          <p className="text-xs text-[#1F2D24]/60 mt-0.5">
                            Requested role: <strong className="text-[#2D6A4F]">Community Moderator</strong>
                          </p>
                        </div>
                      </div>

                      {isCommAdmin && (
                        <div className="flex items-center gap-2">
                          {req.isAlreadyGiven || req.status === 'approved' ? (
                            <span className="px-4 py-2 rounded-xl bg-[#EAF4EC] text-[#2D6A4F] text-xs font-bold border border-[#2D6A4F]/20 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[#2D6A4F]" />
                              <span>Role Already Given</span>
                            </span>
                          ) : req.status === 'rejected' ? (
                            <span className="px-3.5 py-2 rounded-xl bg-[#C85A32]/10 text-[#C85A32] text-xs font-bold border border-[#C85A32]/20">
                              Declined
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleReviewRoleRequest(req._id, 'approve')}
                                className="px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5 text-[#E9A019]" />
                                <span>Approve & Grant Mod Role</span>
                              </button>
                              <button
                                onClick={() => handleReviewRoleRequest(req._id, 'reject')}
                                className="px-3.5 py-2 rounded-xl bg-[#C85A32]/15 hover:bg-[#C85A32] hover:text-white text-[#C85A32] text-xs font-bold transition"
                              >
                                Decline Request
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {req.reason && (
                      <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#2D6A4F]/10 text-xs text-[#1F2D24]/80">
                        <strong className="text-[#183120]">Reason given: </strong>"{req.reason}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Member & Role Management */}
      {subTab === 'members' && (
        <div className="space-y-4">
          <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs text-[#1F2D24]/80 space-y-1">
            <p className="font-bold text-[#183120]">Section 7 & 11: Co-Admin & Moderator Rules</p>
            <p>
              • Co-Admins share equal authority and cannot be removed by another Co-Admin.
              <br />• Moderators moderate content and review proposals; they cannot ban users.
              <br />• Banning a member automatically cancels their future hosted events and event RSVPs, freeing capacity.
            </p>
          </div>

          <div className="divide-y divide-[#2D6A4F]/15 bg-white rounded-2xl border border-[#2D6A4F]/20 overflow-hidden">
            {members.map(m => {
              const u = m.user;
              const isTargetAdmin = m.role === 'communityAdmin';
              const isTargetMod = m.role === 'moderator';
              const isBanned = m.membershipStatus === 'banned';

              return (
                <div key={m._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F3] transition text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold">
                      {u?.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#183120]">{u?.firstName} {u?.lastName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isTargetAdmin
                            ? 'bg-[#2D6A4F] text-white'
                            : isTargetMod
                            ? 'bg-[#C85A32] text-white'
                            : isBanned
                            ? 'bg-red-100 text-red-700'
                            : 'bg-[#EAF4EC] text-[#2D6A4F]'
                        }`}>
                          {isBanned ? 'BANNED' : (isTargetAdmin ? 'Admin' : (isTargetMod ? 'Mod' : 'Member'))}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#1F2D24]/60">@{u?.username} • Status: {m.membershipStatus}</p>
                    </div>
                  </div>

                  {/* Actions for Admins */}
                  {isCommAdmin && currentUser?._id !== m.userId && (
                    <div className="flex flex-wrap items-center gap-2">
                      {isBanned ? (
                        <button
                          onClick={() => handleUnban(m.userId)}
                          className="px-3 py-1 rounded-lg bg-[#2D6A4F] text-white font-bold hover:bg-[#183120] transition"
                        >
                          Unban Member
                        </button>
                      ) : (
                        <>
                          {currentUser?.platformRole === 'platformAdmin' && !isTargetAdmin && (
                            m.pendingOfferRole === 'communityAdmin' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-[#EAF4EC] text-[#2D6A4F] text-[10px] font-bold border border-[#2D6A4F]/20">
                                Offer Already Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePromoteCoAdmin(m.userId)}
                                title="Assign Co-Admin Role (Platform Admin Privilege)"
                                className="px-2.5 py-1 rounded-lg bg-[#EAF4EC] hover:bg-[#2D6A4F] hover:text-white text-[#2D6A4F] border border-[#2D6A4F]/30 font-semibold transition"
                              >
                                + Co-Admin
                              </button>
                            )
                          )}

                          {!isTargetAdmin && (
                            isTargetMod ? (
                              <button
                                onClick={() => handleRemoveMod(m.userId)}
                                className="px-2.5 py-1 rounded-lg bg-[#C85A32]/10 hover:bg-[#C85A32] hover:text-white text-[#C85A32] font-semibold transition"
                              >
                                Remove Mod
                              </button>
                            ) : m.pendingOfferRole === 'moderator' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-[#EAF4EC] text-[#2D6A4F] text-[10px] font-bold border border-[#2D6A4F]/20">
                                Offer Already Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePromoteMod(m.userId)}
                                className="px-2.5 py-1 rounded-lg bg-[#EAF4EC] hover:bg-[#C85A32] hover:text-white text-[#183120] border border-[#2D6A4F]/30 font-semibold transition"
                              >
                                + Moderator
                              </button>
                            )
                          )}

                          {!isTargetAdmin && (
                            <button
                              onClick={() => handleBan(m.userId)}
                              className="px-2.5 py-1 rounded-lg bg-[#C85A32]/20 hover:bg-[#C85A32] hover:text-white text-[#C85A32] font-bold transition"
                            >
                              Ban
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 3: Content Reports Queue */}
      {subTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-[#1F2D24]/60 border border-[#2D6A4F]/15">
              No reported content in queue.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r._id} className="bg-white rounded-2xl p-5 border border-[#2D6A4F]/20 shadow-sm space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-[#C85A32]/20 text-[#C85A32] font-bold text-[10px] uppercase">
                        {r.targetType} Report ({r.reason})
                      </span>
                      <p className="font-bold text-sm text-[#183120] mt-1">
                        Reported Snippet: "{r.targetSnippet || r.targetId}"
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'resolved' ? 'bg-[#2D6A4F] text-white' : 'bg-[#E9A019] text-[#183120]'
                    }`}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  {r.description && (
                    <p className="text-[#1F2D24]/80 bg-[#FAF8F3] p-2.5 rounded-xl border border-[#2D6A4F]/10">
                      Reporter comments: {r.description}
                    </p>
                  )}

                  {r.status === 'pending' && (
                    <div className="pt-2 border-t border-[#2D6A4F]/10 flex items-center gap-2">
                      <button
                        onClick={() => handleResolveReport(r._id, 'delete_content')}
                        className="px-3 py-1.5 rounded-xl bg-[#C85A32] hover:bg-[#C85A32]/90 text-white font-bold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Content (Soft)</span>
                      </button>
                      <button
                        onClick={() => handleResolveReport(r._id, 'no_action')}
                        className="px-3 py-1.5 rounded-xl bg-[#EAF4EC] hover:bg-[#2D6A4F] hover:text-white text-[#183120] font-bold transition"
                      >
                        Dismiss Report
                      </button>
                    </div>
                  )}

                  {r.status === 'resolved' && (
                    <p className="text-[11px] text-[#2D6A4F] font-semibold">
                      Resolution: {r.resolution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 4: 30-Day Trash Bin & Authority Matrix */}
      {subTab === 'trash' && (
        <div className="space-y-4">
          <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs text-[#1F2D24]/80 space-y-1">
            <p className="font-bold text-[#183120]">Section 25 & 38: Restoration Authority Matrix</p>
            <p>
              • Author can restore Author-deleted posts within 30 days.
              <br />• Community Admin can restore Moderator-deleted and Admin-deleted posts.
              <br />• Moderators and Authors cannot restore items removed by Community Admins.
            </p>
          </div>

          {trashPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-[#1F2D24]/60 border border-[#2D6A4F]/15">
              Trash bin is empty. No soft-deleted posts for this community.
            </div>
          ) : (
            <div className="space-y-3">
              {trashPosts.map(p => (
                <div key={p._id} className="bg-white rounded-2xl p-5 border border-[#2D6A4F]/20 shadow-sm space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#183120]">{p.title}</h4>
                      <p className="text-[#1F2D24]/60 text-[11px]">
                        Author: {p.author?.firstName} {p.author?.lastName} • Deleted by: {p.deletedByUser?.firstName || 'User'} ({p.deletedByRole}) on {new Date(p.deletedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#C85A32]/20 text-[#C85A32] font-bold text-[10px]">
                      DELETED ({p.deletedByRole})
                    </span>
                  </div>

                  <p className="text-[#1F2D24]/80 line-clamp-2">{p.content}</p>

                  <div className="pt-2 border-t border-[#2D6A4F]/10 flex items-center justify-end">
                    <button
                      onClick={() => handleRestoreTrashPost(p._id)}
                      className="px-4 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#E9A019]" />
                      <span>Restore Post</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 6: Images & Branding Management */}
      {subTab === 'branding' && (
        <div className="space-y-6">
          <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs space-y-1">
            <p className="font-bold text-[#183120] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#2D6A4F]" />
              <span>Community Branding Customization</span>
            </p>
            <p className="text-[#1F2D24]/70">
              Upload local image files from disk or paste direct web URLs to update the profile logo and cover banner for {communityName}.
            </p>
          </div>

          <form onSubmit={handleSaveBrandingAdmin} className="bg-white rounded-2xl p-6 border border-[#2D6A4F]/20 shadow-sm space-y-6">
            {brandingError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {brandingError}
              </div>
            )}

            {brandingSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{brandingSuccess}</span>
              </div>
            )}

            {/* Profile Logo Selector */}
            <ImageSelector
              value={brandingProfileImage}
              onChange={setBrandingProfileImage}
              label="Community Profile Avatar / Logo"
              aspectRatio="avatar"
              placeholderFallback="https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80"
              idPrefix="admin-panel-profile-img"
            />

            {/* Cover Banner Selector */}
            <ImageSelector
              value={brandingCoverImage}
              onChange={setBrandingCoverImage}
              label="Community Header Cover Banner"
              aspectRatio="cover"
              placeholderFallback="https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&auto=format&fit=crop&q=80"
              idPrefix="admin-panel-cover-img"
            />

            <div className="pt-4 border-t border-[#2D6A4F]/15 flex justify-end">
              <button
                type="submit"
                disabled={savingBranding}
                className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingBranding ? 'Saving Branding...' : 'Save Branding Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Leave Community In-App Modal */}
      <ConfirmModal
        isOpen={adminLeaveModalOpen}
        title={`Leave ${communityName}?`}
        message={`⚠️ Leadership Relinquishment Warning:\n\nLeaving ${communityName} will immediately revoke your administrative privileges. If you are the sole administrator, this community will enter Admin-less status under Platform Admin oversight.\n\nAre you sure you want to leave ${communityName}?`}
        confirmLabel="Leave Community"
        cancelLabel="Stay as Admin"
        isDestructive={true}
        isLoading={isAdminLeaving}
        onConfirm={executeAdminLeaveCommunity}
        onCancel={() => setAdminLeaveModalOpen(false)}
      />

      {/* Generic Action Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(actionConfirmData)}
        title={actionConfirmData?.title || 'Confirm Action'}
        message={actionConfirmData?.message || ''}
        confirmLabel={actionConfirmData?.confirmLabel || 'Confirm'}
        cancelLabel="Cancel"
        isDestructive={actionConfirmData?.isDestructive ?? false}
        isLoading={isActionConfirmLoading}
        onConfirm={async () => {
          if (!actionConfirmData) return;
          setIsActionConfirmLoading(true);
          try {
            await actionConfirmData.onConfirm();
            setActionConfirmData(null);
          } catch (e: any) {
            console.error(e);
          } finally {
            setIsActionConfirmLoading(false);
          }
        }}
        onCancel={() => setActionConfirmData(null)}
      />

      {/* Step Down Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(stepDownData)}
        title="Sole Admin Step-Down Warning"
        message={stepDownData?.message || 'Stepping down as the sole admin will leave this community Admin-less under Platform Admin oversight.'}
        confirmLabel="Confirm Step Down"
        cancelLabel="Keep Role"
        isDestructive={true}
        isLoading={isSteppingDown}
        onConfirm={executeForceStepDown}
        onCancel={() => setStepDownData(null)}
      />

    </div>
  );
}
