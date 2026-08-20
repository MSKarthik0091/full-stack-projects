import { useState, useEffect } from 'react';
import { RoleOffer, User } from '../types.ts';
import { api } from '../api.ts';
import { ShieldCheck, Check, X, Award, AlertCircle } from 'lucide-react';

interface PendingRoleOffersBannerProps {
  currentUser: User | null;
  onRoleAccepted?: () => void;
}

export function PendingRoleOffersBanner({ currentUser, onRoleAccepted }: PendingRoleOffersBannerProps) {
  const [offers, setOffers] = useState<RoleOffer[]>([]);
  const [loadingOfferId, setLoadingOfferId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const loadOffers = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getRoleOffers();
      if (res && Array.isArray(res.roleOffers)) {
        setOffers(res.roleOffers.filter(o => o.status === 'pending'));
      }
    } catch {
      // Ignore initial background errors
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadOffers();
      const interval = setInterval(loadOffers, 8000);
      return () => clearInterval(interval);
    }
  }, [currentUser?._id]);

  const handleRespond = async (offer: RoleOffer, response: 'accept' | 'decline') => {
    setLoadingOfferId(offer._id);
    try {
      const res = await api.respondRoleOffer(offer._id, response);
      setOffers(prev => prev.filter(o => o._id !== offer._id));
      setNotificationMsg(
        response === 'accept'
          ? `🎉 You accepted the ${offer.targetRole === 'communityAdmin' ? 'Community Admin' : 'Moderator'} role for ${offer.communityName || 'the community'}!`
          : `You declined the appointment for ${offer.communityName || 'the community'}.`
      );
      setTimeout(() => setNotificationMsg(null), 5000);
      if (onRoleAccepted && response === 'accept') {
        onRoleAccepted();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to respond to role offer');
    } finally {
      setLoadingOfferId(null);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="w-full">
      {notificationMsg && (
        <div className="bg-[#2D6A4F] text-white px-4 py-2.5 text-xs text-center font-bold flex items-center justify-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-[#E9A019]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {offers.length > 0 && (
        <div className="bg-[#E8A227]/15 border-b-2 border-[#E8A227] px-4 py-3 sm:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto space-y-2">
            {offers.map(offer => {
              const isAdmin = offer.targetRole === 'communityAdmin';
              const roleTitle = isAdmin ? 'Community Admin' : 'Community Moderator';
              const communityTitle = offer.communityName || offer.community?.name || 'Locality Hub';
              const offeredByName = offer.offeredByName || offer.offeredByUser?.firstName || 'Platform Leadership';

              return (
                <div
                  key={offer._id}
                  className="bg-[#FAF8F3] border-2 border-[#E8A227] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-[#E8A227] text-[#183120] shrink-0 mt-0.5 shadow-xs">
                      {isAdmin ? (
                        <ShieldCheck className="w-6 h-6 text-[#183120]" />
                      ) : (
                        <Award className="w-6 h-6 text-[#183120]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-[#183120]">
                          Official Leadership Appointment: {roleTitle}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E8A227] text-[#183120] text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                          Requires Your Consent
                        </span>
                      </div>

                      <p className="text-xs text-[#1D2A24] font-medium leading-relaxed">
                        <strong className="text-[#183120]">{offeredByName}</strong> has appointed you to serve as <strong className="text-[#C85A32]">{roleTitle}</strong> for <span className="font-bold text-[#2A7B5F]">{communityTitle}</span>.
                      </p>

                      <p className="text-[11px] text-[#1D2A24]/70">
                        Accepting will immediately grant you community governance authority. Both you and platform administrators will receive an official notification of your decision.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      id={`accept-offer-${offer._id}`}
                      disabled={loadingOfferId === offer._id}
                      onClick={() => handleRespond(offer, 'accept')}
                      className="px-4 py-2 rounded-xl bg-[#2A7B5F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer border border-[#E8A227]"
                    >
                      <Check className="w-4 h-4 text-[#E8A227]" />
                      <span>{loadingOfferId === offer._id ? 'Processing...' : 'Accept Role'}</span>
                    </button>

                    <button
                      id={`decline-offer-${offer._id}`}
                      disabled={loadingOfferId === offer._id}
                      onClick={() => handleRespond(offer, 'decline')}
                      className="px-3.5 py-2 rounded-xl bg-[#C85A32] hover:bg-[#b34c28] text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
