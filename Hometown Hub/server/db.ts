import fs from 'fs';
import path from 'path';
import { SEED_DATA } from './seedData.ts';
import { syncToMongoDB, syncAllToMongoDB, loadStateFromMongoDB, isMongoConnected } from './mongo.ts';

export interface DBState {
  users: any[];
  locations: any[];
  communities: any[];
  communityMemberships: any[];
  posts: any[];
  comments: any[];
  reactions: any[];
  events: any[];
  eventParticipants: any[];
  notifications: any[];
  reports: any[];
  communityCreationRequests: any[];
  communityAdminInvitations: any[];
  roleOffers: any[];
  roleRequests: any[];
  auditLogs: any[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'hometownhub-db.json');

class Database {
  private state: DBState;

  constructor() {
    this.state = this.loadOrInit();
  }

  private loadOrInit(): DBState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.roleOffers) parsed.roleOffers = [];
        if (!parsed.roleRequests) parsed.roleRequests = [];
        // Ensure all users have valid password / passwordHash
        if (Array.isArray(parsed.users)) {
          parsed.users.forEach((u: any) => {
            if (!u.password) {
              const seedMatch = (SEED_DATA.users as any[]).find(su => su._id === u._id || su.username === u.username);
              u.password = seedMatch?.password || `${u.username || 'user'}123`;
              u.passwordHash = u.password;
            }
          });
        }

        // Ensure missing seeded memberships exist
        if (Array.isArray(parsed.communityMemberships)) {
          (SEED_DATA.communityMemberships as any[]).forEach(sm => {
            const exists = parsed.communityMemberships.some((m: any) => m._id === sm._id || (m.userId === sm.userId && m.communityId === sm.communityId));
            if (!exists) {
              parsed.communityMemberships.push(sm);
            }
          });
        }

