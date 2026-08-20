import mongoose from 'mongoose';
import {
  UserModel,
  CommunityModel,
  CommunityMembershipModel,
  PostModel,
  CommentModel,
  ReactionModel,
  EventModel,
  EventParticipantModel,
  RoleOfferModel,
  CommunityAdminInvitationModel,
  CommunityCreationRequestModel,
  ReportModel,
  AuditLogModel,
  NotificationModel
} from './models/index.ts';
import { SEED_DATA } from './seedData.ts';

let isConnected = false;
let connectionAttempted = false;

export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️ MONGODB_URI not provided; Hometown Hub is operating in high-performance embedded state mode with active MongoDB Model support.');
    return false;
  }

  try {
    const dbName = process.env.MONGODB_DB_NAME || 'hometown_hub';
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`✅ Successfully connected to MongoDB database: "${dbName}"`);

    // Ensure all indexes are generated
    await Promise.allSettled([
      UserModel.createIndexes(),
      CommunityModel.createIndexes(),
      CommunityMembershipModel.createIndexes(),
      PostModel.createIndexes(),
      CommentModel.createIndexes(),
      ReactionModel.createIndexes(),
      EventModel.createIndexes(),
      EventParticipantModel.createIndexes(),
      RoleOfferModel.createIndexes(),
      CommunityAdminInvitationModel.createIndexes(),
      CommunityCreationRequestModel.createIndexes(),
      ReportModel.createIndexes(),
      AuditLogModel.createIndexes(),
      NotificationModel.createIndexes()
    ]);

    // Seed database if empty
    await seedMongoDBIfEmpty();

    return true;
  } catch (err: any) {
    console.warn(`⚠️ Could not connect to external MongoDB instance at "${uri}":`, err.message);
    isConnected = false;
    return false;
  } finally {
    connectionAttempted = true;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function seedMongoDBIfEmpty(currentState?: any) {
  if (!isMongoConnected()) return;

  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial Hometown Hub collections into MongoDB...');
      const source = (currentState && Array.isArray(currentState.users) && currentState.users.length > 0)
        ? currentState
        : SEED_DATA;

      // 1. Users
      if (source.users?.length) {
        await UserModel.insertMany(source.users as any);
      }

      // 2. Communities
      if (source.communities?.length) {
        await CommunityModel.insertMany(source.communities as any);
      }

      // 3. Memberships
      if (source.communityMemberships?.length) {
        await CommunityMembershipModel.insertMany(source.communityMemberships as any);
      }

      // 4. Posts
      if (source.posts?.length) {
        await PostModel.insertMany(source.posts as any);
      }

      // 5. Comments
      if (source.comments?.length) {
        await CommentModel.insertMany(source.comments as any);
      }

      // 6. Reactions
      if (source.reactions?.length) {
        await ReactionModel.insertMany(source.reactions as any);
      }

      // 7. Events
      if (source.events?.length) {
        await EventModel.insertMany(source.events as any);
      }

      // 8. Event Participants
      if (source.eventParticipants?.length) {
        await EventParticipantModel.insertMany(source.eventParticipants as any);
      }

      // 9. Role Offers
      if (source.roleOffers?.length) {
        await RoleOfferModel.insertMany(source.roleOffers as any);
      }

      // 10. Creation Requests
      if (source.communityCreationRequests?.length) {
        await CommunityCreationRequestModel.insertMany(source.communityCreationRequests as any);
      }

      // 11. Admin Invitations
      if (source.communityAdminInvitations?.length) {
        await CommunityAdminInvitationModel.insertMany(source.communityAdminInvitations as any);
      }

      // 12. Reports
      if (source.reports?.length) {
        await ReportModel.insertMany(source.reports as any);
      }

      // 13. Audit Logs
      if (source.auditLogs?.length) {
        await AuditLogModel.insertMany(
          source.auditLogs.map((l: any) => ({
            ...l,
            timestamp: l.createdAt || l.timestamp || new Date()
          })) as any
        );
      }

      // 14. Notifications
      if (source.notifications?.length) {
        await NotificationModel.insertMany(
          source.notifications.map((n: any) => ({
            ...n,
            userId: n.userId || n.recipientId
          })) as any
        );
      }

      console.log('✅ Hometown Hub MongoDB collections successfully seeded!');
    }
  } catch (err: any) {
    console.error('Error seeding MongoDB collections:', err);
  }
}

