import { useState, useEffect, useCallback } from 'react';
import { User, Community } from './types.ts';
import { api } from './api.ts';
import { AuthPage } from './components/AuthPage.tsx';
import { Navbar } from './components/Navbar.tsx';
import { CommunityDiscovery } from './components/CommunityDiscovery.tsx';
import { CommunityView } from './components/CommunityView.tsx';
import { PlatformAdminDashboard } from './components/PlatformAdminDashboard.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import { RequestCommunityModal } from './components/RequestCommunityModal.tsx';
import { ReportModal } from './components/ReportModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { PendingRoleOffersBanner } from './components/PendingRoleOffersBanner.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'community' | 'platformAdmin'>('home');
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRequestCommunityModal, setShowRequestCommunityModal] = useState(false);
  const [leaveModalData, setLeaveModalData] = useState<{
    communityId: string;
    communityName: string;
    warning: string;
  } | null>(null);
  const [isLeavingCommunity, setIsLeavingCommunity] = useState(false);
  const [reportModalData, setReportModalData] = useState<{
    targetType: 'post' | 'comment';
    targetId: string;
    snippet: string;
  } | null>(null);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [userRes, commRes] = await Promise.all([
        api.getMe().catch(() => ({ user: null, memberships: [] })),
        api.getCommunities().catch(() => ({ communities: [] }))
      ]);
      if (userRes && userRes.user) {
        setCurrentUser(userRes.user);
      } else {
        setCurrentUser(null);
      }
      setCommunities(commRes?.communities || []);

      // If there was an active community, refresh its data
      if (activeCommunity && commRes?.communities) {
        const freshActive = commRes.communities.find((c: Community) => c._id === activeCommunity._id);
        if (freshActive) {
          setActiveCommunity(freshActive);
        }
      }
    } catch (err) {
      console.error('Failed to load initial Hometown Hub data', err);
    } finally {
      setLoading(false);
    }
  }, [activeCommunity?._id]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle successful login or persona selection from AuthPage
  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setLoading(true);
    try {
      const commRes = await api.getCommunities();
      setCommunities(commRes.communities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout: clear token and return to AuthPage outside
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error(err);
    }
    setCurrentUser(null);
    setActiveCommunity(null);
    setCurrentView('home');
  };

  // Handle selecting a community by ID
  const handleSelectCommunityById = async (communityId: string) => {
    try {
      const res = await api.getCommunityById(communityId);
      setActiveCommunity(res.community);
      setCurrentView('community');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to load community', err);
    }
  };

  const handleSelectCommunity = (community: Community) => {
    setActiveCommunity(community);
    setCurrentView('community');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoinCommunity = async (communityId: string) => {
    const notes = prompt('Enter a brief note for Community Admins regarding your local connection or address:');
    try {
      await api.joinCommunity(communityId, { verificationNotes: notes || undefined });
      alert('Membership request submitted! Community Admins will review your application.');
      await loadInitialData();
      if (activeCommunity && activeCommunity._id === communityId) {
        handleSelectCommunityById(communityId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit membership request');
    }
  };

  const handleLeaveCommunity = (communityId: string, communityName?: string) => {
    const comm = communities.find(c => c._id === communityId) || activeCommunity;
    const name = communityName || comm?.name || 'this community';
    let warning = `Are you sure you want to leave ${name}? You will forfeit verified posting and resident directory privileges.`;
    
    if (comm?.myMembership?.role === 'communityAdmin') {
      if (comm.adminCount <= 1) {
        warning = `⚠️ Sole Admin Warning: You are the ONLY Community Admin for ${name}.\n\nIf you leave, this locality hub will become Admin-less under Platform Admin oversight until a new Admin is appointed.\n\nAre you sure you want to leave ${name}?`;
      } else {
        warning = `You are a Community Admin for ${name}. Leaving will relinquish your administrative privileges, while other Co-Admins remain in charge.\n\nAre you sure you want to leave ${name}?`;
      }
    } else if (comm?.myMembership?.role === 'moderator') {
      warning = `You are a Moderator for ${name}. Leaving will relinquish your moderation privileges.\n\nAre you sure you want to leave ${name}?`;
    }

    setLeaveModalData({
      communityId,
      communityName: name,
      warning
    });
  };

  const executeLeaveCommunity = async () => {
    if (!leaveModalData) return;
    setIsLeavingCommunity(true);
    try {
      await api.leaveCommunity(leaveModalData.communityId);
      const leftId = leaveModalData.communityId;
      setLeaveModalData(null);
      await loadInitialData();
      if (activeCommunity && activeCommunity._id === leftId) {
        setCurrentView('home');
        setActiveCommunity(null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLeavingCommunity(false);
    }
  };

  // If initial load is checking session
  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] text-[#183120] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-wide">Connecting to Hometown Hub...</p>
      </div>
    );
  }

  // If user is not logged in, show dedicated AuthPage with login, register, and outside persona switcher
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1F2D24] flex flex-col font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* 1. Primary Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        activeCommunityName={activeCommunity?.name}
        onNavigateHome={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigatePlatformAdmin={() => {
          setCurrentView('platformAdmin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenRequestCommunity={() => setShowRequestCommunityModal(true)}
        onLogout={handleLogout}
        onSelectCommunityById={handleSelectCommunityById}
      />

      {/* 1.5 Pending Leadership Role Offers Banner */}
      <PendingRoleOffersBanner
        currentUser={currentUser}
        onRoleAccepted={loadInitialData}
      />

      {/* 2. Main Views Router */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-[#183120]">
            <div className="w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold tracking-wide">Updating community data...</p>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <CommunityDiscovery
                communities={communities}
                currentUser={currentUser}
                onSelectCommunity={handleSelectCommunity}
                onOpenRequestModal={() => setShowRequestCommunityModal(true)}
                onJoinCommunity={handleJoinCommunity}
                onLeaveCommunity={handleLeaveCommunity}
              />
            )}

            {currentView === 'community' && activeCommunity && (
              <CommunityView
                community={activeCommunity}
                currentUser={currentUser}
                onBackToDiscovery={() => {
                  setCurrentView('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenReportModal={(targetType, targetId, snippet) => {
                  setReportModalData({ targetType, targetId, snippet });
                }}
                onRefreshCommunity={() => {
                  handleSelectCommunityById(activeCommunity._id);
                  loadInitialData();
                }}
              />
            )}

            {currentView === 'platformAdmin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PlatformAdminDashboard
                  currentUser={currentUser}
                  onSelectCommunityById={handleSelectCommunityById}
                  onRefreshAll={loadInitialData}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. Global Modals */}
      {showProfileModal && currentUser && (
        <UserProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            loadInitialData();
          }}
        />
      )}

      {showRequestCommunityModal && (
        <RequestCommunityModal
          currentUser={currentUser}
          onClose={() => setShowRequestCommunityModal(false)}
          onRequestSubmitted={() => {
            loadInitialData();
          }}
        />
      )}

      {reportModalData && (
        <ReportModal
          targetType={reportModalData.targetType}
          targetId={reportModalData.targetId}
          snippet={reportModalData.snippet}
          onClose={() => setReportModalData(null)}
        />
      )}

      {/* Global Leave Community Modal */}
      <ConfirmModal
        isOpen={Boolean(leaveModalData)}
        title={`Leave ${leaveModalData?.communityName || 'Community'}?`}
        message={leaveModalData?.warning || 'Are you sure you want to leave this community?'}
        confirmLabel="Leave Community"
        cancelLabel="Stay in Community"
        isDestructive={true}
        isLoading={isLeavingCommunity}
        onConfirm={executeLeaveCommunity}
        onCancel={() => setLeaveModalData(null)}
      />

      {/* 4. Minimal Global Footer */}
      <footer className="border-t border-[#2D6A4F]/15 bg-[#FAF8F3] py-8 text-center text-xs text-[#1F2D24]/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-[#183120]">
            <span>Hometown Hub</span>
            <span className="text-[10px] font-normal text-[#1F2D24]/50">Hyperlocal Community Platform</span>
          </div>
          <p className="text-[11px]">
            Empowering towns, localities, and villages with verified resident networks and community stewardship.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-[#2D6A4F] font-semibold">
            <span>Verified Residency</span>
            <span>•</span>
            <span>Role-Based Governance</span>
            <span>•</span>
            <span>Local Autonomy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
