import mongoose, { Schema } from 'mongoose';

// 1. User Schema
export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  passwordHash?: string;
  bio?: string;
  profilePhoto?: string;
  hometown: {
    name: string;
    state?: string;
    country?: string;
    pincode?: string;
    coordinates?: [number, number]; // [lng, lat]
  };
  platformRole: 'platformAdmin' | 'user';
  privacySettings: {
    profilePhoto: 'public' | 'private';
    bio: 'public' | 'private';
    hometown: 'public' | 'private';
    eventsAttended: 'public' | 'private';
    postsCount: 'public' | 'private';
  };
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  passwordHash: { type: String },
  bio: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  hometown: {
    name: { type: String, required: true, index: true },
    state: { type: String },
    country: { type: String },
    pincode: { type: String },
    coordinates: { type: [Number], default: undefined }
  },
  platformRole: { type: String, enum: ['platformAdmin', 'user'], default: 'user', index: true },
  privacySettings: {
    profilePhoto: { type: String, enum: ['public', 'private'], default: 'public' },
    bio: { type: String, enum: ['public', 'private'], default: 'public' },
    hometown: { type: String, enum: ['public', 'private'], default: 'public' },
    eventsAttended: { type: String, enum: ['public', 'private'], default: 'public' },
    postsCount: { type: String, enum: ['public', 'private'], default: 'public' }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, _id: false });

// 2. Community Schema
export interface ICommunity {
  _id: string;
  name: string;
  slug: string;
  description: string;
  coverPhoto: string;
  type: 'neighborhood' | 'locality' | 'town' | 'village';
  location: {
    address?: string;
    city?: string;
    state?: string;
    country: string;
    pincode?: string;
    coordinates?: {
      type: string;
      coordinates: [number, number]; // [lng, lat]
    };
  };
  verificationRequirement: 'none' | 'admin_approval' | 'document_proof' | 'phone_confirmation';
  status: 'active' | 'archived' | 'suspended';
  adminCount: number;
  memberCount: number;
  postCount: number;
  eventCount: number;
  rules: string[];
  pinnedAnnouncements: string[];
  createdBy: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const CommunitySchema = new Schema<ICommunity>({
  _id: { type: String, required: true },
  name: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  coverPhoto: { type: String, default: '' },
  type: { type: String, enum: ['neighborhood', 'locality', 'town', 'village'], default: 'locality' },
  location: {
    address: { type: String },
    city: { type: String },
    state: { type: String, index: true },
    country: { type: String, required: true, index: true },
    pincode: { type: String },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [80.2707, 13.0827] }
    }
  },
  verificationRequirement: { 
    type: String, 
    enum: ['none', 'admin_approval', 'document_proof', 'phone_confirmation'], 
    default: 'admin_approval' 
  },
  status: { type: String, enum: ['active', 'archived', 'suspended'], default: 'active', index: true },
  adminCount: { type: Number, default: 1 },
  memberCount: { type: Number, default: 1 },
  postCount: { type: Number, default: 0 },
  eventCount: { type: Number, default: 0 },
  rules: { type: [String], default: [] },
  pinnedAnnouncements: { type: [String], default: [] },
  createdBy: { type: String, required: true }
}, { timestamps: true, _id: false });

CommunitySchema.index({ 'location.coordinates': '2dsphere' });

// 3. Community Membership Schema
export interface ICommunityMembership {
  _id: string;
  userId: string;
  communityId: string;
  role: 'communityAdmin' | 'moderator' | 'member';
  membershipStatus: 'pending' | 'active' | 'banned' | 'rejected';
  verificationMethod?: 'phone' | 'in_person' | 'email' | 'document_proof' | 'automatic';
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date | string;
  bannedBy?: string;
  banReason?: string;
  bannedAt?: Date | string;
  joinedAt?: Date | string;
}

