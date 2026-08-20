import { useState, useEffect } from 'react';
import { Event, User } from '../types.ts';
import { api } from '../api.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  CheckCircle2, 
  PlusCircle, 
  ShieldCheck, 
  AlertCircle,
  Radio
} from 'lucide-react';

interface EventsSectionProps {
  communityId: string;
  communityName: string;
  currentUser: User | null;
  currentRole: 'platformAdmin' | 'communityAdmin' | 'moderator' | 'member' | 'guest';
  onOpenCreateEvent: () => void;
}

export function EventsSection({
  communityId,
  communityName,
  currentUser,
  currentRole,
  onOpenCreateEvent
}: EventsSectionProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ongoing' | 'upcoming' | 'proposals' | 'past'>('ongoing');
  const [nowTime, setNowTime] = useState(Date.now());
  const [rejectConfirmEventId, setRejectConfirmEventId] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const isCommAdmin = currentRole === 'communityAdmin' || currentUser?.platformRole === 'platformAdmin';
  const isMod = currentRole === 'moderator';
  const canReviewProposals = isCommAdmin || isMod;

  // Real-time ticker to auto-update event statuses every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [communityId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({ communityId });
      setEvents(res.events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (eventId: string, status: 'going' | 'interested' | 'cancelled') => {
    try {
      await api.rsvpEvent(eventId, status);
      loadEvents();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      await api.approveEvent(eventId);
      loadEvents();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReject = (eventId: string) => {
    setRejectConfirmEventId(eventId);
  };

  const executeReject = async () => {
    if (!rejectConfirmEventId) return;
    setIsRejecting(true);
    try {
      await api.rejectEvent(rejectConfirmEventId);
      setRejectConfirmEventId(null);
      loadEvents();
    } catch (e: any) {
      console.error(e);
      setRejectConfirmEventId(null);
    } finally {
      setIsRejecting(false);
    }
  };

  // Time classification helper
  const getEventTimeState = (e: Event): 'ongoing' | 'upcoming' | 'past' => {
    const startMs = new Date(e.startTime).getTime();
    let endMs = e.endTime ? new Date(e.endTime).getTime() : startMs + 3 * 3600 * 1000;
    if (endMs <= startMs) {
      endMs = startMs + 3 * 3600 * 1000;
    }

    if (nowTime >= startMs && nowTime <= endMs) {
      return 'ongoing';
    } else if (nowTime < startMs) {
      return 'upcoming';
    } else {
      return 'past';
    }
  };

  const ongoingEvents = events.filter(e => e.approvalStatus === 'approved' && getEventTimeState(e) === 'ongoing');
  const upcomingEvents = events.filter(e => e.approvalStatus === 'approved' && getEventTimeState(e) === 'upcoming');
  const pastEvents = events.filter(e => e.approvalStatus === 'approved' && getEventTimeState(e) === 'past');
  const pendingProposals = events.filter(e => e.approvalStatus === 'pending');

  const displayList = 
    tab === 'ongoing' ? ongoingEvents :
    tab === 'upcoming' ? upcomingEvents :
    tab === 'proposals' ? pendingProposals :
    pastEvents;

  return (
    <div id="community-events-section" className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#183120] flex items-center gap-2">
            <span>Community Calendar & Events</span>
            {ongoingEvents.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-extrabold shadow animate-pulse">
                <Radio className="w-3 h-3" />
                <span>{ongoingEvents.length} Live Now</span>
              </span>
            )}
          </h2>
          <p className="text-xs text-[#1F2D24]/70">
            Neighborhood cleanups, town halls, cultural festivals, and community initiatives.
          </p>
        </div>

        {currentRole !== 'guest' && (
          <button
            id="propose-event-btn"
            onClick={onOpenCreateEvent}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition shadow-sm self-start"
          >
            <PlusCircle className="w-4 h-4 text-[#E9A019]" />
            <span>{isCommAdmin ? 'Create Official Event' : 'Propose Community Event'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[#2D6A4F]/20 gap-2 sm:gap-4 text-xs font-bold">
        {/* Ongoing Events Tab */}
        <button
          onClick={() => setTab('ongoing')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            tab === 'ongoing'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </div>
          <span>Ongoing Events</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            ongoingEvents.length > 0 ? 'bg-red-600 text-white font-bold' : 'bg-[#EAF4EC] text-[#2D6A4F]'
          }`}>
            {ongoingEvents.length}
          </span>
        </button>

        {/* Upcoming Events Tab */}
        <button
          onClick={() => setTab('upcoming')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            tab === 'upcoming'
              ? 'border-[#2D6A4F] text-[#2D6A4F]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <span>Upcoming Events</span>
          <span className="px-2 py-0.5 rounded-full bg-[#EAF4EC] text-[#2D6A4F] text-[10px]">
            {upcomingEvents.length}
          </span>
        </button>

        {/* Past Events Tab */}
        <button
          onClick={() => setTab('past')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            tab === 'past'
              ? 'border-[#2D6A4F] text-[#2D6A4F]'
              : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
          }`}
        >
          <span>Past Events</span>
          <span className="px-2 py-0.5 rounded-full bg-[#EAF4EC] text-[#1F2D24]/60 text-[10px]">
            {pastEvents.length}
          </span>
        </button>

        {/* Proposals Tab */}
        {canReviewProposals && (
          <button
            onClick={() => setTab('proposals')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              tab === 'proposals'
                ? 'border-[#C85A32] text-[#C85A32]'
                : 'border-transparent text-[#1F2D24]/60 hover:text-[#183120]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pending Proposals</span>
            {pendingProposals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#C85A32] text-white text-[10px] animate-pulse">
                {pendingProposals.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#1F2D24]/60">Loading community events...</div>
      ) : displayList.length === 0 ? (
        <div className="bg-[#FAF8F3] border border-[#2D6A4F]/20 rounded-2xl p-10 text-center space-y-3">
          <Calendar className="w-10 h-10 text-[#2D6A4F]/40 mx-auto" />
          <h3 className="font-bold text-sm text-[#183120]">
            {tab === 'ongoing' ? 'No events occurring right now' :
             tab === 'proposals' ? 'No pending proposals to review' :
             tab === 'upcoming' ? 'No upcoming events scheduled' :
             'No past events recorded'}
          </h3>
          <p className="text-xs text-[#1F2D24]/60 max-w-sm mx-auto">
            {tab === 'ongoing' ? 'Check the Upcoming Events tab to see what is scheduled next in your locality!' :
             tab === 'proposals' ? 'All member event proposals have been processed.' :
             'Be the first to organize a meetup or cleanup in your locality!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayList.map(event => {
            const startDate = new Date(event.startTime);
            const isFull = (event.participantCount || 0) >= (event.capacity || 50);
            const isGoing = event.userRsvp === 'going';
            const isWaitlist = event.userRsvp === 'waitlist';
            const isInterested = event.userRsvp === 'interested';
            const timeState = getEventTimeState(event);

            return (
              <div
                key={event._id}
                id={`event-card-${event._id}`}
                className={`bg-[#FAF8F3] border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                  timeState === 'ongoing' ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-[#2D6A4F]/20'
                }`}
              >
                <div>
                  {/* Cover Image & Status Overlay */}
                  <div className="h-44 relative bg-[#183120] overflow-hidden">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Date Block */}
                    <div className="absolute top-3 left-3 bg-[#FAF8F3] text-[#183120] rounded-xl p-2 text-center shadow-lg min-w-[50px]">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#C85A32]">
                        {startDate.toLocaleDateString([], { month: 'short' })}
                      </span>
                      <span className="block text-xl font-extrabold leading-none">
                        {startDate.getDate()}
                      </span>
                    </div>

                    {/* Live / Status Badge */}
                    {event.approvalStatus === 'pending' ? (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#E9A019] text-[#183120] text-xs font-bold flex items-center gap-1 shadow">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Proposal Pending Review</span>
                      </div>
                    ) : timeState === 'ongoing' ? (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>🔴 Live / Ongoing Now</span>
                      </div>
                    ) : timeState === 'past' ? (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gray-900/80 text-white text-xs font-semibold flex items-center gap-1 backdrop-blur-sm shadow">
                        <span>Completed Event</span>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#2D6A4F] text-white text-xs font-semibold flex items-center gap-1 shadow">
                        <span>Upcoming</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-bold text-base line-clamp-1 drop-shadow">
                        {event.title}
                      </h3>
                      <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E9A019] shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#1F2D24]/70">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        <span>
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-semibold text-[#183120]">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#2D6A4F]" />
                          <span>{event.participantCount} / {event.capacity || '∞'} Going</span>
                        </div>
                        {(event.waitlistCount || 0) > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E9A019]/20 text-[#183120] font-bold">
                            {event.waitlistCount} Waitlist
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#1F2D24]/80 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#2D6A4F]/10 text-[11px] text-[#1F2D24]/60">
                      <span>Host:</span>
                      <span className="font-bold text-[#183120]">
                        {event.creator ? `${event.creator.firstName} ${event.creator.lastName}` : 'Local Organizer'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-[#EAF4EC]/40 border-t border-[#2D6A4F]/10">
                  {event.approvalStatus === 'pending' ? (
                    canReviewProposals ? (
                      <div className="flex items-center gap-2">
                        {isCommAdmin ? (
                          <button
                            onClick={() => handleApprove(event._id)}
                            className="flex-1 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4 text-[#E9A019]" />
                            <span>Approve & Publish (Admin)</span>
                          </button>
                        ) : (
                          <span className="text-xs text-[#1F2D24]/70 italic flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                            <span>Moderator reviewed: Awaiting Community Admin final sign-off</span>
                          </span>
                        )}
                        <button
                          onClick={() => handleReject(event._id)}
                          className="px-3 py-2 rounded-xl bg-[#C85A32]/20 hover:bg-[#C85A32] hover:text-white text-[#C85A32] text-xs font-bold transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-[#1F2D24]/60 text-center">
                        This event proposal is awaiting Community Admin verification.
                      </div>
                    )
                  ) : timeState === 'past' ? (
                    <div className="text-center text-xs text-[#1F2D24]/70 font-medium py-1">
                      {isGoing ? (
                        <span className="text-[#2D6A4F] font-bold">✓ You attended this community event</span>
                      ) : (
                        <span>This event has concluded</span>
                      )}
                    </div>
                  ) : (
                    currentRole !== 'guest' ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isWaitlist ? (
                            <button
                              onClick={() => handleRsvp(event._id, 'cancelled')}
                              className="px-3.5 py-2 rounded-xl bg-[#E9A019]/25 text-[#183120] hover:bg-[#E9A019]/40 text-xs font-bold transition flex items-center gap-1.5 border border-[#E9A019]/40"
                            >
                              <Clock className="w-4 h-4 text-[#E9A019]" />
                              <span>On Waitlist ⏳ (Leave)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRsvp(event._id, isGoing ? 'cancelled' : 'going')}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                isGoing
                                  ? 'bg-[#2D6A4F] text-white shadow-sm'
                                  : isFull
                                  ? 'bg-[#E9A019] hover:bg-[#E9A019]/80 text-[#183120]'
                                  : 'bg-[#EAF4EC] hover:bg-[#2D6A4F] hover:text-white text-[#2D6A4F] border border-[#2D6A4F]/30'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isGoing ? 'Attending ✓' : (isFull ? 'Join Waitlist' : 'RSVP Going')}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleRsvp(event._id, isInterested ? 'cancelled' : 'interested')}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                              isInterested
                                ? 'bg-[#E9A019] text-[#183120] font-bold'
                                : 'hover:bg-[#EAF4EC] text-[#1F2D24]/70'
                            }`}
                          >
                            {isInterested ? 'Interested ⭐' : 'Interested'}
                          </button>
                        </div>

                        {isGoing && (
                          <span className="text-[11px] text-[#2D6A4F] font-bold">
                            Spot Confirmed
                          </span>
                        )}
                        {isWaitlist && (
                          <span className="text-[11px] text-[#E9A019] font-bold">
                            Waitlisted
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-[#1F2D24]/60">
                        Join this community to RSVP and participate.
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Event Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(rejectConfirmEventId)}
        title="Reject Event Proposal?"
        message="Are you sure you want to reject this event proposal? The host will be notified."
        confirmLabel="Reject Event"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isRejecting}
        onConfirm={executeReject}
        onCancel={() => setRejectConfirmEventId(null)}
      />

    </div>
  );
}
