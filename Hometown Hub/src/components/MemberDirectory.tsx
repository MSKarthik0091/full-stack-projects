import { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Shield, ShieldAlert, Lock, Search, Users, MapPin, UserPlus, ShieldCheck } from 'lucide-react';
import { User } from '../types.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

interface MemberDirectoryProps {
  communityId: string;
  communityName: string;
  isMember: boolean;
  currentUser?: User | null;
  currentRole?: 'platformAdmin' | 'communityAdmin' | 'moderator' | 'member' | 'guest';
  onCommunityUpdated?: () => void;
}

export function MemberDirectory({
  communityId,
  communityName,
  isMember,
  currentUser,
  currentRole,
  onCommunityUpdated
}: MemberDirectoryProps) {
  const [directory, setDirectory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [promoteModalData, setPromoteModalData] = useState<{ userId: string; userName: string } | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [removeModModalData, setRemoveModModalData] = useState<{ userId: string; userName: string } | null>(null);
  const [isRemovingMod, setIsRemovingMod] = useState(false);

  const isCommAdmin = currentRole === 'communityAdmin' || currentUser?.platformRole === 'platformAdmin';

  useEffect(() => {
    if (isMember) {
      loadDirectory();
    } else {
      setLoading(false);
      setError('Private Directory: Only verified active members of this community can view the resident directory.');
    }
  }, [communityId, isMember]);

  const loadDirectory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCommunityDirectory(communityId);
      setDirectory(res.directory);
    } catch (e: any) {
      setError(e.message || 'Failed to load member directory');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteAdmin = (userId: string, userName: string) => {
    setError(null);
    setSuccessMessage(null);
    setPromoteModalData({ userId, userName });
  };

  const handlePromoteMod = async (userId: string) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.promoteModerator(communityId, userId);
      setSuccessMessage(res.message || 'Moderator role offer sent successfully.');
      loadDirectory();
    } catch (e: any) {
      setError(e.message || 'Failed to send moderator role offer.');
    }
  };

  const handleRemoveMod = (userId: string, userName: string) => {
    setError(null);
    setSuccessMessage(null);
    setRemoveModModalData({ userId, userName });
  };

  const executeRemoveMod = async () => {
    if (!removeModModalData) return;
    setIsRemovingMod(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.removeModerator(communityId, removeModModalData.userId);
      setSuccessMessage(res.message || 'Moderator role removed successfully.');
      setRemoveModModalData(null);
      await loadDirectory();
      onCommunityUpdated?.();
    } catch (e: any) {
      setError(e.message || 'Failed to remove moderator role.');
      setRemoveModModalData(null);
    } finally {
      setIsRemovingMod(false);
    }
  };

  const executePromoteAdmin = async () => {
    if (!promoteModalData) return;
    setIsPromoting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      let res;
      if (currentUser?.platformRole === 'platformAdmin') {
        res = await api.assignCommunityAdmin(communityId, promoteModalData.userId);
      } else {
        res = await api.promoteCoAdmin(communityId, promoteModalData.userId);
      }
      setSuccessMessage(res?.message || 'Admin role updated successfully.');
      setPromoteModalData(null);
      await loadDirectory();
      onCommunityUpdated?.();
    } catch (e: any) {
      setError(e.message || 'Failed to promote admin.');
      setPromoteModalData(null);
    } finally {
      setIsPromoting(false);
    }
  };

  const filtered = directory.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    const u = item.user;
    return u && (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      (u.hometown && u.hometown.toLowerCase().includes(q))
    );
  });

  if (!isMember) {
    return (
      <div className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#EAF4EC] text-[#2D6A4F] flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7 text-[#C85A32]" />
        </div>
        <h3 className="text-lg font-bold text-[#183120]">Private Member Directory</h3>
        <p className="text-xs text-[#1F2D24]/70 leading-relaxed">
          To protect resident privacy in {communityName}, the member roster is strictly restricted to verified active members whose residency has been approved by Community Administration.
        </p>
      </div>
    );
  }

  return (
    <div id="community-member-directory" className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#183120]">Resident Directory</h2>
          <p className="text-xs text-[#1F2D24]/70">
            Verified neighbors and local community administration in {communityName}.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#2D6A4F] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search residents by name or hometown..."
            className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#2D6A4F] text-[#1F2D24]"
          />
        </div>
      </div>

      {/* Success/Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-semibold flex items-center justify-between border border-[#2D6A4F]/20">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-[#2D6A4F] hover:opacity-70 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Directory Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#1F2D24]/60">Loading resident directory...</div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-[#C85A32]/10 text-[#C85A32] text-xs text-center">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-xs text-[#1F2D24]/60">No members found matching your search.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(item => {
            const u = item.user;
            const role = item.role;

            return (
              <div
                key={item.membershipId}
                className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {u.profilePhoto ? (
                      <img
                        src={u.profilePhoto}
                        alt={u.firstName}
                        className="w-12 h-12 rounded-full object-cover border border-[#2D6A4F]/30"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm">
                        {u.firstName?.[0] || 'U'}
                      </div>
                    )}

                    <div>
                      <h4 className="font-bold text-sm text-[#183120]">
                        {u.firstName} {u.lastName}
                      </h4>
                      <p className="text-xs text-[#1F2D24]/60">@{u.username}</p>
                    </div>
                  </div>

                  {u.bio && (
                    <p className="text-xs text-[#1F2D24]/80 leading-relaxed line-clamp-2">
                      {u.bio}
                    </p>
                  )}

                  {u.hometown && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#1F2D24]/70">
                      <MapPin className="w-3 h-3 text-[#C85A32]" />
                      <span>Hometown: <strong className="text-[#183120]">{u.hometown}</strong></span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#2D6A4F]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] text-[#1F2D24]/50">
                    Joined {new Date(item.joinedAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {currentUser?.platformRole === 'platformAdmin' && role !== 'communityAdmin' && u._id !== currentUser?._id && (
                      item.pendingOfferRole === 'communityAdmin' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-[#EAF4EC] text-[#2D6A4F] text-[10px] font-bold border border-[#2D6A4F]/20">
                          Offer Already Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePromoteAdmin(u._id, `${u.firstName} ${u.lastName}`)}
                          className="px-2 py-0.5 rounded-lg bg-[#EAF4EC] hover:bg-[#2D6A4F] hover:text-white text-[#2D6A4F] border border-[#2D6A4F]/30 text-[10px] font-bold transition flex items-center gap-1"
                          title="Appoint as Community Admin (Platform Admin Only)"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Make Admin</span>
                        </button>
                      )
                    )}

                    {isCommAdmin && role !== 'communityAdmin' && u._id !== currentUser?._id && (
                      role === 'moderator' ? (
                        <button
                          onClick={() => handleRemoveMod(u._id, `${u.firstName} ${u.lastName}`)}
                          className="px-2 py-0.5 rounded-lg bg-[#C85A32]/10 hover:bg-[#C85A32] hover:text-white text-[#C85A32] border border-[#C85A32]/30 text-[10px] font-bold transition"
                          title="Remove Moderator Role"
                        >
                          <span>Remove Mod</span>
                        </button>
                      ) : item.pendingOfferRole === 'moderator' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-[#EAF4EC] text-[#2D6A4F] text-[10px] font-bold border border-[#2D6A4F]/20">
                          Offer Already Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePromoteMod(u._id)}
                          className="px-2 py-0.5 rounded-lg bg-[#EAF4EC] hover:bg-[#2D6A4F] hover:text-white text-[#2D6A4F] border border-[#2D6A4F]/30 text-[10px] font-bold transition flex items-center gap-1"
                          title="Offer Moderator Role"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Make Mod</span>
                        </button>
                      )
                    )}

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
                      role === 'communityAdmin'
                        ? 'bg-[#183120] text-[#E8A227] border border-[#E8A227]/40'
                        : role === 'moderator'
                        ? 'bg-[#E8A227] text-[#183120] border border-[#183120]/30'
                        : 'bg-[#EAF2ED] text-[#2A7B5F] border border-[#2A7B5F]/30'
                    }`}>
                      {role === 'communityAdmin' ? 'Admin' : role === 'moderator' ? 'Moderator' : 'Member'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appoint Admin Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(promoteModalData)}
        title={`Appoint Community Admin`}
        message={`Are you sure you want to appoint ${promoteModalData?.userName} as Community Admin for ${communityName}? They will receive full administrative authority over member verification, moderation, and community settings.`}
        confirmLabel="Appoint Admin"
        cancelLabel="Cancel"
        isDestructive={false}
        isLoading={isPromoting}
        onConfirm={executePromoteAdmin}
        onCancel={() => setPromoteModalData(null)}
      />

      {/* Remove Moderator Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(removeModModalData)}
        title="Remove Moderator Role"
        message={`Are you sure you want to remove the Moderator role from ${removeModModalData?.userName}? They will return to regular member status in ${communityName}.`}
        confirmLabel="Remove Moderator"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isRemovingMod}
        onConfirm={executeRemoveMod}
        onCancel={() => setRemoveModModalData(null)}
      />

    </div>
  );
}
