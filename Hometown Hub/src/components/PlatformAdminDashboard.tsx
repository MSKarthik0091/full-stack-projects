import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { CommunityCreationRequest, AuditLog, Community, User } from '../types.ts';
import { 
  ShieldAlert, 
  Check, 
  X, 
  MapPin, 
  Users, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  History, 
  ShieldCheck, 
  MailCheck, 
  ArrowRight,
  UserCheck,
  UserPlus,
  Shield,
  Search,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { CommunityBrandingModal } from './CommunityBrandingModal.tsx';

interface PlatformAdminDashboardProps {
  currentUser: User | null;
  onSelectCommunityById: (communityId: string) => void;
  onRefreshAll: () => void;
}

export function PlatformAdminDashboard({
  currentUser,
  onSelectCommunityById,
  onRefreshAll
}: PlatformAdminDashboardProps) {
  const [tab, setTab] = useState<'requests' | 'admin_requests' | 'adminless' | 'audit' | 'all'>('requests');
  const [requests, setRequests] = useState<CommunityCreationRequest[]>([]);
  const [adminRoleRequests, setAdminRoleRequests] = useState<any[]>([]);
  const [adminlessCommunities, setAdminlessCommunities] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedCandidateUser, setSelectedCandidateUser] = useState<Record<string, string>>({});

  // Appoint Admin Modal State
  const [appointModalOpen, setAppointModalOpen] = useState(false);
  const [selectedCommunityForAppoint, setSelectedCommunityForAppoint] = useState<Community | null>(null);
  const [selectedUserIdForAppoint, setSelectedUserIdForAppoint] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [appointing, setAppointing] = useState(false);

  // Branding Modal State
  const [editingBrandingCommunity, setEditingBrandingCommunity] = useState<Community | null>(null);

  useEffect(() => {
    loadPlatformData();
  }, [tab]);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      const res = await api.getAllUsers();
      setAllUsers(Array.isArray(res.users) ? res.users : []);
    } catch (e) {
      console.error('Failed to load users', e);
      setAllUsers([]);
    }
  };

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      if (tab === 'requests') {
        const res = await api.getCommunityRequests();
        setRequests(res.requests);
      } else if (tab === 'admin_requests') {
        const res = await api.getAdminRoleRequests();
        setAdminRoleRequests(res.adminRequests);
      } else if (tab === 'adminless') {
        const res1 = await api.getAdminlessCommunities();
        setAdminlessCommunities(res1.adminless);
        const res2 = await api.getAdminInvitations();
        setInvitations(res2.invitations);
      } else if (tab === 'audit') {
        const res = await api.getAuditLogs();
        setAuditLogs(res.logs);
      } else if (tab === 'all') {
        const res = await api.getCommunities();
        setAllCommunities(res.communities);
      }
    } catch (e) {
      console.error('Error loading platform admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await api.reviewCommunityRequest(requestId, {
        action,
        reviewNotes: reviewNotes || (action === 'approve' ? 'Approved official locality hub' : 'Declined per locality guidelines')
      });
      setReviewNotes('');
      loadPlatformData();
      onRefreshAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReviewAdminRoleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await api.reviewAdminRoleRequest(requestId, action);
      alert(`Community Admin role request ${action === 'approve' ? 'approved and role updated' : 'declined'}.`);
      loadPlatformData();
      onRefreshAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSendAdminInvitation = async (communityId: string) => {
    const candidateId = selectedCandidateUser[communityId];
    if (!candidateId) {
      alert('Please select an active resident candidate to invite.');
      return;
    }
    try {
      await api.inviteCommunityAdmin(communityId, candidateId);
      alert('Invitation dispatched to resident candidate!');
      loadPlatformData();
      onRefreshAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleFinalizeAdmin = async (invitationId: string) => {
    try {
      await api.finalizeAdminInvitation(invitationId);
      alert('Community Admin appointment finalized! Community restored from Admin-less status.');
      loadPlatformData();
      onRefreshAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenAppointModal = (comm?: Community) => {
    setSelectedCommunityForAppoint(comm || (allCommunities[0] || null));
    setSelectedUserIdForAppoint('');
    setUserSearchTerm('');
    setAppointModalOpen(true);
  };

  const handleDirectAppointAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommunityForAppoint || !selectedUserIdForAppoint) {
      alert('Please select both a community and a user to appoint.');
      return;
    }

    setAppointing(true);
    try {
      const res = await api.assignCommunityAdmin(selectedCommunityForAppoint._id, selectedUserIdForAppoint);
      alert(res.message);
      setAppointModalOpen(false);
      loadPlatformData();
      onRefreshAll();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAppointing(false);
    }
  };

  const filteredUsers = (allUsers || []).filter(u => {
    if (!userSearchTerm) return true;
    const q = userSearchTerm.toLowerCase();
    return `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.hometown?.toLowerCase().includes(q);
  });

  return (
    <div id="platform-admin-hub" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-[#183120] text-[#FAF8F3] rounded-3xl p-8 shadow-xl border border-[#2A7B5F]/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#E8A227]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8A227] text-[#183120] text-xs font-extrabold shadow-xs">
            <ShieldAlert className="w-4 h-4 text-[#183120]" />
            <span>Global Platform Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Platform Governance & Locality Stewardship
          </h1>
          <p className="text-xs sm:text-sm text-[#FAF8F3]/90 max-w-2xl leading-relaxed font-medium">
            Platform Admins have global authority to review locality boundary requests, directly appoint Community Admins, oversee Admin-less orphan recovery, and monitor security audit trails.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
          <button
            id="appoint-admin-global-btn"
            onClick={() => handleOpenAppointModal()}
            className="px-4 py-2.5 rounded-xl bg-[#E8A227] hover:bg-[#d4901f] text-[#183120] font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md border border-[#FAF8F3]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Appoint Community Admin</span>
          </button>

          <div className="p-3 bg-[#2A7B5F]/40 rounded-2xl border border-[#2A7B5F] text-xs text-[#FAF8F3] space-y-0.5">
            <p className="font-extrabold text-[#E8A227]">Stewardship Mandate</p>
            <p className="text-[11px] text-[#FAF8F3]/90">• Strict 1 Official Hub per Locality</p>
            <p className="text-[11px] text-[#FAF8F3]/90">• Direct Admin Appointment Authority</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#2D6A4F]/20 gap-2 sm:gap-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setTab('requests')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            tab === 'requests'
              ? 'border-[#2D6A4F] text-[#2D6A4F]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <span>Community Creation Requests</span>
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#E9A019] text-[#183120] text-[10px]">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('admin_requests')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            tab === 'admin_requests'
              ? 'border-[#2D6A4F] text-[#2D6A4F]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <span>Community Admin Role Requests</span>
          {adminRoleRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#E9A019] text-[#183120] text-[10px]">
              {adminRoleRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('all')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            tab === 'all'
              ? 'border-[#2D6A4F] text-[#2D6A4F]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Official Communities ({allCommunities.length})</span>
        </button>

        <button
          onClick={() => setTab('adminless')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            tab === 'adminless'
              ? 'border-[#C85A32] text-[#C85A32]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Admin-less Hubs & Recovery</span>
          {adminlessCommunities.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#C85A32] text-white text-[10px]">
              {adminlessCommunities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('audit')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            tab === 'audit'
              ? 'border-[#2D6A4F] text-[#2D6A4F]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Global Audit Logs</span>
        </button>
      </div>

      {/* Tab 1: Community Creation Requests */}
      {tab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs text-[#1F2D24]/80 space-y-1">
            <p className="font-bold text-[#183120]">Section 5.1, 46 & 55: Locality Boundary & Duplicate Validation</p>
            <p>
              When a resident requests a new community, our system verifies that no community exists for the tuple (Country + State + District + Locality). Look out for similarity warnings. Approving a request initializes the official hub and appoints the applicant as initial Community Admin.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-[#1F2D24]/60">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-2xl p-8 text-center text-xs text-[#1F2D24]/60">
              No community creation requests submitted.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => {
                const isPending = req.status === 'pending';
                const loc = req.location;

                return (
                  <div
                    key={req._id}
                    className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-3xl p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-[#183120]">
                            {req.proposedCommunityName}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.status === 'approved'
                              ? 'bg-[#2D6A4F] text-white'
                              : req.status === 'rejected'
                              ? 'bg-[#C85A32] text-white'
                              : 'bg-[#E9A019] text-[#183120]'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <p className="text-xs text-[#1F2D24]/70 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
                          <span>
                            {loc?.townOrLocality}, {loc?.district || ''}, {loc?.state}, {loc?.country} (Postal: {loc?.postalCode || 'N/A'})
                          </span>
                        </p>
                      </div>

                      <div className="text-[11px] text-[#1F2D24]/50">
                        Requested by: <strong>{req.requester?.firstName} {req.requester?.lastName}</strong> (@{req.requester?.username}) on {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {req.description && (
                      <p className="text-xs text-[#1F2D24]/80 bg-[#EAF4EC]/40 p-3.5 rounded-2xl border border-[#2D6A4F]/10 leading-relaxed">
                        <strong>Purpose & Scope:</strong> {req.description}
                      </p>
                    )}

                    {/* Similarity Warning Box (Section 55) */}
                    {req.similarityWarning && (
                      <div className="p-3.5 rounded-2xl bg-[#E9A019]/20 border border-[#E9A019]/50 text-xs text-[#183120] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Locality Similarity Alert</p>
                          <p className="text-[11px]">{req.similarityWarning}</p>
                        </div>
                      </div>
                    )}

                    {/* Review Controls */}
                    {isPending ? (
                      req.requestedBy === currentUser?._id ? (
                        <div className="pt-3 border-t border-[#2D6A4F]/10 text-xs text-[#2D6A4F] font-semibold flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-[#2D6A4F]" />
                          <span>Self-Created Platform Admin Proposal (Initialized Automatically)</span>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-[#2D6A4F]/10 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <input
                              type="text"
                              placeholder="Optional review notes or boundary verification comments..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              className="flex-1 bg-white border border-[#2D6A4F]/30 rounded-xl px-3.5 py-2 text-xs text-[#1F2D24] focus:outline-none"
                            />

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReviewRequest(req._id, 'approve')}
                                className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                              >
                                <Check className="w-4 h-4 text-[#E9A019]" />
                                <span>Approve & Create Hub</span>
                              </button>

                              <button
                                onClick={() => handleReviewRequest(req._id, 'reject')}
                                className="px-4 py-2 rounded-xl bg-[#C85A32]/20 hover:bg-[#C85A32] hover:text-white text-[#C85A32] text-xs font-bold transition"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="pt-2 text-[11px] text-[#2D6A4F] font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Status Note: {req.reviewNotes || (req.status === 'approved' ? 'Approved and active' : 'Completed')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Community Admin Role Requests */}
      {tab === 'admin_requests' && (
        <div className="space-y-6">
          <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs text-[#1F2D24]/80 space-y-1">
            <p className="font-bold text-[#183120] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#C85A32]" />
              <span>Community Admin Role Requests (Platform Admin Governance)</span>
            </p>
            <p className="text-[#1F2D24]/80 leading-relaxed">
              As per community governance rules, Community Admins cannot appoint other Admins directly. When a member requests Community Admin status, it is routed to Platform Admins for review and approval.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-[#1F2D24]/60">Loading Community Admin requests...</div>
          ) : adminRoleRequests.length === 0 ? (
            <div className="bg-[#FAF8F3] rounded-3xl p-12 text-center text-xs text-[#1F2D24]/60 border border-[#2D6A4F]/20">
              No pending Community Admin role requests at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {adminRoleRequests.map(req => {
                const u = req.user;
                const c = req.community;
                return (
                  <div key={req._id} className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-[#183120]">
                            {u?.firstName} {u?.lastName}
                          </h3>
                          <span className="text-xs text-[#1F2D24]/60">(@{u?.username})</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#C85A32]/10 text-[#C85A32] text-[10px] font-bold">
                            Requested Community Admin
                          </span>
                        </div>
                        <p className="text-xs text-[#2D6A4F] font-semibold flex items-center gap-1">
                          <span>Target Locality Hub:</span>
                          <strong className="text-[#183120]">{c?.name || req.communityId}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.isAlreadyGiven || req.status === 'approved' ? (
                          <span className="px-5 py-2 rounded-xl bg-[#EAF4EC] text-[#2D6A4F] text-xs font-bold border border-[#2D6A4F]/20 flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-[#2D6A4F]" />
                            <span>Role Already Given</span>
                          </span>
                        ) : req.status === 'rejected' ? (
                          <span className="px-4 py-2 rounded-xl bg-[#C85A32]/10 text-[#C85A32] text-xs font-bold border border-[#C85A32]/20">
                            Declined
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleReviewAdminRoleRequest(req._id, 'approve')}
                              className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Check className="w-4 h-4 text-[#E9A019]" />
                              <span>Approve & Grant Admin Role</span>
                            </button>
                            <button
                              onClick={() => handleReviewAdminRoleRequest(req._id, 'reject')}
                              className="px-4 py-2 rounded-xl bg-[#C85A32]/20 hover:bg-[#C85A32] hover:text-white text-[#C85A32] text-xs font-bold transition"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {req.reason && (
                      <div className="p-3.5 rounded-2xl bg-[#EAF4EC]/50 border border-[#2D6A4F]/10 text-xs text-[#1F2D24]/80">
                        <strong className="text-[#183120]">Applicant's Reason: </strong>"{req.reason}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Admin-less Communities & Recovery (Section 9, 10 & 56) */}
      {tab === 'adminless' && (
        <div className="space-y-6">
          <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs text-[#1F2D24]/80 space-y-1">
            <p className="font-bold text-[#183120]">Section 9, 10 & 56: Multi-Step Admin-less Replacement Workflow</p>
            <p>
              When all Community Admins resign, the community becomes Admin-less.
              <br /><strong>Step 1:</strong> Platform Admin selects an active verified member candidate and sends an Admin Invitation.
              <br /><strong>Step 2:</strong> Candidate reviews and accepts the invitation.
              <br /><strong>Step 3:</strong> Candidate acceptance alone does NOT grant admin rights until Platform Admin confirms and finalizes the appointment.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-[#1F2D24]/60">Loading admin-less communities...</div>
          ) : adminlessCommunities.length === 0 ? (
            <div className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-2xl p-8 text-center text-xs text-[#1F2D24]/60">
              No orphan or admin-less communities. All active communities have verified Community Admins!
            </div>
          ) : (
            <div className="space-y-6">
              {adminlessCommunities.map(comm => {
                const inv = comm.pendingInvitation;
                const activeMembers = comm.activeMembers || [];

                return (
                  <div
                    key={comm._id}
                    className="bg-[#FAF8F3] border-2 border-[#C85A32]/40 rounded-3xl p-6 shadow-sm space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-[#183120]">{comm.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#C85A32] text-white text-[10px] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Admin-less (0 Admins)</span>
                          </span>
                        </div>
                        <p className="text-xs text-[#1F2D24]/70">
                          {comm.location?.townOrLocality}, {comm.location?.state}, {comm.location?.country} • {comm.memberCount} Members • {comm.moderatorCount} Moderators
                        </p>
                      </div>

                      <button
                        onClick={() => onSelectCommunityById(comm._id)}
                        className="px-3 py-1.5 rounded-xl bg-[#EAF4EC] hover:bg-[#2D6A4F] hover:text-white text-[#2D6A4F] text-xs font-semibold transition"
                      >
                        Inspect Hub
                      </button>
                    </div>

                    {/* Step Status Tracker */}
                    <div className="p-4 rounded-2xl bg-white border border-[#2D6A4F]/20 space-y-4 text-xs">
                      <h4 className="font-bold text-[#183120] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#E9A019]" />
                        <span>Replacement Admin Appointment Process</span>
                      </h4>

                      {!inv ? (
                        /* Step 1: Select Candidate & Invite */
                        <div className="space-y-3">
                          <p className="text-[#1F2D24]/80">
                            <strong>Step 1:</strong> Select a trusted active resident from the community roster to invite as the replacement Community Admin.
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <select
                              value={selectedCandidateUser[comm._id] || ''}
                              onChange={(e) => setSelectedCandidateUser({ ...selectedCandidateUser, [comm._id]: e.target.value })}
                              className="flex-1 bg-[#EAF4EC] border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs text-[#1F2D24]"
                            >
                              <option value="">-- Choose active resident candidate --</option>
                              {activeMembers.map((m: any) => (
                                <option key={m._id} value={m._id}>
                                  {m.firstName} {m.lastName} (@{m.username})
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => handleSendAdminInvitation(comm._id)}
                              className="px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5 text-[#E9A019]" />
                              <span>Dispatch Admin Invitation</span>
                            </button>
                          </div>
                        </div>
                      ) : inv.status === 'pending' ? (
                        /* Step 2: Waiting for candidate response */
                        <div className="p-3.5 rounded-xl bg-[#E9A019]/20 border border-[#E9A019]/40 space-y-1">
                          <p className="font-bold text-[#183120] flex items-center gap-1.5">
                            <MailCheck className="w-4 h-4 text-[#E9A019]" />
                            <span>Step 2: Invitation Dispatched (Awaiting Candidate Response)</span>
                          </p>
                          <p className="text-[11px] text-[#1F2D24]/80">
                            Candidate user ID ({inv.invitedUserId}) has been invited. You can switch to this persona to accept the invitation in their notification panel.
                          </p>
                        </div>
                      ) : inv.status === 'accepted' ? (
                        /* Step 3: Candidate accepted, final confirmation required */
                        <div className="p-4 rounded-xl bg-[#2D6A4F]/15 border border-[#2D6A4F]/40 space-y-3">
                          <div>
                            <p className="font-bold text-[#183120] flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-[#2D6A4F]" />
                              <span>Step 3: Candidate Accepted! Final Platform Admin Confirmation Required</span>
                            </p>
                            <p className="text-[11px] text-[#1F2D24]/80">
                              Section 10 Mandate: Acceptance alone does not appoint the admin. Platform Admin must finalize the appointment.
                            </p>
                          </div>

                          <button
                            onClick={() => handleFinalizeAdmin(inv._id)}
                            className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white font-bold transition flex items-center gap-1.5 shadow-md"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#E9A019]" />
                            <span>Confirm & Finalize Community Admin Appointment</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-[#1F2D24]/60">
                          Status: {inv.status}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Global Audit Logs */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs text-[#1F2D24]/80 space-y-1">
            <p className="font-bold text-[#183120]">Section 57: Global Security & Authorization Audit Trail</p>
            <p>Immutable log of administrative events: Community creations, Co-Admin promotions, moderator appointments, bans, unbans, resignations, and soft deletions.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#2D6A4F]/20 divide-y divide-[#2D6A4F]/10 overflow-hidden text-xs">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#1F2D24]/60">No audit logs recorded yet.</div>
            ) : (
              auditLogs.map(log => (
                <div key={log._id} className="p-4 hover:bg-[#FAF8F3] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#2D6A4F]/10 text-[#2D6A4F] text-[10px]">
                        {log.action}
                      </span>
                      <span className="font-bold text-[#183120]">
                        Actor: {log.actor ? `${log.actor.firstName} ${log.actor.lastName} (@${log.actor.username})` : log.actorId}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#1F2D24]/70">
                      Target: <span className="font-mono">{log.targetType} ({log.targetId})</span> • Community: <span className="font-mono">{log.communityId || 'Global'}</span>
                    </p>
                    {log.metadata && (
                      <p className="text-[10px] text-[#1F2D24]/50 font-mono">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-[#1F2D24]/50 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: All Communities */}
      {tab === 'all' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-xs">
            <div className="space-y-0.5">
              <h3 className="font-bold text-[#183120]">Official Locality Communities Registry</h3>
              <p className="text-[#1F2D24]/70">
                Manage global community leadership. Platform Admins can directly appoint Community Admins or open any community console.
              </p>
            </div>
            <button
              onClick={() => handleOpenAppointModal()}
              className="px-3.5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#E9A019]" />
              <span>Appoint Community Admin</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allCommunities.map(comm => (
              <div
                key={comm._id}
                className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-3xl p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={comm.profileImage || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80'}
                      alt={comm.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-[#2D6A4F]/20"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#183120]">{comm.name}</h4>
                      <p className="text-[11px] text-[#1F2D24]/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#2D6A4F]" />
                        <span>{comm.location?.townOrLocality || comm.location?.district}, {comm.location?.state}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#1F2D24]/80 line-clamp-2">{comm.description}</p>

                  <div className="bg-white rounded-xl p-3 border border-[#2D6A4F]/10 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[#1F2D24]/70 text-[11px]">
                      <span>Residents: <strong>{comm.memberCount}</strong></span>
                      <span>Admins: <strong className={comm.adminCount === 0 ? 'text-[#C85A32]' : 'text-[#2D6A4F]'}>{comm.adminCount}</strong></span>
                      <span>Mods: <strong>{comm.moderatorCount || 0}</strong></span>
                    </div>

                    <div className="text-[11px] text-[#1F2D24]/70 pt-1 border-t border-[#2D6A4F]/10">
                      <span className="font-semibold text-[#183120]">Current Admins: </span>
                      {comm.admins && comm.admins.length > 0
                        ? comm.admins.map((a: any) => `${a.firstName} ${a.lastName}`).join(', ')
                        : <span className="text-[#C85A32] italic">None (Orphan Community)</span>}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2D6A4F]/10 flex flex-wrap items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBrandingCommunity(comm);
                    }}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-[#EAF4EC] text-[#2D6A4F] border border-[#2D6A4F]/30 font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                    title="Change Profile Photo & Cover Banner"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Images</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAppointModal(comm);
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-[#E9A019]/20 hover:bg-[#E9A019] hover:text-[#183120] text-[#183120] border border-[#E9A019]/50 font-bold text-xs transition flex items-center justify-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Appoint Admin</span>
                  </button>

                  <button
                    onClick={() => onSelectCommunityById(comm._id)}
                    className="py-2 px-3 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white font-bold text-xs transition flex items-center justify-center gap-1"
                  >
                    <span>Open Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appoint Community Admin Modal */}
      {appointModalOpen && (
        <div 
          id="appoint-admin-modal-backdrop" 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setAppointModalOpen(false)}
        >
          <div 
            className="bg-[#FAF8F3] border border-[#2D6A4F]/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in duration-150 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2D6A4F]/20 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#2D6A4F]" />
                <h3 className="font-bold text-base text-[#183120]">Appoint Community Admin</h3>
              </div>
              <button
                onClick={() => setAppointModalOpen(false)}
                className="p-1 rounded-full text-[#1F2D24]/50 hover:text-[#183120] hover:bg-[#2D6A4F]/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectAppointAdmin} className="space-y-4 text-xs">
              {/* Target Community Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#183120]">Target Community:</label>
                <select
                  value={selectedCommunityForAppoint?._id || ''}
                  onChange={(e) => {
                    const c = allCommunities.find(item => item._id === e.target.value);
                    if (c) setSelectedCommunityForAppoint(c);
                  }}
                  className="w-full p-2.5 rounded-xl border border-[#2D6A4F]/30 bg-white text-xs font-semibold text-[#183120] focus:ring-2 focus:ring-[#2D6A4F]"
                  required
                >
                  <option value="">-- Select a Community --</option>
                  {allCommunities.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.location?.townOrLocality || c.location?.state}) - {c.adminCount} current admins
                    </option>
                  ))}
                </select>
              </div>

              {/* User Search & Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#183120]">Select Person to Make Admin:</label>
                
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#1F2D24]/40" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search by name, username, or hometown..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#2D6A4F]/30 bg-white text-xs text-[#1F2D24] focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-[#2D6A4F]/10 border border-[#2D6A4F]/20 rounded-xl bg-white">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-[#1F2D24]/50 text-xs">No users matching search.</div>
                  ) : (
                    filteredUsers.map(u => {
                      const isSelected = selectedUserIdForAppoint === u._id;
                      return (
                        <div
                          key={u._id}
                          onClick={() => setSelectedUserIdForAppoint(u._id)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-[#EAF4EC] text-[#2D6A4F]' : 'hover:bg-[#FAF8F3]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-xs">
                              {u.firstName?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-[#183120]">{u.firstName} {u.lastName}</p>
                              <p className="text-[10px] text-[#1F2D24]/60">@{u.username} • Hometown: {u.hometown || 'Not set'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isSelected && <Check className="w-4 h-4 text-[#2D6A4F]" />}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 font-semibold">
                              {u.platformRole === 'platformAdmin' ? 'Platform Admin' : 'Resident'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-[#EAF4EC]/80 p-3 rounded-xl border border-[#2D6A4F]/20 text-[11px] text-[#1F2D24]/80 space-y-1">
                <p className="font-bold text-[#183120] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>Platform Admin Appointment & Consent Flow</span>
                </p>
                <p>
                  This will dispatch an official Community Admin appointment offer to the selected resident for <strong>{selectedCommunityForAppoint?.name || 'the selected community'}</strong>. Once the resident accepts the role, their leadership privileges will be activated immediately, and you will be notified of their decision.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D6A4F]/15">
                <button
                  type="button"
                  onClick={() => setAppointModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#1F2D24]/70 hover:bg-[#2D6A4F]/10 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appointing || !selectedUserIdForAppoint || !selectedCommunityForAppoint}
                  className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] disabled:opacity-50 text-white font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-[#E9A019]" />
                  <span>{appointing ? 'Dispatching Offer...' : 'Send Admin Appointment Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Community Branding Modal for Platform Admins */}
      {editingBrandingCommunity && (
        <CommunityBrandingModal
          community={editingBrandingCommunity}
          onClose={() => setEditingBrandingCommunity(null)}
          onSaved={() => {
            loadPlatformData();
            onRefreshAll();
          }}
        />
      )}

    </div>
  );
}