const CommunityMembershipSchema = new Schema<ICommunityMembership>({
  _id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  communityId: { type: String, required: true, index: true },
  role: { type: String, enum: ['communityAdmin', 'moderator', 'member'], default: 'member', index: true },
  membershipStatus: { type: String, enum: ['pending', 'active', 'banned', 'rejected'], default: 'pending', index: true },
  verificationMethod: { type: String, enum: ['phone', 'in_person', 'email', 'document_proof', 'automatic'] },
  verificationNotes: { type: String },
  verifiedBy: { type: String },
  verifiedAt: { type: Date },
  bannedBy: { type: String },
  banReason: { type: String },
  bannedAt: { type: Date },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

CommunityMembershipSchema.index({ communityId: 1, userId: 1 }, { unique: true });
CommunityMembershipSchema.index({ communityId: 1, role: 1 });
CommunityMembershipSchema.index({ userId: 1, membershipStatus: 1 });

// 4. Post Schema
export interface IPost {
  _id: string;
  communityId: string;
  authorId: string;
  title: string;
  content: string;
  category: 'General' | 'News' | 'Question' | 'Event' | 'Recommendation' | 'Alert' | 'Announcement' | 'Initiative';
  mediaUrls: string[];
  isPinned: boolean;
  pinnedAt?: Date | string;
  status: 'active' | 'deleted' | 'hidden_by_mod';
  likeCount: number;
  commentCount: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  deletedByRole?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const PostSchema = new Schema<IPost>({
  _id: { type: String, required: true },
  communityId: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['General', 'News', 'Question', 'Event', 'Recommendation', 'Alert', 'Announcement', 'Initiative'],
    default: 'General',
    index: true
  },
  mediaUrls: { type: [String], default: [] },
  isPinned: { type: Boolean, default: false, index: true },
  pinnedAt: { type: Date },
  status: { type: String, enum: ['active', 'deleted', 'hidden_by_mod'], default: 'active', index: true },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  deletedAt: { type: Date },
  deletedBy: { type: String },
  deletedByRole: { type: String }
}, { timestamps: true, _id: false });

PostSchema.index({ communityId: 1, isPinned: -1, createdAt: -1 });
PostSchema.index({ communityId: 1, category: 1 });
PostSchema.index({ authorId: 1, createdAt: -1 });

// 5. Comment Schema
export interface IComment {
  _id: string;
  postId: string;
  communityId: string;
  authorId: string;
  parentCommentId?: string | null;
  content: string;
  status: 'active' | 'deleted';
  deletedAt?: Date | string;
  deletedBy?: string;
  deletedByRole?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const CommentSchema = new Schema<IComment>({
  _id: { type: String, required: true },
  postId: { type: String, required: true, index: true },
  communityId: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  parentCommentId: { type: String, default: null, index: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['active', 'deleted'], default: 'active', index: true },
  deletedAt: { type: Date },
  deletedBy: { type: String },
  deletedByRole: { type: String }
}, { timestamps: true, _id: false });

CommentSchema.index({ postId: 1, createdAt: 1 });

// 6. Reaction Schema
export interface IReaction {
  _id: string;
  postId: string;
  userId: string;
  reactionType: 'like' | 'helpful' | 'heart' | 'celebrate';
  createdAt?: Date | string;
}

const ReactionSchema = new Schema<IReaction>({
  _id: { type: String, required: true },
  postId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  reactionType: { type: String, enum: ['like', 'helpful', 'heart', 'celebrate'], default: 'like' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

ReactionSchema.index({ postId: 1, userId: 1 }, { unique: true });

// 7. Event Schema
export interface IEvent {
  _id: string;
  communityId: string;
  title: string;
  description: string;
  coverImage?: string;
  startTime: Date | string;
  endTime: Date | string;
  location: {
    venueName: string;
    address?: string;
    coordinates?: [number, number];
  };
  category: string;
  capacity: number;
  participantCount: number;
  waitlistCount: number;
  createdBy: string;
  creatorRole: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByRole?: string;
  rejectionReason?: string;
  status: 'active' | 'cancelled' | 'completed';
  cancelledAt?: Date | string;
  cancelReason?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const EventSchema = new Schema<IEvent>({
  _id: { type: String, required: true },
  communityId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  coverImage: { type: String, default: '' },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  location: {
    venueName: { type: String, required: true },
    address: { type: String, default: '' },
    coordinates: { type: [Number], default: undefined }
  },
  category: { type: String, default: 'Community Meetup' },
  capacity: { type: Number, default: 50 },
  participantCount: { type: Number, default: 0 },
  waitlistCount: { type: Number, default: 0 },
  createdBy: { type: String, required: true, index: true },
  creatorRole: { type: String, default: 'member' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
  approvedBy: { type: String },
  approvedByRole: { type: String },
  rejectionReason: { type: String },
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active', index: true },
  cancelledAt: { type: Date },
  cancelReason: { type: String }
}, { timestamps: true, _id: false });

EventSchema.index({ communityId: 1, startTime: 1 });

// 8. Event Participant Schema (RSVPs & Waitlist)
export interface IEventParticipant {
  _id: string;
  eventId: string;
  userId: string;
  participationStatus: 'going' | 'interested' | 'waitlist' | 'cancelled';
  joinedAt?: Date | string;
  cancelledAt?: Date | string;
}

const EventParticipantSchema = new Schema<IEventParticipant>({
  _id: { type: String, required: true },
  eventId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  participationStatus: { type: String, enum: ['going', 'interested', 'waitlist', 'cancelled'], default: 'going', index: true },
  joinedAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date }
}, { _id: false });

EventParticipantSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// 9. Role Offer Schema (Section 7.1)
export interface IRoleOffer {
  _id: string;
  communityId: string;
  communityName?: string;
  userId: string;
  targetRole: 'moderator' | 'communityAdmin';
  offeredBy: string;
  offeredByName?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt?: Date | string;
  respondedAt?: Date | string;
}

const RoleOfferSchema = new Schema<IRoleOffer>({
  _id: { type: String, required: true },
  communityId: { type: String, required: true, index: true },
  communityName: { type: String },
  userId: { type: String, required: true, index: true },
  targetRole: { type: String, enum: ['moderator', 'communityAdmin'], required: true },
  offeredBy: { type: String, required: true },
  offeredByName: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
}, { _id: false });

RoleOfferSchema.index({ userId: 1, status: 1 });

// 10. Community Admin Invitation Schema (Section 10)
export interface ICommunityAdminInvitation {
  _id: string;
  communityId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'finalized' | 'cancelled';
  invitedBy: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const CommunityAdminInvitationSchema = new Schema<ICommunityAdminInvitation>({
  _id: { type: String, required: true },
  communityId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'finalized', 'cancelled'], default: 'pending', index: true },
  invitedBy: { type: String, required: true }
}, { timestamps: true, _id: false });

CommunityAdminInvitationSchema.index({ userId: 1, status: 1 });

// 11. Community Creation Request Schema (Section 5)
export interface ICommunityCreationRequest {
  _id: string;
  name: string;
  type: string;
  description: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country: string;
    pincode?: string;
  };
  reason: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  createdAt?: Date | string;
}

const CommunityCreationRequestSchema = new Schema<any>({
  _id: { type: String, required: true },
  proposedCommunityName: { type: String },
  name: { type: String },
  type: { type: String, default: 'locality' },
  description: { type: String, default: '' },
  location: { type: Schema.Types.Mixed },
  reason: { type: String },
  justification: { type: String },
  requestedBy: { type: String, index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reviewNotes: { type: String },
  reviewedBy: { type: String },
  reviewedAt: { type: Schema.Types.Mixed },
  createdAt: { type: Schema.Types.Mixed, default: Date.now }
}, { _id: false, strict: false });

// 12. Report Schema
export interface IReport {
  _id: string;
  communityId: string;
  targetType: 'post' | 'comment' | 'event' | 'member';
  targetId: string;
  targetSnippet?: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date | string;
  createdAt?: Date | string;
}

const ReportSchema = new Schema<IReport>({
  _id: { type: String, required: true },
  communityId: { type: String, required: true, index: true },
  targetType: { type: String, enum: ['post', 'comment', 'event', 'member'], required: true },
  targetId: { type: String, required: true },
  targetSnippet: { type: String },
  reporterId: { type: String, required: true },
  reason: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending', index: true },
  resolution: { type: String },
  resolvedBy: { type: String },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// 13. Audit Log Schema
export interface IAuditLog {
  _id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  communityId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date | string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  _id: { type: String, required: true },
  actorId: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  communityId: { type: String, index: true },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
}, { _id: false });

AuditLogSchema.index({ communityId: 1, timestamp: -1 });

// 14. Notification Schema
export interface INotification {
  _id: string;
  userId: string;
  recipientId?: string;
  type: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt?: Date | string;
}

const NotificationSchema = new Schema<INotification>({
  _id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  recipientId: { type: String },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  referenceType: { type: String },
  referenceId: { type: String },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, { _id: false });

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Model Export Registrations
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');
export const CommunityModel = mongoose.models.Community || mongoose.model<ICommunity>('Community', CommunitySchema, 'communities');
export const CommunityMembershipModel = mongoose.models.CommunityMembership || mongoose.model<ICommunityMembership>('CommunityMembership', CommunityMembershipSchema, 'communityMemberships');
export const PostModel = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema, 'posts');
export const CommentModel = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema, 'comments');
export const ReactionModel = mongoose.models.Reaction || mongoose.model<IReaction>('Reaction', ReactionSchema, 'reactions');
export const EventModel = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema, 'events');
export const EventParticipantModel = mongoose.models.EventParticipant || mongoose.model<IEventParticipant>('EventParticipant', EventParticipantSchema, 'eventParticipants');
export const RoleOfferModel = mongoose.models.RoleOffer || mongoose.model<IRoleOffer>('RoleOffer', RoleOfferSchema, 'roleOffers');
export const CommunityAdminInvitationModel = mongoose.models.CommunityAdminInvitation || mongoose.model<ICommunityAdminInvitation>('CommunityAdminInvitation', CommunityAdminInvitationSchema, 'communityAdminInvitations');
export const CommunityCreationRequestModel = mongoose.models.CommunityCreationRequest || mongoose.model<ICommunityCreationRequest>('CommunityCreationRequest', CommunityCreationRequestSchema, 'communityCreationRequests');
export const ReportModel = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema, 'reports');
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema, 'auditLogs');
export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema, 'notifications');