        // Auto-recalculate accurate memberCount, adminCount, moderatorCount
        if (Array.isArray(parsed.communities) && Array.isArray(parsed.communityMemberships)) {
          parsed.communities.forEach((comm: any) => {
            const activeMembers = parsed.communityMemberships.filter((m: any) => m.communityId === comm._id && m.membershipStatus === 'active');
            comm.memberCount = activeMembers.length;
            comm.adminCount = activeMembers.filter((m: any) => m.role === 'communityAdmin').length;
            comm.moderatorCount = activeMembers.filter((m: any) => m.role === 'moderator').length;
          });
        }

        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing from seed data:', e);
    }
    const fresh = JSON.parse(JSON.stringify(SEED_DATA));
    if (!fresh.roleOffers) fresh.roleOffers = [];
    this.save(fresh);
    return fresh;
  }

  public save(newState?: DBState) {
    if (newState) {
      this.state = newState;
    }
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database file:', e);
    }
    syncAllToMongoDB(this.state).catch(() => {});
  }

  public async hydrateFromMongo() {
    const mongoData = await loadStateFromMongoDB();
    if (mongoData && Array.isArray(mongoData.users) && mongoData.users.length > 0) {
      // Retain locations if not in mongo
      if (!mongoData.locations || mongoData.locations.length === 0) {
        mongoData.locations = this.state.locations || SEED_DATA.locations || [];
      }
      this.state = mongoData;
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
      } catch (e) {
        console.error('Failed to write hydrated file:', e);
      }
      console.log('⚡ DB State successfully hydrated from connected MongoDB database!');
    } else {
      // MongoDB is connected but empty — seed local data into MongoDB
      console.log('🌱 MongoDB collections are empty; seeding local data into connected MongoDB database...');
      await syncAllToMongoDB(this.state);
      console.log('✅ Local data successfully synced to MongoDB!');
    }
  }

  public resetToSeed() {
    this.state = JSON.parse(JSON.stringify(SEED_DATA));
    this.save();
    return this.state;
  }

  // --- Collection Accessors ---
  public get users() { return this.state.users; }
  public get locations() { return this.state.locations; }
  public get communities() { return this.state.communities; }
  public get communityMemberships() { return this.state.communityMemberships; }
  public get posts() { return this.state.posts; }
  public get comments() { return this.state.comments; }
  public get reactions() { return this.state.reactions; }
  public get events() { return this.state.events; }
  public get eventParticipants() { return this.state.eventParticipants; }
  public get notifications() { return this.state.notifications; }
  public get reports() { return this.state.reports; }
  public get communityCreationRequests() { return this.state.communityCreationRequests; }
  public get communityAdminInvitations() { return this.state.communityAdminInvitations; }
  public get roleOffers() { if (!this.state.roleOffers) this.state.roleOffers = []; return this.state.roleOffers; }
  public get roleRequests() { if (!this.state.roleRequests) this.state.roleRequests = []; return this.state.roleRequests; }
  public get auditLogs() { return this.state.auditLogs; }

  // --- Helpers ---
  public getUserById(id: string) {
    return this.users.find(u => u._id === id);
  }

  public getLocationById(id: string) {
    return this.locations.find(l => l._id === id);
  }

  public getCommunityByIdOrSlug(idOrSlug: string) {
    return this.communities.find(c => c._id === idOrSlug || c.slug === idOrSlug);
  }

  public getMembership(userId: string, communityId: string) {
    return this.communityMemberships.find(m => m.userId === userId && m.communityId === communityId);
  }

  public getActiveRole(userId: string, communityId: string): 'platformAdmin' | 'communityAdmin' | 'moderator' | 'member' | 'guest' {
    const user = this.getUserById(userId);
    if (!user) return 'guest';
    if (user.platformRole === 'platformAdmin') return 'platformAdmin';
    const mem = this.getMembership(userId, communityId);
    if (!mem || mem.membershipStatus !== 'active') return 'guest';
    return mem.role;
  }

  public createAuditLog(actorId: string, action: string, targetType: string, targetId: string, communityId?: string, metadata?: any) {
    const log = {
      _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId,
      action,
      targetType,
      targetId,
      communityId,
      metadata,
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    this.save();
    syncToMongoDB('auditLogs', 'insert', log).catch(() => {});
    return log;
  }

  public createNotification(recipientId: string, type: any, title: string, message: string, referenceType?: any, referenceId?: string) {
    const notif = {
      _id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipientId,
      userId: recipientId,
      type,
      title,
      message,
      referenceType,
      referenceId,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(notif);
    this.save();
    syncToMongoDB('notifications', 'insert', notif).catch(() => {});
    return notif;
  }

  public updateCommunityCounts(communityId: string) {
    const comm = this.communities.find(c => c._id === communityId);
    if (!comm) return;
    const activeMembers = this.communityMemberships.filter(m => m.communityId === communityId && m.membershipStatus === 'active');
    comm.memberCount = activeMembers.length;
    comm.adminCount = activeMembers.filter(m => m.role === 'communityAdmin').length;
    comm.moderatorCount = activeMembers.filter(m => m.role === 'moderator').length;
    this.save();
    syncToMongoDB('communities', 'update', comm).catch(() => {});
  }

  // --- Duplicate & Similarity Checks (Section 3.2, 46, 55) ---
  public checkLocalityUniqueness(country: string, state: string, district: string, townOrLocality: string, excludeCommunityId?: string) {
    const norm = (s: string) => (s || '').trim().toLowerCase();
    
    // Check existing active communities
    const existingCommunity = this.communities.find(c => {
      if (excludeCommunityId && c._id === excludeCommunityId) return false;
      const loc = this.getLocationById(c.locationId);
      if (!loc) return false;
      return norm(loc.country) === norm(country) &&
             norm(loc.state) === norm(state) &&
             norm(loc.district) === norm(district) &&
             norm(loc.townOrLocality) === norm(townOrLocality);
    });

    if (existingCommunity) {
      return { isDuplicate: true, existingCommunity };
    }

    // Check similarity flag
    let similarCommunity = null;
    for (const c of this.communities) {
      const loc = this.getLocationById(c.locationId);
      if (!loc) continue;
      if (norm(loc.country) === norm(country) && norm(loc.state) === norm(state)) {
        if (norm(c.name).includes(norm(townOrLocality)) || norm(townOrLocality).includes(norm(c.name))) {
          similarCommunity = c;
          break;
        }
      }
    }

    return { isDuplicate: false, similarCommunity };
  }
}

export const db = new Database();
