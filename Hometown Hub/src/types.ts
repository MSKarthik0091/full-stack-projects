export type PlatformRole = 'platformAdmin' | 'user';

export type CommunityRole = 'member' | 'moderator' | 'communityAdmin';

export type MembershipStatus = 'pending' | 'active' | 'rejected' | 'banned' | 'left';

export type PostCategory = 
  | 'General' 
  | 'Discussion' 
  | 'Local News' 
  | 'Culture' 
  | 'Announcement' 
  | 'Initiative';

export type ReactionType = 'like' | 'helpful' | 'heart' | 'celebrate';

export type EventStatus = 'active' | 'cancelled' | 'completed';
export type EventApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ParticipationStatus = 'going' | 'interested' | 'waitlist' | 'cancelled';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type ReportTargetType = 'post' | 'comment' | 'event' | 'member';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'finalized' | 'cancelled';
export type CommunityRequestStatus = 'pending' | 'approved' | 'rejected';

export interface RoleOffer {
  _id: string;
  communityId: string;
  communityName?: string;
  userId: string;
  targetRole: 'moderator' | 'communityAdmin';
  offeredBy: string;
  offeredByName?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
}

export interface UserPrivacySettings {
  profilePhoto: 'public' | 'private';
  bio: 'public' | 'private';
  hometown: 'public' | 'private';
  otherProfileDetails: 'public' | 'private';
}

export interface Persona {
  id: string;
  name: string;
  username: string;
  easyPassword?: string;
  password?: string;
  roleBadge: string;
  roleDescription: string;
  user?: User;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  bio?: string;
  hometown?: string;
  privacySettings: UserPrivacySettings;
  platformRole: PlatformRole;
  accountStatus: 'active' | 'suspended';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface LocationInfo {
  _id: string;
  country: string;
  state: string;
  district: string;
  townOrLocality: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  _id: string;
  name: string;
  slug: string;
  locationId: string;
  location: LocationInfo;
  description: string;
  profileImage?: string;
  coverImage?: string;
  memberCount: number;
  status: 'active' | 'pending' | 'archived';
  adminCount: number;
  moderatorCount: number;
  contactEmail?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  myMembership?: CommunityMembership | null;
  admins?: User[];
  moderators?: User[];
  isAdminless?: boolean;
}

export interface CommunityMembership {
  _id: string;
  userId: string;
  user?: User;
  communityId: string;
  role: CommunityRole;
  membershipStatus: MembershipStatus;
  verificationMethod?: 'phone' | 'in_person' | 'email' | 'document_proof' | 'other';
  verificationNotes?: string;
  joinedAt: string;
  bannedAt?: string;
  bannedBy?: string;
  banReason?: string;
  leftAt?: string;
}

export interface Post {
  _id: string;
  communityId: string;
  communityName?: string;
  authorId: string;
  author?: User;
  title: string;
  content: string;
  category: PostCategory;
  media: string[];
  isPinned: boolean;
  visibility: 'public' | 'private';
  status: 'active' | 'deleted';
  deletedBy?: string;
  deletedByRole?: 'author' | 'moderator' | 'communityAdmin';
  deletedAt?: string;
  likeCount: number;
  commentCount: number;
  userReaction?: ReactionType | null;
  reactionsSummary?: Record<ReactionType, number>;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  authorId: string;
  author?: User;
  parentCommentId?: string | null;
  content: string;
  status: 'active' | 'deleted';
  deletedBy?: string;
  deletedByRole?: 'author' | 'moderator' | 'communityAdmin';
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface Reaction {
  _id: string;
  userId: string;
  postId: string;
  reactionType: ReactionType;
  createdAt: string;
}

export interface Event {
  _id: string;
  communityId: string;
  communityName?: string;
  createdBy: string;
  creator?: User;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  coverImage?: string;
  capacity?: number;
  status: EventStatus;
  approvalStatus: EventApprovalStatus;
  approvedBy?: string;
  approvedByRole?: 'communityAdmin' | 'platformAdmin' | 'moderator';
  reviewedByModerator?: string;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
  waitlistCount?: number;
  userRsvp?: ParticipationStatus | null;
}

export interface EventParticipant {
  _id: string;
  eventId: string;
  userId: string;
  user?: User;
  participationStatus: ParticipationStatus;
  joinedAt: string;
  cancelledAt?: string;
}

export interface AppNotification {
  _id: string;
  recipientId: string;
  type: 
    | 'event_approved' 
    | 'event_rejected' 
    | 'event_proposal'
    | 'waitlist_promoted'
    | 'comment_reply' 
    | 'post_reaction'
    | 'community_announcement' 
    | 'membership_approved'
    | 'membership_rejected'
    | 'membership_requested'
    | 'admin_invitation'
    | 'role_offer'
    | 'role_changed'
    | 'co_admin_action'
    | 'content_moderated';
  title: string;
  message: string;
  referenceType?: 'community' | 'post' | 'comment' | 'event' | 'invitation' | 'role_offer';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface Report {
  _id: string;
  reporterId: string;
  reporter?: User;
  targetType: ReportTargetType;
  targetId: string;
  targetSnippet?: string;
  communityId: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
  createdAt: string;
}

export interface CommunityCreationRequest {
  _id: string;
  requestedBy: string;
  requester?: User;
  proposedCommunityName: string;
  location: {
    country: string;
    state: string;
    district: string;
    townOrLocality: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  description: string;
  status: CommunityRequestStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  similarityWarning?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface CommunityAdminInvitation {
  _id: string;
  communityId: string;
  community?: Community;
  invitedUserId: string;
  invitedUser?: User;
  invitedByPlatformAdmin: string;
  status: InvitationStatus;
  acceptedAt?: string;
  finalizedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actorId: string;
  actor?: User;
  action: string;
  targetType: string;
  targetId: string;
  communityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
