import React, { useState, useEffect } from 'react';
import { User, RoleOffer } from '../types.ts';
import { api } from '../api.ts';
import { ProfilePhotoSelector } from './ProfilePhotoSelector.tsx';
import { 
  X, 
  User as UserIcon, 
  Lock, 
  Globe, 
  MapPin, 
  Mail, 
  Phone, 
  ShieldCheck, 
  RotateCcw, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle,
  Award,
  LogOut
} from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
  onLogout?: () => void;
}

export function UserProfileModal({
  user,
  onClose,
  onUserUpdated,
  onLogout
}: UserProfileModalProps) {
  const [tab, setTab] = useState<'profile' | 'privacy' | 'invitations' | 'trash'>('profile');
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [bio, setBio] = useState(user.bio || '');
  const [hometown, setHometown] = useState(user.hometown || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto || '');
  
  const [privacySettings, setPrivacySettings] = useState(user.privacySettings || {
    profilePhoto: 'public',
    bio: 'public',
    hometown: 'public',
    otherProfileDetails: 'private'
  });

  const [invitations, setInvitations] = useState<any[]>([]);
  const [roleOffers, setRoleOffers] = useState<RoleOffer[]>([]);
  const [trashPosts, setTrashPosts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadInvitationsAndTrash();
  }, [tab]);

  const loadInvitationsAndTrash = async () => {
    try {
      if (tab === 'invitations') {
        const [invRes, offersRes] = await Promise.all([
          api.getAdminInvitations(),
          api.getRoleOffers()
        ]);
        setInvitations(invRes.invitations || []);
        setRoleOffers(offersRes.roleOffers || []);
      } else if (tab === 'trash') {
        const res = await api.getTrashPosts();
        setTrashPosts(res.trash || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await api.updateProfile({
        firstName,
        lastName,
        bio,
        hometown,
        phoneNumber,
        profilePhoto,
        privacySettings
      });
      onUserUpdated(res.user);
      setSuccessMsg('Profile and privacy preferences updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRespondInvitation = async (invitationId: string, response: 'accept' | 'reject') => {
    try {
      await api.respondAdminInvitation(invitationId, response);
      alert(response === 'accept' 
        ? 'Invitation accepted! Platform Admin has been notified for final appointment confirmation.' 
        : 'Invitation declined.');
      loadInvitationsAndTrash();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRespondRoleOffer = async (offerId: string, response: 'accept' | 'decline') => {
    try {
      const res = await api.respondRoleOffer(offerId, response);
      alert(res.message || (response === 'accept' ? 'Role offer accepted! Your new privileges are now active.' : 'Role offer declined.'));
      loadInvitationsAndTrash();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRestoreOwnPost = async (postId: string) => {
    try {
      await api.restorePost(postId);
      alert('Post restored from 30-day trash bin!');
      loadInvitationsAndTrash();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F3] text-[#1F2D24] rounded-3xl max-w-2xl w-full border border-[#2D6A4F]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-[#183120] text-[#FAF8F3] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profilePhoto ? (
              <img src={profilePhoto} alt={user.firstName} className="w-10 h-10 rounded-full object-cover border border-white/40" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold">
                {user.firstName[0]}
              </div>
            )}
            <div>
              <h3 className="font-bold text-base text-white">{user.firstName} {user.lastName}</h3>
              <p className="text-xs text-[#FAF8F3]/70">@{user.username} • {user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2D6A4F]/40 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-[#2D6A4F]/20 px-6 pt-3 gap-4 text-xs font-bold bg-[#EAF4EC]/40">
          <button
            onClick={() => setTab('profile')}
            className={`pb-3 border-b-2 transition ${tab === 'profile' ? 'border-[#2D6A4F] text-[#2D6A4F]' : 'border-transparent text-[#1F2D24]/60'}`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setTab('privacy')}
            className={`pb-3 border-b-2 transition ${tab === 'privacy' ? 'border-[#2D6A4F] text-[#2D6A4F]' : 'border-transparent text-[#1F2D24]/60'}`}
          >
            Granular Privacy Settings
          </button>
          <button
            onClick={() => setTab('invitations')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${tab === 'invitations' ? 'border-[#2D6A4F] text-[#2D6A4F]' : 'border-transparent text-[#1F2D24]/60'}`}
          >
            <span>Role Offers & Invitations</span>
            {(invitations.filter(i => i.status === 'pending').length + roleOffers.filter(r => r.status === 'pending').length) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E9A019] text-[#183120] text-[10px] font-bold">
                {invitations.filter(i => i.status === 'pending').length + roleOffers.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('trash')}
            className={`pb-3 border-b-2 transition flex items-center gap-1 ${tab === 'trash' ? 'border-[#2D6A4F] text-[#2D6A4F]' : 'border-transparent text-[#1F2D24]/60'}`}
          >
            <span>My Trash (30-Day)</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-[#2D6A4F]/15 text-[#2D6A4F] text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-[#E9A019]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab 1: Profile Info Form */}
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#183120]">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs text-[#1F2D24]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#183120]">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs text-[#1F2D24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#183120]">Hometown</label>
                  <input
                    type="text"
                    value={hometown}
                    onChange={(e) => setHometown(e.target.value)}
                    placeholder="e.g. Besant Nagar, Chennai"
                    className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs text-[#1F2D24]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#183120]">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs text-[#1F2D24]"
                  />
                </div>
              </div>

              <ProfilePhotoSelector
                value={profilePhoto}
                onChange={setProfilePhoto}
                label="Profile Picture (File Upload or Image URL)"
              />

              <div className="space-y-1">
                <label className="font-bold text-[#183120]">Short Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your neighbors a bit about yourself..."
                  className="w-full bg-white border border-[#2D6A4F]/30 rounded-xl p-3 text-xs text-[#1F2D24]"
                />
              </div>

              <div className="pt-3 border-t border-[#2D6A4F]/20 flex items-center justify-between">
                {onLogout ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out / Switch Account</span>
                  </button>
                ) : <div />}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white font-bold transition cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Granular Privacy Settings */}
          {tab === 'privacy' && (
            <div className="space-y-5 text-xs">
              <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-[#1F2D24]/80 space-y-1">
                <p className="font-bold text-[#183120]">Section 21 & 44: Granular User Privacy Controls</p>
                <p>
                  You have absolute control over what other residents can view on your profile and directory listing. Private fields are hidden from non-self visitors.
                </p>
              </div>

              <div className="space-y-3 divide-y divide-[#2D6A4F]/15">
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-bold text-[#183120]">Profile Photo Visibility</p>
                    <p className="text-[#1F2D24]/60 text-[11px]">Show your photo in discussion posts and directory</p>
                  </div>
                  <select
                    value={privacySettings.profilePhoto}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, profilePhoto: e.target.value as any })}
                    className="bg-white border border-[#2D6A4F]/30 rounded-lg px-2.5 py-1 text-xs"
                  >
                    <option value="public">🌐 Public (All residents)</option>
                    <option value="private">🔒 Private (Only Me)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="font-bold text-[#183120]">Bio & Description Visibility</p>
                    <p className="text-[#1F2D24]/60 text-[11px]">Display your personal bio on your public card</p>
                  </div>
                  <select
                    value={privacySettings.bio}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, bio: e.target.value as any })}
                    className="bg-white border border-[#2D6A4F]/30 rounded-lg px-2.5 py-1 text-xs"
                  >
                    <option value="public">🌐 Public (All residents)</option>
                    <option value="private">🔒 Private (Only Me)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="font-bold text-[#183120]">Hometown Visibility</p>
                    <p className="text-[#1F2D24]/60 text-[11px]">Display your hometown in member directory</p>
                  </div>
                  <select
                    value={privacySettings.hometown}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, hometown: e.target.value as any })}
                    className="bg-white border border-[#2D6A4F]/30 rounded-lg px-2.5 py-1 text-xs"
                  >
                    <option value="public">🌐 Public (All residents)</option>
                    <option value="private">🔒 Private (Only Me)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="font-bold text-[#183120]">Other Profile Details (Phone, Email)</p>
                    <p className="text-[#1F2D24]/60 text-[11px]">Phone and email are hidden by default for member privacy</p>
                  </div>
                  <select
                    value={privacySettings.otherProfileDetails}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, otherProfileDetails: e.target.value as any })}
                    className="bg-white border border-[#2D6A4F]/30 rounded-lg px-2.5 py-1 text-xs"
                  >
                    <option value="private">🔒 Private (Protected)</option>
                    <option value="public">🌐 Public</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2D6A4F]/20 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white font-bold transition shadow-sm"
                >
                  {saving ? 'Saving...' : 'Update Privacy Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Role Offers & Admin Invitations */}
          {tab === 'invitations' && (
            <div className="space-y-6 text-xs">
              {/* Section 7.1: Role Offers */}
              <div className="space-y-3">
                <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-[#1F2D24]/80 space-y-1">
                  <p className="font-bold text-[#183120] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Section 7.1 & 11: Community Role Offers (Promotions)</span>
                  </p>
                  <p>
                    When a Community Admin appoints you as a Co-Admin or Moderator, an offer is issued here. Accepting activates your new privileges immediately and notifies fellow co-admins.
                  </p>
                </div>

                {roleOffers.length === 0 ? (
                  <div className="p-5 text-center bg-white rounded-2xl border border-[#2D6A4F]/15 text-[#1F2D24]/60">
                    No pending role offers for your account.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roleOffers.map(offer => (
                      <div key={offer._id} className="p-4 bg-white rounded-2xl border border-[#2D6A4F]/30 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-[#EAF4EC] text-[#2D6A4F]">
                              <Award className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="font-bold text-sm text-[#183120]">
                                {offer.targetRole === 'communityAdmin' ? 'Co-Admin Promotion' : 'Moderator Appointment'}
                              </h4>
                              <p className="text-[11px] text-[#1F2D24]/70">
                                Locality: <span className="font-semibold text-[#183120]">{offer.community?.name || offer.communityName}</span>
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            offer.status === 'accepted' ? 'bg-[#2D6A4F] text-white' : offer.status === 'declined' ? 'bg-[#C85A32]/15 text-[#C85A32]' : 'bg-[#E9A019]/25 text-[#183120]'
                          }`}>
                            {offer.status.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-[#1F2D24]/80">
                          {offer.offeredByName || 'Community leadership'} has invited you to become a <strong className="text-[#183120]">{offer.targetRole === 'communityAdmin' ? 'Community Co-Admin' : 'Moderator'}</strong>.
                        </p>

                        {offer.status === 'pending' && (
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => handleRespondRoleOffer(offer._id, 'accept')}
                              className="px-4 py-2 rounded-xl bg-[#2D6A4F] text-white font-bold hover:bg-[#183120] transition shadow-xs flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Role</span>
                            </button>
                            <button
                              onClick={() => handleRespondRoleOffer(offer._id, 'decline')}
                              className="px-3.5 py-2 rounded-xl bg-[#C85A32]/15 text-[#C85A32] font-bold hover:bg-[#C85A32] hover:text-white transition"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 10: Replacement Invitations */}
              <div className="space-y-3 pt-4 border-t border-[#2D6A4F]/20">
                <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-[#1F2D24]/80 space-y-1">
                  <p className="font-bold text-[#183120]">Section 10: Replacement Community Admin Invitations</p>
                  <p>
                    When a community becomes Admin-less, the Platform Admin dispatches invitations to trusted active residents. Accepting signals readiness, after which the Platform Admin finalizes the appointment.
                  </p>
                </div>

                {invitations.length === 0 ? (
                  <div className="p-5 text-center bg-white rounded-2xl border border-[#2D6A4F]/15 text-[#1F2D24]/60">
                    No active Platform Admin invitations for your account.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map(inv => (
                      <div key={inv._id} className="p-4 bg-white rounded-2xl border border-[#2D6A4F]/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#183120]">
                            Community Admin Invitation: {inv.community?.name || 'Locality'}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'finalized' ? 'bg-[#2D6A4F] text-white' : inv.status === 'accepted' ? 'bg-[#E9A019] text-[#183120]' : 'bg-[#EAF4EC] text-[#2D6A4F]'
                          }`}>
                            {inv.status.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-[#1F2D24]/80">
                          Platform Administration has invited you to take over stewardship as Community Admin for {inv.community?.name}.
                        </p>

                        {inv.status === 'pending' && (
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => handleRespondInvitation(inv._id, 'accept')}
                              className="px-4 py-1.5 rounded-xl bg-[#2D6A4F] text-white font-bold hover:bg-[#183120]"
                            >
                              Accept Invitation
                            </button>
                            <button
                              onClick={() => handleRespondInvitation(inv._id, 'reject')}
                              className="px-3 py-1.5 rounded-xl bg-[#C85A32]/15 text-[#C85A32] font-bold hover:bg-[#C85A32] hover:text-white"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: My Trash */}
          {tab === 'trash' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#EAF4EC]/60 rounded-2xl p-4 border border-[#2D6A4F]/20 text-[#1F2D24]/80 space-y-1">
                <p className="font-bold text-[#183120]">Section 25: Author 30-Day Restoration Bin</p>
                <p>
                  As an author, you can restore posts that you soft-deleted within 30 days. Items removed by Community Admins cannot be restored by authors.
                </p>
              </div>

              {trashPosts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#2D6A4F]/15 text-[#1F2D24]/60">
                  Your trash bin is empty. No deleted posts.
                </div>
              ) : (
                <div className="space-y-3">
                  {trashPosts.map(p => (
                    <div key={p._id} className="p-4 bg-white rounded-2xl border border-[#2D6A4F]/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[#183120]">{p.title}</h4>
                        <span className="text-[10px] text-[#1F2D24]/50">
                          Deleted on {new Date(p.deletedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[#1F2D24]/80 line-clamp-2">{p.content}</p>
                      
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleRestoreOwnPost(p._id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2D6A4F] text-white font-bold hover:bg-[#183120] flex items-center gap-1.5 shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#E9A019]" />
                          <span>Restore to Feed</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
