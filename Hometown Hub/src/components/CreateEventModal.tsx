import React, { useState } from 'react';
import { api } from '../api.ts';
import { X, Calendar, MapPin, Users, Clock, Image, AlertCircle } from 'lucide-react';

interface CreateEventModalProps {
  communityId: string;
  communityName: string;
  isAdmin: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export function CreateEventModal({
  communityId,
  communityName,
  isAdmin,
  onClose,
  onEventCreated
}: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) {
      setError('Title, start time, and end time are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.createEvent({
        communityId,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || 'Community Venue',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        capacity: Number(capacity) || 50,
        coverImage
      });
      onEventCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit event');
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
        
        {/* Modal Header */}
        <div className="bg-[#183120] text-[#FAF8F3] p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-white">
              {isAdmin ? 'Create Official Community Event' : 'Propose Community Event'}
            </h3>
            <p className="text-xs text-[#FAF8F3]/70">{communityName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2D6A4F]/40 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-[#C85A32]/15 text-[#C85A32] text-xs font-semibold">
              {error}
            </div>
          )}

          {!isAdmin && (
            <div className="p-3.5 rounded-xl bg-[#EAF4EC] border border-[#2D6A4F]/30 text-xs text-[#183120] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Member Event Proposal Notice</p>
                <p className="text-[#1F2D24]/80 text-[11px] leading-relaxed">
                  Member proposals are reviewed by Moderators and approved by Community Admins before appearing on the public calendar.
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#183120]">Event Title</label>
            <input
              id="event-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Elliot's Beach Clean-up & Mangrove Planting"
              className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F] text-[#1F2D24]"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#183120]">Location / Venue</label>
            <input
              id="event-location-input"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Schmidt Memorial, 6th Avenue, Besant Nagar"
              className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F] text-[#1F2D24]"
            />
          </div>

          {/* Timing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#183120]">Start Date & Time</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs focus:outline-none text-[#1F2D24]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#183120]">End Date & Time</label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs focus:outline-none text-[#1F2D24]"
              />
            </div>
          </div>

          {/* Capacity & Cover image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#183120]">Participant Capacity</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs focus:outline-none text-[#1F2D24]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#183120]">Cover Image URL</label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs focus:outline-none text-[#1F2D24]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#183120]">Event Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What to bring, meeting point instructions, schedule, agenda..."
              className="w-full bg-[#EAF4EC]/50 border border-[#2D6A4F]/30 rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#2D6A4F] text-[#1F2D24]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#2D6A4F]/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#2D6A4F]/30 text-xs font-semibold text-[#1F2D24] hover:bg-[#EAF4EC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition shadow-sm"
            >
              {submitting ? 'Submitting...' : (isAdmin ? 'Create Event' : 'Submit Proposal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