/**
 * Synchronize any local mutation into MongoDB collections asynchronously
 */
export async function syncToMongoDB(collectionName: string, action: 'insert' | 'update' | 'delete', doc: any) {
  if (!isMongoConnected() || !doc) return;

  try {
    const id = doc._id || doc.id;
    if (!id && action !== 'insert') return;

    const models: Record<string, mongoose.Model<any>> = {
      users: UserModel,
      communities: CommunityModel,
      communityMemberships: CommunityMembershipModel,
      posts: PostModel,
      comments: CommentModel,
      reactions: ReactionModel,
      events: EventModel,
      eventParticipants: EventParticipantModel,
      roleOffers: RoleOfferModel,
      communityAdminInvitations: CommunityAdminInvitationModel,
      communityCreationRequests: CommunityCreationRequestModel,
      reports: ReportModel,
      auditLogs: AuditLogModel,
      notifications: NotificationModel
    };

    const targetModel = models[collectionName];
    if (!targetModel) return;

    if (action === 'delete') {
      await targetModel.deleteOne({ _id: id });
    } else {
      await targetModel.updateOne({ _id: id }, { $set: doc }, { upsert: true });
    }
  } catch (err: any) {
    console.error(`MongoDB sync error for ${collectionName}:`, err.message);
  }
}

/**
 * Bulk synchronize all current DB state collections to MongoDB
 */
export async function syncAllToMongoDB(state: any) {
  if (!isMongoConnected() || !state) return;

  try {
    const collections: [string, mongoose.Model<any>][] = [
      ['users', UserModel],
      ['communities', CommunityModel],
      ['communityMemberships', CommunityMembershipModel],
      ['posts', PostModel],
      ['comments', CommentModel],
      ['reactions', ReactionModel],
      ['events', EventModel],
      ['eventParticipants', EventParticipantModel],
      ['roleOffers', RoleOfferModel],
      ['communityAdminInvitations', CommunityAdminInvitationModel],
      ['communityCreationRequests', CommunityCreationRequestModel],
      ['reports', ReportModel],
      ['auditLogs', AuditLogModel],
      ['notifications', NotificationModel]
    ];

    for (const [key, model] of collections) {
      const items = state[key];
      if (Array.isArray(items) && items.length > 0) {
        const ops = items.map(doc => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true
          }
        }));
        await model.bulkWrite(ops, { ordered: false }).catch(() => {});
      }
    }
  } catch (err: any) {
    console.error('MongoDB syncAll error:', err.message);
  }
}

/**
 * Load and format state from connected MongoDB database collections
 */
export async function loadStateFromMongoDB(): Promise<any | null> {
  if (!isMongoConnected()) return null;

  try {
    const [
      users,
      communities,
      communityMemberships,
      posts,
      comments,
      reactions,
      events,
      eventParticipants,
      roleOffers,
      communityAdminInvitations,
      communityCreationRequests,
      reports,
      auditLogs,
      notifications
    ] = await Promise.all([
      UserModel.find().lean(),
      CommunityModel.find().lean(),
      CommunityMembershipModel.find().lean(),
      PostModel.find().lean(),
      CommentModel.find().lean(),
      ReactionModel.find().lean(),
      EventModel.find().lean(),
      EventParticipantModel.find().lean(),
      RoleOfferModel.find().lean(),
      CommunityAdminInvitationModel.find().lean(),
      CommunityCreationRequestModel.find().lean(),
      ReportModel.find().lean(),
      AuditLogModel.find().lean(),
      NotificationModel.find().lean()
    ]);

    return {
      users: users as any[],
      locations: SEED_DATA.locations || [],
      communities: communities as any[],
      communityMemberships: communityMemberships as any[],
      posts: posts as any[],
      comments: comments as any[],
      reactions: reactions as any[],
      events: events as any[],
      eventParticipants: eventParticipants as any[],
      roleOffers: roleOffers as any[],
      roleRequests: [],
      communityCreationRequests: communityCreationRequests as any[],
      communityAdminInvitations: communityAdminInvitations as any[],
      reports: reports as any[],
      auditLogs: auditLogs as any[],
      notifications: notifications as any[]
    };
  } catch (err: any) {
    console.error('Error reading collections from MongoDB:', err.message);
    return null;
  }
}

