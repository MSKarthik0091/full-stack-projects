import { User, Community, Post, Comment, Event, AppNotification, Report, CommunityCreationRequest, CommunityAdminInvitation, RoleOffer, AuditLog, Persona } from './types.ts';

let currentUserIdHeader = localStorage.getItem('hometown_hub_user_id') || 'user-arun-admin';
let currentAuthToken = localStorage.getItem('hometown_hub_jwt') || '';

export function setAuthToken(token: string | null) {
  if (token) {
    currentAuthToken = token;
    localStorage.setItem('hometown_hub_jwt', token);
  } else {
    currentAuthToken = '';
    localStorage.removeItem('hometown_hub_jwt');
  }
}

export function setCurrentUserIdHeader(userId: string | null) {
  if (userId) {
    currentUserIdHeader = userId;
    localStorage.setItem('hometown_hub_user_id', userId);
  } else {
    currentUserIdHeader = '';
    localStorage.removeItem('hometown_hub_user_id');
  }
}

export function getCurrentUserIdHeader(): string {
  return currentUserIdHeader;
}

export function getAuthToken(): string {
  return currentAuthToken;
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(currentUserIdHeader ? { 'x-user-id': currentUserIdHeader } : {}),
    ...(currentAuthToken ? { 'Authorization': `Bearer ${currentAuthToken}` } : {}),
    ...((options.headers as any) || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    let data: any = {};
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }
    return data as T;
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  // Auth & Personas
  getMe: () => fetchJson<{ user: User; memberships: any[] }>('/api/auth/me'),
  getPersonas: () => fetchJson<{ personas: Persona[]; currentUserId: string }>('/api/auth/personas'),
  login: async (data: { identifier: string; password?: string }) => {
    const res = await fetchJson<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) setAuthToken(res.token);
    if (res.user?._id) setCurrentUserIdHeader(res.user._id);
    return res;
  },
  logout: async () => {
    try {
      await fetchJson<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthToken(null);
    setCurrentUserIdHeader(null);
    return { success: true };
  },
  switchUser: async (userId: string) => {
    setCurrentUserIdHeader(userId);
    const res = await fetchJson<{ success: boolean; token?: string; user: User }>('/api/auth/switch-user', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },
  register: async (data: any) => {
    const res = await fetchJson<{ success?: boolean; token?: string; user: User }>('/api/auth/register', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
    if (res.token) setAuthToken(res.token);
    if (res.user?._id) setCurrentUserIdHeader(res.user._id);
    return res;
  },

  // Users & Profile
  getUser: (id: string) => fetchJson<{ user: User }>(`/api/users/${id}`),
  updateProfile: (data: Partial<User>) => fetchJson<{ user: User }>('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Media Upload (Section 78.2 & 1486-1488)
  uploadMedia: (dataUrl: string, filename?: string) =>
    fetchJson<{ success: boolean; url: string; filename: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, filename })
    }),

  // Communities
  getCommunities: (params?: { search?: string; country?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ communities: Community[] }>(`/api/communities${qs ? `?${qs}` : ''}`);
  },
  getCommunity: (idOrSlug: string) => fetchJson<{ community: any }>(`/api/communities/${idOrSlug}`),
  getCommunityById: (idOrSlug: string) => fetchJson<{ community: any }>(`/api/communities/${idOrSlug}`),
  updateCommunityBranding: (communityId: string, data: { profileImage?: string; coverImage?: string }) =>
    fetchJson<{ success: boolean; community: any }>(`/api/communities/${communityId}/branding`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getCommunityDirectory: (communityId: string) => fetchJson<{ directory: any[]; total: number }>(`/api/communities/${communityId}/directory`),
  joinCommunity: (communityId: string, data?: { verificationMethod?: string; verificationNotes?: string }) =>
    fetchJson<{ success: boolean; membership: any }>(`/api/communities/${communityId}/join`, { method: 'POST', body: JSON.stringify(data || {}) }),
  cancelJoinRequest: (communityId: string) =>
    fetchJson<{ success: boolean; message?: string }>(`/api/communities/${communityId}/cancel-join`, { method: 'POST' }),
  leaveCommunity: (communityId: string) =>
    fetchJson<{ success: boolean }>(`/api/communities/${communityId}/leave`, { method: 'POST' }),
  resignAdmin: (communityId: string) =>
    fetchJson<{ success: boolean; isAdminless: boolean; message?: string }>(`/api/communities/${communityId}/resign-admin`, { method: 'POST' }),
  stepDownRole: (communityId: string, data: { targetRole: 'moderator' | 'member'; force?: boolean }) =>
    fetchJson<{ success: boolean; warningRequired?: boolean; isLastAdmin?: boolean; message?: string; newRole?: string; isAdminless?: boolean }>(`/api/communities/${communityId}/step-down`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  requestRole: (communityId: string, data: { requestedRole: 'moderator' | 'communityAdmin'; reason?: string }) =>
    fetchJson<{ success: boolean; message: string }>(`/api/communities/${communityId}/request-role`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getRoleRequests: (communityId: string) =>
    fetchJson<{ roleRequests: any[] }>(`/api/communities/${communityId}/role-requests`),
  reviewRoleRequest: (communityId: string, requestId: string, action: 'approve' | 'reject') =>
    fetchJson<{ success: boolean; request: any }>(`/api/communities/${communityId}/role-requests/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action })
    }),
  getAdminRoleRequests: () =>
    fetchJson<{ adminRequests: any[] }>('/api/admin/community-admin-requests'),
  reviewAdminRoleRequest: (requestId: string, action: 'approve' | 'reject') =>
    fetchJson<{ success: boolean; request: any }>(`/api/admin/community-admin-requests/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action })
    }),

  // Role Offers (Section 7.1: Promotion Acceptance Workflow)
  getRoleOffers: () => fetchJson<{ roleOffers: RoleOffer[] }>('/api/role-offers'),
  respondRoleOffer: (id: string, response: 'accept' | 'decline') =>
    fetchJson<{ success: boolean; message: string; role?: string }>(`/api/role-offers/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response })
    }),

  // Community Admin & Moderation
  getCommunityMembers: (communityId: string, status?: string) =>
    fetchJson<{ members: any[] }>(`/api/communities/${communityId}/members${status ? `?status=${status}` : ''}`),
  verifyMembership: (communityId: string, userId: string, data: { action: 'approve' | 'reject'; verificationMethod?: string; notes?: string }) =>
    fetchJson<{ success: boolean; membership: any }>(`/api/communities/${communityId}/members/${userId}/verify`, { method: 'POST', body: JSON.stringify(data) }),
  promoteCoAdmin: (communityId: string, userId: string) =>
    fetchJson<{ success: boolean; message: string; offer?: RoleOffer }>(`/api/communities/${communityId}/members/${userId}/promote-co-admin`, { method: 'POST' }),
  promoteModerator: (communityId: string, userId: string) =>
    fetchJson<{ success: boolean; message: string; offer?: RoleOffer }>(`/api/communities/${communityId}/members/${userId}/promote-mod`, { method: 'POST' }),
  removeModerator: (communityId: string, userId: string) =>
    fetchJson<{ success: boolean; message: string }>(`/api/communities/${communityId}/members/${userId}/remove-mod`, { method: 'POST' }),
  banMember: (communityId: string, userId: string, reason?: string) =>
    fetchJson<{ success: boolean; message: string }>(`/api/communities/${communityId}/members/${userId}/ban`, { method: 'POST', body: JSON.stringify({ reason }) }),
  unbanMember: (communityId: string, userId: string) =>
    fetchJson<{ success: boolean; message: string }>(`/api/communities/${communityId}/members/${userId}/unban`, { method: 'POST' }),

  // Community Creation Requests & Platform Admin
  getCommunityRequests: () => fetchJson<{ requests: CommunityCreationRequest[] }>('/api/community-requests'),
  createCommunityRequest: (data: any) =>
    fetchJson<{ success: boolean; request: CommunityCreationRequest }>('/api/community-requests', { method: 'POST', body: JSON.stringify(data) }),
  reviewCommunityRequest: (id: string, data: { action: 'approve' | 'reject'; reviewNotes?: string; initialAdminUserId?: string }) =>
    fetchJson<{ success: boolean; request: any }>(`/api/community-requests/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  getAdminlessCommunities: () => fetchJson<{ adminless: any[] }>('/api/admin/adminless-communities'),
  getAdminInvitations: () => fetchJson<{ invitations: CommunityAdminInvitation[] }>('/api/admin/invitations'),
  inviteCommunityAdmin: (communityId: string, invitedUserId: string) =>
    fetchJson<{ success: boolean; invitation: any }>('/api/admin/invite-community-admin', { method: 'POST', body: JSON.stringify({ communityId, invitedUserId }) }),
  respondAdminInvitation: (invitationId: string, response: 'accept' | 'reject') =>
    fetchJson<{ success: boolean; invitation: any }>(`/api/admin/invitations/${invitationId}/respond`, { method: 'POST', body: JSON.stringify({ response }) }),
  finalizeAdminInvitation: (invitationId: string) =>
    fetchJson<{ success: boolean; message: string; invitation: any }>(`/api/admin/invitations/${invitationId}/finalize`, { method: 'POST' }),
  getAllUsers: () => fetchJson<{ users: User[] }>('/api/admin/users'),
  assignCommunityAdmin: (communityId: string, userId: string) =>
    fetchJson<{ success: boolean; message: string }>('/api/admin/assign-community-admin', { method: 'POST', body: JSON.stringify({ communityId, userId }) }),

  // Posts & Comments
  getPosts: (params?: { communityId?: string; category?: string; search?: string; authorId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ posts: Post[] }>(`/api/posts${qs ? `?${qs}` : ''}`);
  },
  createPost: (data: any) => fetchJson<{ success: boolean; post: Post }>('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id: string, data: any) => fetchJson<{ success: boolean; post: Post }>(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePost: (id: string) => fetchJson<{ success: boolean }>(`/api/posts/${id}`, { method: 'DELETE' }),
  restorePost: (id: string) => fetchJson<{ success: boolean; post: Post }>(`/api/posts/${id}/restore`, { method: 'POST' }),
  getTrashPosts: (communityId?: string) => fetchJson<{ trash: any[] }>(`/api/posts/trash${communityId ? `?communityId=${communityId}` : ''}`),

  getComments: (postId: string) => fetchJson<{ comments: Comment[] }>(`/api/posts/${postId}/comments`),
  createComment: (postId: string, data: { content: string; parentCommentId?: string | null }) =>
    fetchJson<{ success: boolean; comment: Comment }>(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  deleteComment: (id: string) => fetchJson<{ success: boolean }>(`/api/comments/${id}`, { method: 'DELETE' }),

  toggleReaction: (postId: string, reactionType: string) =>
    fetchJson<{ success: boolean; likeCount: number; userReaction: string | null; reactionsSummary: Record<string, number> }>(`/api/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ reactionType })
    }),

  // Events
  getEvents: (params?: { communityId?: string; status?: string; upcomingOnly?: boolean }) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ events: Event[] }>(`/api/events${qs ? `?${qs}` : ''}`);
  },
  createEvent: (data: any) => fetchJson<{ success: boolean; event: Event }>('/api/events', { method: 'POST', body: JSON.stringify(data) }),
  approveEvent: (id: string) => fetchJson<{ success: boolean; event: Event }>(`/api/events/${id}/approve`, { method: 'POST' }),
  rejectEvent: (id: string) => fetchJson<{ success: boolean; event: Event }>(`/api/events/${id}/reject`, { method: 'POST' }),
  rsvpEvent: (id: string, participationStatus: 'going' | 'interested' | 'cancelled') =>
    fetchJson<{ success: boolean; message?: string; participantCount: number; waitlistCount?: number; userRsvp: any }>(`/api/events/${id}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ participationStatus })
    }),

  // Notifications
  getNotifications: () => fetchJson<{ notifications: AppNotification[]; unreadCount: number }>('/api/notifications'),
  markNotificationRead: (id: string) => fetchJson<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => fetchJson<{ success: boolean }>('/api/notifications/mark-all-read', { method: 'POST' }),

  // Reports
  getReports: (communityId?: string) => fetchJson<{ reports: Report[] }>(`/api/reports${communityId ? `?communityId=${communityId}` : ''}`),
  createReport: (data: any) => fetchJson<{ success: boolean; report: Report }>('/api/reports', { method: 'POST', body: JSON.stringify(data) }),
  resolveReport: (id: string, data: { action: 'delete_content' | 'no_action'; resolution?: string }) =>
    fetchJson<{ success: boolean; report: Report }>(`/api/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: (communityId?: string) => fetchJson<{ logs: AuditLog[] }>(`/api/audit-logs${communityId ? `?communityId=${communityId}` : ''}`),

  // Database Diagnostic Status
  getDbStatus: () => fetchJson<{ engine: string; mongoConnected: boolean; collections: Record<string, number> }>('/api/db-status'),

  // Reset
  resetDb: () => fetchJson<{ success: boolean; message: string }>('/api/reset-db', { method: 'POST' })
};
