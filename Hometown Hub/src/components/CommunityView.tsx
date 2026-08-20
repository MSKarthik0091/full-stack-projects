import React, { useState, useEffect } from 'react';
import { Community, User, Post } from '../types.ts';
import { api } from '../api.ts';
import { PostCard } from './PostCard.tsx';
import { CreatePostModal } from './CreatePostModal.tsx';
import { CreateEventModal } from './CreateEventModal.tsx';
import { EventsSection } from './EventsSection.tsx';
import { MemberDirectory } from './MemberDirectory.tsx';
import { CommunityAdminPanel } from './CommunityAdminPanel.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import { RequestRoleModal } from './RequestRoleModal.tsx';
import { CommunityBrandingModal } from './CommunityBrandingModal.tsx';
import { 
  MapPin, 
  Users, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Search, 
  LogOut, 
  Sparkles, 
  UserPlus, 
  MessageSquare, 
  Calendar, 
  FolderLock, 
  ChevronRight,
  Share2,
  X,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

interface CommunityViewProps {
  community: Community;
  currentUser: User | null;
  onBackToDiscovery: () => void;
  onOpenReportModal: (targetType: 'post' | 'comment', targetId: string, snippet: string) => void;
  onRefreshCommunity: () => void;
}

export function CommunityView({
  community,
  currentUser,
  onBackToDiscovery,
  onOpenReportModal,
  onRefreshCommunity
}: CommunityViewProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'events' | 'directory' | 'admin'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [cancelJoinModalOpen, setCancelJoinModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCancellingJoin, setIsCancellingJoin] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('phone');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [joining, setJoining] = useState(false);
  const [showRequestRoleModal, setShowRequestRoleModal] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [stepDownConfirmData, setStepDownConfirmData] = useState<{ force: boolean; title: string; message: string } | null>(null);

  const handleStepDownHeader = (force = false) => {
    const currentRoleName = myMem?.role === 'communityAdmin' ? 'Community Admin' : 'Moderator';
    setStepDownConfirmData({
      force,
      title: force ? 'Confirm Stepping Down' : `Step down as ${currentRoleName}?`,
      message: force 
        ? `Stepping down as the sole admin will leave ${community.name} Admin-less under Platform Admin oversight.`
        : `Are you sure you want to step down from your role as ${currentRoleName} to regular Member status in ${community.name}?`
    });
  };

  const executeStepDownHeader = async () => {
    if (!stepDownConfirmData) return;
    try {
      const res = await api.stepDownRole(community._id, { targetRole: 'member', force: stepDownConfirmData.force });
      if (res.warningRequired && res.isLastAdmin) {
        setStepDownConfirmData({
          force: true,
          title: 'Sole Admin Warning',
          message: `${res.message}\n\nDo you wish to proceed with stepping down?`
        });
      } else {
        setStepDownConfirmData(null);
        onRefreshCommunity();
      }
    } catch (e: any) {
      console.error(e);
      setStepDownConfirmData(null);
    }
  };

  const loc = community.location;
  const myMem = community.myMembership;
  const isMember = myMem?.membershipStatus === 'active';
  const isPending = myMem?.membershipStatus === 'pending';
  const isBanned = myMem?.membershipStatus === 'banned';
  const isAdminless = community.adminCount === 0;
  const isPlatformAdmin = currentUser?.platformRole === 'platformAdmin';

  let currentRole: 'platformAdmin' | 'communityAdmin' | 'moderator' | 'member' | 'guest' = 'guest';
  if (currentUser?.platformRole === 'platformAdmin') {
    currentRole = 'platformAdmin';
  } else if (isMember) {
    currentRole = myMem?.role || 'member';
  }

  const isCommAdmin = currentRole === 'communityAdmin' || currentRole === 'platformAdmin';
  const isMod = currentRole === 'moderator';

  useEffect(() => {
    loadPosts();
  }, [community._id, selectedCategory]);

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await api.getPosts({
        communityId: community._id,
        category: (!selectedCategory || selectedCategory.toLowerCase() === 'all') ? undefined : selectedCategory
      });
      setPosts(res.posts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    try {
      await api.joinCommunity(community._id, {
        verificationMethod,
        verificationNotes
      });
      setJoinModalOpen(false);
      onRefreshCommunity();
    } catch (e: any) {
      console.error(e);
    } finally {
      setJoining(false);
    }
  };

  const handleCancelJoinRequest = () => {
    setCancelJoinModalOpen(true);
  };

  const executeCancelJoin = async () => {
    setIsCancellingJoin(true);
    try {
      await api.cancelJoinRequest(community._id);
      setCancelJoinModalOpen(false);
      onRefreshCommunity();
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsCancellingJoin(false);
    }
  };

  const handleLeaveCommunity = () => {
    setLeaveModalOpen(true);
  };

  const executeLeaveCommunity = async () => {
    setIsLeaving(true);
    try {
      await api.leaveCommunity(community._id);
      setLeaveModalOpen(false);
      onRefreshCommunity();
      onBackToDiscovery();
    } catch (e: any) {
      console.error(e);
      setIsLeaving(false);
    }
  };

  const getLeaveWarningMessage = () => {
    if (myMem?.role === 'communityAdmin') {
      if (community.adminCount <= 1) {
        return `⚠️ Sole Admin Warning: You are the ONLY Community Admin for ${community.name}.\n\nIf you leave, this locality hub will become Admin-less under Platform Admin oversight until a replacement Admin is appointed.\n\nAre you sure you want to leave ${community.name}?`;
      } else {
        return `You are a Community Admin for ${community.name}. Leaving will relinquish your administrative privileges, while other Co-Admins remain in charge.\n\nAre you sure you want to leave ${community.name}?`;
      }
    } else if (myMem?.role === 'moderator') {
      return `You are a Moderator for ${community.name}. Leaving will relinquish your moderation privileges.\n\nAre you sure you want to leave ${community.name}?`;
    }
    return `Are you sure you want to leave ${community.name}? You will no longer be able to create posts, RSVP to events, or access the private resident directory.`;
  };

  const categories = ['All', 'Announcement', 'Local News', 'Initiative', 'Culture', 'Discussion', 'General'];

  const filteredPosts = posts.filter(p => {
    // If a specific category tab is selected (other than 'All'), filter by category
    if (selectedCategory && selectedCategory.toLowerCase() !== 'all') {
      if (!p.category || p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) || 
      p.content.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  return (
    <div id={`community-view-${community.slug}`} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-[#1F2D24]/70">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button 
            onClick={onBackToDiscovery}
            className="hover:text-[#2D6A4F] font-semibold transition"
          >
            Localities
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{loc?.country}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{loc?.state}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{loc?.district || loc?.townOrLocality}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-bold text-[#183120]">{community.name}</span>
        </div>

        <button
          onClick={() => {
            navigator.clipboard?.writeText?.(window.location.href);
            alert('Community link copied to clipboard!');
          }}
          className="flex items-center gap-1 hover:text-[#2D6A4F] text-[11px]"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Hub</span>
        </button>
      </div>

      {/* Community Header Banner Card */}
      <div className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-3xl overflow-hidden shadow-sm">
          {/* Cover image */}
          <div className="h-48 sm:h-64 w-full relative bg-[#183120] group/cover">
            <img
              src={community.coverImage || 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&auto=format&fit=crop&q=80'}
              alt={community.name}
              className="w-full h-full object-cover opacity-90"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&auto=format&fit=crop&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Change Cover Banner Button for Admins */}
            {(isPlatformAdmin || myMem?.role === 'communityAdmin') && (
              <button
                type="button"
                onClick={() => setShowBrandingModal(true)}
                className="absolute top-3 left-3 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md border border-white/20 transition cursor-pointer z-20"
                title="Update Community Cover & Profile Images"
              >
                <Camera className="w-4 h-4 text-[#E9A019]" />
                <span>Edit Community Branding</span>
              </button>
            )}

            {/* Admin-less Alert Ribbon (Section 9) */}
            {isAdminless && (
              <div className="absolute top-3 right-3 bg-[#C85A32] text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                <span>Admin-less Locality Hub (Platform Admin Oversight)</span>
              </div>
            )}

            {/* Location Chip */}
            <div className="absolute bottom-3 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#E9A019]" />
              <span>{loc?.townOrLocality}, {loc?.district || loc?.state}, {loc?.country}</span>
            </div>
          </div>

          {/* Profile Info & Action Bar */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5 -mt-16 sm:-mt-20 relative z-10">
                <div className="relative group/avatar shrink-0">
                  <img
                    src={community.profileImage || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80'}
                    alt={community.name}
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  {(isPlatformAdmin || myMem?.role === 'communityAdmin') && (
                    <button
                      type="button"
                      onClick={() => setShowBrandingModal(true)}
                      className="absolute -bottom-1 -right-1 p-2 bg-[#2D6A4F] hover:bg-[#183120] text-white rounded-full shadow-lg border-2 border-white transition cursor-pointer"
                      title="Change Community Profile Logo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              <div className="space-y-1 pt-10 sm:pt-14">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183120] font-sans">
                    {community.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EC] text-[#2D6A4F] text-[11px] font-bold border border-[#2D6A4F]/20">
                    Official Locality Hub
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#1F2D24]/80 max-w-2xl leading-relaxed">
                  {community.description}
                </p>
              </div>
            </div>

            {/* Join / Status CTA buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isMember ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                    myMem?.role === 'communityAdmin' 
                      ? 'bg-[#183120] border border-[#2D6A4F]/40' 
                      : myMem?.role === 'moderator'
                      ? 'bg-[#C85A32]'
                      : 'bg-[#2D6A4F]'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-[#E9A019]" />
                    <span>{myMem?.role === 'communityAdmin' ? 'Community Admin' : myMem?.role === 'moderator' ? 'Moderator' : 'Verified Resident'}</span>
                  </span>

                  {/* Role request button for regular members */}
                  {myMem?.role === 'member' && (
                    <button
                      onClick={() => setShowRequestRoleModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      title="Request Moderator or Community Admin Role"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E9A019]" />
                      <span>Request Role</span>
                    </button>
                  )}

                  {/* Step down button for higher users */}
                  {(myMem?.role === 'moderator' || myMem?.role === 'communityAdmin') && (
                    <button
                      onClick={() => handleStepDownHeader()}
                      className="px-3.5 py-1.5 rounded-xl border border-[#2D6A4F]/30 bg-white hover:bg-[#FAF8F3] text-[#183120] text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      title="Step down to regular Member"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>Step Down to Member</span>
                    </button>
                  )}
                  
                  <button
                    id="leave-community-header-btn"
                    onClick={handleLeaveCommunity}
                    className="px-3.5 py-1.5 rounded-xl border border-[#C85A32]/40 text-[#C85A32] hover:bg-[#C85A32] hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm bg-white/60 backdrop-blur-sm"
                    title="Leave this community"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave</span>
                  </button>
                </div>
              ) : currentUser?.platformRole === 'platformAdmin' ? (
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-2 rounded-xl bg-[#183120] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#2D6A4F]/40">
                    <Shield className="w-4 h-4 text-[#E9A019]" />
                    <span>Platform Administrator</span>
                  </span>
                </div>
              ) : isPending ? (
                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2 rounded-xl bg-[#E9A019]/20 border border-[#E9A019]/50 text-[#183120] text-xs font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#E9A019]" />
                    <span>Membership Request Pending</span>
                  </div>
                  <button
                    id="cancel-join-request-btn"
                    onClick={handleCancelJoinRequest}
                    className="px-3 py-2 rounded-xl border border-[#C85A32]/50 text-[#C85A32] hover:bg-[#C85A32] hover:text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel Request</span>
                  </button>
                </div>
              ) : isBanned ? (
                <div className="px-4 py-2 rounded-xl bg-[#C85A32]/20 border border-[#C85A32]/50 text-[#C85A32] text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Banned by Community Administration</span>
                </div>
              ) : (
                <button
                  id="join-community-btn"
                  onClick={() => setJoinModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <UserPlus className="w-4 h-4 text-[#E9A019]" />
                  <span>Request Membership</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Leadership Roster Strip */}
          <div className="pt-4 border-t border-[#2D6A4F]/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#1F2D24]/70">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#2D6A4F]" />
                <span className="font-semibold text-[#183120]">{community.memberCount} Verified Residents</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#2D6A4F]" />
                <span>
                  Admins: <strong className="text-[#183120]">
                    {community.admins && community.admins.length > 0 
                      ? community.admins.map((a: any) => `${a.firstName} ${a.lastName}`).join(', ') 
                      : (isAdminless ? 'None (Orphan)' : 'Community Admin')}
                  </strong>
                </span>
              </div>

              {community.moderators && community.moderators.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C85A32]" />
                  <span>
                    Mods: <strong className="text-[#183120]">
                      {community.moderators.map((m: any) => `${m.firstName} ${m.lastName}`).join(', ')}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#1F2D24]/50">
              Contact: {community.contactEmail}
            </div>
          </div>
        </div>
      </div>

      {/* Main Community Tabs */}
      <div className="flex border-b border-[#2D6A4F]/20 gap-2 sm:gap-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('feed')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'feed'
              ? 'border-[#2D6A4F] text-[#2D6A4F]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Discussions & Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'events'
              ? 'border-[#2D6A4F] text-[#2D6A4F]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Events & Initiatives</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'directory'
              ? 'border-[#2D6A4F] text-[#2D6A4F]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Resident Directory</span>
        </button>

        {(isCommAdmin || isMod) && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'border-[#C85A32] text-[#C85A32]'
                : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin & Moderation Console</span>
          </button>
        )}
      </div>

      {/* Tab 1: Discussions & Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          
          {/* Controls Bar: Category Pills + Search + Create Post Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map(cat => {
                const isSel = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
                      isSel
                        ? cat === 'Announcement'
                          ? 'bg-[#E8A227] text-[#183120] border border-[#183120]/30'
                          : cat === 'Local News'
                          ? 'bg-[#C85A32] text-white'
                          : cat === 'Initiative'
                          ? 'bg-[#2A7B5F] text-white'
                          : cat === 'Culture'
                          ? 'bg-[#E0856E] text-white'
                          : 'bg-[#2A7B5F] text-white'
                        : 'bg-[#EAF2ED] text-[#1D2A24] hover:bg-[#D3E4DA] border border-[#2A7B5F]/20'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search and Create Post Action */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#C85A32] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search discussions..."
                  className="w-full bg-[#FAF8F3] border border-[#2A7B5F]/30 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#C85A32] text-[#1D2A24]"
                />
              </div>

              {isMember ? (
                <button
                  id="open-create-post-btn"
                  onClick={() => setShowCreatePost(true)}
                  className="px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#b34c28] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 border border-[#E8A227]/40"
                >
                  <PlusCircle className="w-4 h-4 text-[#E8A227]" />
                  <span>Create Post</span>
                </button>
              ) : (
                <button
                  onClick={() => setJoinModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-[#EAF4EC] text-[#2D6A4F] text-xs font-bold border border-[#2D6A4F]/30 shrink-0"
                >
                  Join to Post
                </button>
              )}
            </div>
          </div>

          {/* Feed Posts List */}
          {loadingPosts ? (
            <div className="text-center py-12 text-xs text-[#1F2D24]/60">Loading local discussions...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-2xl p-12 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-[#2D6A4F]/40 mx-auto" />
              <h3 className="font-bold text-base text-[#183120]">No posts found in this category</h3>
              <p className="text-xs text-[#1F2D24]/60 max-w-sm mx-auto">
                Start the discussion for {community.name}! Share local news, questions, or neighborhood announcements.
              </p>
              {isMember && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold"
                >
                  <PlusCircle className="w-4 h-4 text-[#E9A019]" />
                  <span>Create First Post</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={currentUser}
                  currentRole={currentRole}
                  onPostUpdated={loadPosts}
                  onOpenReportModal={onOpenReportModal}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tab 2: Events & Calendar */}
      {activeTab === 'events' && (
        <EventsSection
          communityId={community._id}
          communityName={community.name}
          currentUser={currentUser}
          currentRole={currentRole}
          onOpenCreateEvent={() => setShowCreateEvent(true)}
        />
      )}

      {/* Tab 3: Member Directory */}
      {activeTab === 'directory' && (
        <MemberDirectory
          communityId={community._id}
          communityName={community.name}
          isMember={isMember || currentUser?.platformRole === 'platformAdmin'}
          currentUser={currentUser}
          currentRole={currentRole}
          onCommunityUpdated={onRefreshCommunity}
        />
      )}

      {/* Tab 4: Admin & Moderation Console */}
      {activeTab === 'admin' && (isCommAdmin || isMod) && (
        <CommunityAdminPanel
          communityId={community._id}
          communityName={community.name}
          currentUser={currentUser}
          currentRole={currentRole}
          onCommunityUpdated={onRefreshCommunity}
        />
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          communityId={community._id}
          communityName={community.name}
          isAdmin={isCommAdmin}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={loadPosts}
        />
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <CreateEventModal
          communityId={community._id}
          communityName={community.name}
          isAdmin={isCommAdmin}
          onClose={() => setShowCreateEvent(false)}
          onEventCreated={() => {
            setActiveTab('events');
            onRefreshCommunity();
          }}
        />
      )}

      {/* Join Community Request Modal */}
      {joinModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100 cursor-pointer"
          onClick={() => setJoinModalOpen(false)}
        >
          <div 
            className="bg-[#FAF8F3] text-[#1F2D24] rounded-3xl max-w-md w-full border border-[#2D6A4F]/30 shadow-2xl p-6 space-y-5 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2D6A4F]/20">
              <h3 className="font-bold text-base text-[#183120]">Join {community.name}</h3>
              <button onClick={() => setJoinModalOpen(false)} className="text-[#1F2D24]/60 hover:text-black">
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#EAF4EC] text-[#183120] space-y-1">
                <p className="font-bold">Residency Verification Required</p>
                <p className="text-[11px] leading-relaxed text-[#1F2D24]/80">
                  Community Admins verify residency before granting access to discussion posting and the private resident directory.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#183120]">Preferred Verification Method</label>
                <select
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs text-[#1F2D24]"
                >
                  <option value="phone">📞 Phone Verification</option>
                  <option value="in_person">🤝 In-Person Neighbor Reference</option>
                  <option value="email">✉️ Official Local Email</option>
                  <option value="document_proof">📄 Utility / Residence Proof</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#183120]">Note to Community Admins</label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="e.g. Resident of 4th Main Road for 5 years, available for phone verification..."
                  className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl p-3 text-xs text-[#1F2D24]"
                />
              </div>

              <div className="pt-3 border-t border-[#2D6A4F]/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#2D6A4F]/30 font-semibold text-[#1F2D24]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="px-5 py-2 rounded-xl bg-[#2D6A4F] text-white font-bold hover:bg-[#183120] transition"
                >
                  {joining ? 'Submitting...' : 'Submit Join Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step Down Header Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(stepDownConfirmData)}
        title={stepDownConfirmData?.title || 'Step Down Role'}
        message={stepDownConfirmData?.message || ''}
        confirmLabel="Confirm Step Down"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={executeStepDownHeader}
        onCancel={() => setStepDownConfirmData(null)}
      />

      {/* Leave Community In-App Modal */}
      <ConfirmModal
        isOpen={leaveModalOpen}
        title={`Leave ${community.name}?`}
        message={getLeaveWarningMessage()}
        confirmLabel="Leave Community"
        cancelLabel="Stay in Community"
        isDestructive={true}
        isLoading={isLeaving}
        onConfirm={executeLeaveCommunity}
        onCancel={() => setLeaveModalOpen(false)}
      />

      {/* Cancel Pending Request Modal */}
      <ConfirmModal
        isOpen={cancelJoinModalOpen}
        title={`Cancel Membership Request?`}
        message={`Are you sure you want to withdraw your pending membership request for ${community.name}?`}
        confirmLabel="Withdraw Request"
        cancelLabel="Keep Pending"
        isDestructive={true}
        isLoading={isCancellingJoin}
        onConfirm={executeCancelJoin}
        onCancel={() => setCancelJoinModalOpen(false)}
      />

      {/* Request Role Modal */}
      <RequestRoleModal
        isOpen={showRequestRoleModal}
        onClose={() => setShowRequestRoleModal(false)}
        communityId={community._id}
        communityName={community.name}
        currentRole={myMem?.role || 'member'}
        onRequestSubmitted={() => onRefreshCommunity()}
      />

      {/* Community Branding Modal */}
      {showBrandingModal && (
        <CommunityBrandingModal
          community={community}
          onClose={() => setShowBrandingModal(false)}
          onSaved={() => onRefreshCommunity()}
        />
      )}

    </div>
  );
}
