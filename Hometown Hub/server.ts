import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { connectMongoDB, isMongoConnected, syncToMongoDB, syncAllToMongoDB } from './server/mongo.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'hometown_hub_jwt_super_secret_key_2026_secure_random_string_dev';

async function startServer() {
  const app = express();
  // const PORT = 5000;
  const PORT = Number(process.env.PORT) || 5000;

  // Initialize MongoDB connection if MONGODB_URI is provided
  await connectMongoDB().then(async (connected) => {
    if (connected) {
      await db.hydrateFromMongo();
    }
  }).catch(err => console.error('MongoDB init caught error:', err));

  // Support JSON bodies with file uploads up to 25mb
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Static directory for uploaded media (Section 78.2 & 1486-1488)
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  const POSTS_UPLOADS_DIR = path.join(UPLOADS_DIR, 'posts');
  if (!fs.existsSync(POSTS_UPLOADS_DIR)) {
    fs.mkdirSync(POSTS_UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Current session simulation (default logged in as Arun Kumar, Besant Nagar Admin)
  let currentUserId = 'user-arun-admin';

  // Helper middleware to attach current user (supports JWT Bearer tokens and x-user-id header)
  app.use((req, res, next) => {
    const bearerHeader = req.headers['authorization'] as string;
    const authHeader = req.headers['x-user-id'] as string;

    if (bearerHeader && bearerHeader.startsWith('Bearer ')) {
      const token = bearerHeader.substring(7).trim();
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded && decoded.userId && db.getUserById(decoded.userId)) {
          currentUserId = decoded.userId;
        }
      } catch (err) {
        // Invalid or expired token; fallback to session or header
      }
    } else if (authHeader && db.getUserById(authHeader)) {
      currentUserId = authHeader;
    }
    
    (req as any).currentUser = db.getUserById(currentUserId) || db.users[0];
    next();
  });

  // --- API Routes ---

  // Issue signed JWT token for user authentication (Section 2 & 10)
  app.post('/api/auth/token', (req, res) => {
    const { userId } = req.body;
    const targetId = userId || currentUserId;
    const user = db.getUserById(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        platformRole: user.platformRole,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      mongoConnected: isMongoConnected()
    });
  });

  // Database Diagnostic & Connection Status Endpoint
  app.get('/api/db-status', (req, res) => {
    res.json({
      engine: isMongoConnected() ? 'MongoDB (Atlas / Instance)' : 'Embedded Reactive Data Layer',
      mongoConnected: isMongoConnected(),
      collections: {
        users: db.users.length,
        communities: db.communities.length,
        communityMemberships: db.communityMemberships.length,
        posts: db.posts.length,
        comments: db.comments.length,
        reactions: db.reactions.length,
        events: db.events.length,
        eventParticipants: db.eventParticipants.length,
        roleOffers: db.roleOffers.length,
        communityAdminInvitations: db.communityAdminInvitations.length,
        communityCreationRequests: db.communityCreationRequests.length,
        reports: db.reports.length,
        auditLogs: db.auditLogs.length,
        notifications: db.notifications.length
      }
    });
  });

  // Media Upload Endpoint (Section 78.2 & 1486-1488)
  app.post('/api/upload', (req, res) => {
    try {
      const { dataUrl, filename, mimeType } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'dataUrl is required for upload' });
      }

      // Check if dataUrl is a base64 string
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = 'jpg';
      let buffer: Buffer;

      if (matches && matches.length === 3) {
        const detectedMime = matches[1];
        if (detectedMime.includes('png')) ext = 'png';
        else if (detectedMime.includes('webp')) ext = 'webp';
        else if (detectedMime.includes('gif')) ext = 'gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(dataUrl, 'base64');
      }

      const safeName = filename ? path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_') : `photo-${Date.now()}.${ext}`;
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${safeName}`;
      const filePath = path.join(POSTS_UPLOADS_DIR, uniqueFileName);
      
      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/posts/${uniqueFileName}`;
      
      res.json({ success: true, url: publicUrl, filename: uniqueFileName });
    } catch (e: any) {
      console.error('Failed to save uploaded file:', e);
      res.status(500).json({ error: 'Failed to process media upload' });
    }
  });

  // 1. Auth & Persona Switcher
  app.get('/api/auth/me', (req, res) => {
    const user = (req as any).currentUser;
    const memberships = db.communityMemberships
      .filter(m => m.userId === user._id)
      .map(m => {
        const comm = db.getCommunityByIdOrSlug(m.communityId);
        return { ...m, community: comm };
      });
    res.json({ user, memberships });
  });

  // Force sync local data to MongoDB
  app.post('/api/admin/sync-mongo', async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(400).json({ error: 'MongoDB is not connected' });
      }
      await syncAllToMongoDB(db['state']);
      res.json({ success: true, message: 'Local data successfully pushed to MongoDB!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/auth/personas', (req, res) => {
    const personaConfigs = [
      {
        id: 'user-platform-admin',
        name: 'Platform Admin',
        username: 'admin',
        easyPassword: 'admin123',
        roleBadge: 'Platform Admin',
        roleDescription: 'Global Platform Admin (Community Approvals & Orphan Recovery)',
      },
      {
        id: 'user-arun-admin',
        name: 'Arun Kumar',
        username: 'arunkumar',
        easyPassword: 'arun123',
        roleBadge: 'Community Admin',
        roleDescription: 'Besant Nagar Community Admin (Co-Admin with Priya)',
      },
      {
        id: 'user-priya-admin',
        name: 'Priya Sundaram',
        username: 'priya_s',
        easyPassword: 'priya123',
        roleBadge: 'Community Co-Admin',
        roleDescription: 'Besant Nagar Co-Admin (Equal authority, Environmental advocate)',
      },
      {
        id: 'user-karthik-mod',
        name: 'Karthik Raman',
        username: 'karthik_r',
        easyPassword: 'karthik123',
        roleBadge: 'Moderator',
        roleDescription: 'Besant Nagar Moderator (Content moderation, Proposal reviews)',
      },
      {
        id: 'user-deepa-member',
        name: 'Deepa Venkat',
        username: 'deepa_v',
        easyPassword: 'deepa123',
        roleBadge: 'Active Member',
        roleDescription: 'Active Member (Besant Nagar Member + Medavakkam Admin)',
      },
      {
        id: 'user-greenfield-candidate',
        name: 'Oliver Holloway',
        username: 'oliver_h',
        easyPassword: 'oliver123',
        roleBadge: 'Candidate (Admin-less)',
        roleDescription: 'Greenfield Village Member (Candidate for Admin-less recovery)',
      },
      {
        id: 'user-greenfield-mod',
        name: 'Emma Watson-Smith',
        username: 'emma_ws',
        easyPassword: 'emma123',
        roleBadge: 'Village Moderator',
        roleDescription: 'Greenfield Village Moderator (Moderates in Admin-less community)',
      }
    ];

    const personas = personaConfigs.map(p => {
      const u = db.getUserById(p.id);
      return {
        ...p,
        user: u,
        password: u?.password || p.easyPassword
      };
    });

    res.json({ personas, currentUserId });
  });

  // Login with Username/Email and Password (with JWT token issuance)
  app.post('/api/auth/login', (req, res) => {
    const { identifier, username, email, password } = req.body;
    const loginKey = (identifier || username || email || '').trim().toLowerCase();
    const inputPassword = (password || '').trim();

    if (!loginKey) {
      return res.status(400).json({ error: 'Username or email is required.' });
    }

    const user = db.users.find(u => 
      u.email.toLowerCase() === loginKey || 
      u.username.toLowerCase() === loginKey || 
      u._id === loginKey
    );

    if (!user) {
      return res.status(404).json({ error: 'No account found with this username or email.' });
    }

    // Password verification: accept user password, passwordHash, username123, or universal dev password 'password123'
    const expectedPassword = user.password || user.passwordHash || `${user.username}123`;
    const isPasswordValid = 
      !inputPassword || 
      inputPassword === expectedPassword || 
      inputPassword === 'password123' ||
      inputPassword === `${user.username}123` ||
      inputPassword === 'admin123';

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password. (Tip: Use the easy password shown on the persona card or password123)' });
    }

    currentUserId = user._id;

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        platformRole: user.platformRole,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user
    });
  });

  // Logout Endpoint
  app.post('/api/auth/logout', (req, res) => {
    currentUserId = '';
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.post('/api/auth/switch-user', (req, res) => {
    const { userId } = req.body;
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    currentUserId = user._id;

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        platformRole: user.platformRole,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user });
  });

  app.post('/api/auth/register', (req, res) => {
    const { firstName, lastName, username, email, password, hometown, phoneNumber, bio, profilePhoto, initialCommunityId } = req.body;
    if (!firstName || !lastName || !email || !username) {
      return res.status(400).json({ error: 'First name, last name, username, and email are required.' });
    }

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    const userPassword = password || `${username.toLowerCase()}123`;

    const newUser = {
      _id: `user-${Date.now()}`,
      firstName,
      lastName,
      username,
      email,
      password: userPassword,
      passwordHash: userPassword,
      phoneNumber: phoneNumber || '',
      profilePhoto: profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: bio || 'Hometown Hub community member.',
      hometown: hometown || '',
      privacySettings: {
        profilePhoto: 'public',
        bio: 'public',
        hometown: 'public',
        otherProfileDetails: 'private'
      },
      platformRole: 'user',
      accountStatus: 'active',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    currentUserId = newUser._id;

    // If initial community was requested, create pending membership
    if (initialCommunityId) {
      const comm = db.getCommunityByIdOrSlug(initialCommunityId);
      if (comm) {
        const mem = {
          _id: `mem-${Date.now()}`,
          userId: newUser._id,
          communityId: comm._id,
          role: 'member',
          membershipStatus: 'pending',
          joinedAt: new Date().toISOString(),
          verificationMethod: 'phone',
          verificationNotes: 'New registration request pending Community Admin verification.'
        };
        db.communityMemberships.push(mem);
        
        // Notify community admins
        const admins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.membershipStatus === 'active');
        admins.forEach(a => {
          db.createNotification(
            a.userId,
            'membership_requested',
            'New Membership Request',
            `${newUser.firstName} ${newUser.lastName} requested to join ${comm.name}.`,
            'community',
            comm._id
          );
        });
      }
    }

    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
        platformRole: newUser.platformRole,
        username: newUser.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    db.save();
    res.json({ success: true, token, user: newUser });
  });

  // 2. User Profiles & Privacy
  app.get('/api/users/:id', (req, res) => {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const currentUser = (req as any).currentUser;

    const isSelf = currentUser && currentUser._id === user._id;
    const isPlatformAdmin = currentUser && currentUser.platformRole === 'platformAdmin';

    // Apply granular privacy controls from Section 21 & 44
    const sanitized = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      platformRole: user.platformRole,
      createdAt: user.createdAt,
      profilePhoto: (isSelf || isPlatformAdmin || user.privacySettings.profilePhoto === 'public') ? user.profilePhoto : undefined,
      bio: (isSelf || isPlatformAdmin || user.privacySettings.bio === 'public') ? user.bio : undefined,
      hometown: (isSelf || isPlatformAdmin || user.privacySettings.hometown === 'public') ? user.hometown : undefined,
      email: isSelf || isPlatformAdmin ? user.email : undefined,
      phoneNumber: isSelf || isPlatformAdmin ? user.phoneNumber : undefined,
      privacySettings: isSelf || isPlatformAdmin ? user.privacySettings : undefined
    };

    res.json({ user: sanitized });
  });

  app.put('/api/users/profile', (req, res) => {
    const currentUser = (req as any).currentUser;
    const user = db.getUserById(currentUser._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { firstName, lastName, bio, hometown, phoneNumber, profilePhoto, privacySettings } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (hometown !== undefined) user.hometown = hometown;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (privacySettings) {
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings
      };
    }
    user.updatedAt = new Date().toISOString();
    db.save();
    res.json({ user });
  });

  // 3. Communities & Discovery
  app.get('/api/communities', (req, res) => {
    const { search, country, state } = req.query as { search?: string; country?: string; state?: string };
    let list = db.communities.filter(c => c.status === 'active');

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => {
        const loc = db.getLocationById(c.locationId);
        return c.name.toLowerCase().includes(q) ||
               (loc && (
                 loc.townOrLocality.toLowerCase().includes(q) ||
                 loc.district.toLowerCase().includes(q) ||
                 loc.state.toLowerCase().includes(q) ||
                 loc.country.toLowerCase().includes(q)
               ));
      });
    }

    if (country) {
      list = list.filter(c => {
        const loc = db.getLocationById(c.locationId);
        return loc && loc.country.toLowerCase() === country.toLowerCase();
      });
    }

    const enriched = list.map(c => {
      const location = db.getLocationById(c.locationId);
      const user = (req as any).currentUser;
      const mem = user ? db.getMembership(user._id, c._id) : null;
      const activeMembers = db.communityMemberships.filter(m => m.communityId === c._id && m.membershipStatus === 'active');
      const adminCount = activeMembers.filter(m => m.role === 'communityAdmin').length;
      const moderatorCount = activeMembers.filter(m => m.role === 'moderator').length;
      const DEFAULT_COMMUNITY_PROFILE_IMAGE = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80';
      const DEFAULT_COMMUNITY_COVER_IMAGE = 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&auto=format&fit=crop&q=80';

      return {
        ...c,
        profileImage: c.profileImage || DEFAULT_COMMUNITY_PROFILE_IMAGE,
        coverImage: c.coverImage || DEFAULT_COMMUNITY_COVER_IMAGE,
        memberCount: activeMembers.length,
        adminCount,
        moderatorCount,
        location,
        myMembership: (mem && mem.membershipStatus !== 'left') ? mem : null,
        isAdminless: adminCount === 0
      };
    });

    res.json({ communities: enriched });
  });

  app.get('/api/communities/:idOrSlug', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.idOrSlug);
    if (!comm) return res.status(404).json({ error: 'Community not found' });
    const location = db.getLocationById(comm.locationId);
    const user = (req as any).currentUser;
    const mem = user ? db.getMembership(user._id, comm._id) : null;
    const myMembership = (mem && mem.membershipStatus !== 'left') ? mem : null;

    // Get active memberships
    const activeMembers = db.communityMemberships.filter(m => m.communityId === comm._id && m.membershipStatus === 'active');
    const activeAdmins = activeMembers
      .filter(m => m.role === 'communityAdmin')
      .map(m => db.getUserById(m.userId))
      .filter(Boolean);

    const activeMods = activeMembers
      .filter(m => m.role === 'moderator')
      .map(m => db.getUserById(m.userId))
      .filter(Boolean);

    res.json({
      community: {
        ...comm,
        profileImage: comm.profileImage || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80',
        coverImage: comm.coverImage || 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&auto=format&fit=crop&q=80',
        memberCount: activeMembers.length,
        adminCount: activeAdmins.length,
        moderatorCount: activeMods.length,
        location,
        isAdminless: activeAdmins.length === 0,
        admins: activeAdmins,
        moderators: activeMods,
        myMembership
      }
    });
  });

  app.put('/api/communities/:id/branding', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    if (!currentUser) return res.status(401).json({ error: 'Authentication required' });

    const role = db.getActiveRole(currentUser._id, comm._id);
    const isPlatformAdmin = currentUser.platformRole === 'platformAdmin';

    if (role !== 'communityAdmin' && !isPlatformAdmin) {
      return res.status(403).json({ error: 'Only Community Admins and Platform Admins can modify community branding images.' });
    }

    const { profileImage, coverImage } = req.body;
    if (profileImage !== undefined) {
      comm.profileImage = profileImage;
    }
    if (coverImage !== undefined) {
      comm.coverImage = coverImage;
    }

    comm.updatedAt = new Date().toISOString();
    db.save();

    db.createAuditLog(currentUser._id, 'UPDATE_COMMUNITY_BRANDING', 'community', comm._id, comm._id, {
      profileImageUpdated: profileImage !== undefined,
      coverImageUpdated: coverImage !== undefined
    });

    res.json({ success: true, community: comm });
  });

  // Section 21.1: Community Member Directory (Strictly private to approved active members)
  app.get('/api/communities/:id/directory', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const role = currentUser ? db.getActiveRole(currentUser._id, comm._id) : 'guest';

    if (role === 'guest' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Community Member Directory is private to verified active members.' });
    }

    const memberships = db.communityMemberships.filter(m => m.communityId === comm._id && m.membershipStatus === 'active');
    const directory = memberships.map(m => {
      const user = db.getUserById(m.userId);
      if (!user) return null;
      const pendingOffer = (db.roleOffers || []).find(
        ro => ro.communityId === comm._id && ro.userId === m.userId && ro.status === 'pending'
      );
      return {
        membershipId: m._id,
        role: m.role,
        joinedAt: m.joinedAt,
        pendingOfferRole: pendingOffer ? pendingOffer.targetRole : null,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          profilePhoto: user.privacySettings.profilePhoto === 'public' ? user.profilePhoto : undefined,
          bio: user.privacySettings.bio === 'public' ? user.bio : undefined,
          hometown: user.privacySettings.hometown === 'public' ? user.hometown : undefined
        }
      };
    }).filter(Boolean);

    res.json({ directory, total: directory.length });
  });

  // Request to Join Community (enters Pending state for admin approval)
  app.post('/api/communities/:id/join', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    if (currentUser.platformRole === 'platformAdmin') {
      return res.status(403).json({ error: 'Platform Administrators have platform-wide oversight and do not request individual community memberships.' });
    }

    let mem = db.getMembership(currentUser._id, comm._id);

    if (mem) {
      if (mem.membershipStatus === 'banned') {
        return res.status(403).json({ error: 'You are currently banned from this community by a Community Admin.' });
      }
      if (mem.membershipStatus === 'active') {
        return res.status(400).json({ error: 'You are already an active member of this community.' });
      }
      if (mem.membershipStatus === 'pending') {
        return res.status(400).json({ error: 'Your membership request is already pending verification.' });
      }
      // Re-joining after leaving
      mem.membershipStatus = 'pending';
      mem.joinedAt = new Date().toISOString();
      mem.verificationMethod = req.body.verificationMethod || 'phone';
      mem.verificationNotes = req.body.verificationNotes || 'Re-joining applicant';
    } else {
      mem = {
        _id: `mem-${Date.now()}`,
        userId: currentUser._id,
        communityId: comm._id,
        role: 'member',
        membershipStatus: 'pending',
        joinedAt: new Date().toISOString(),
        verificationMethod: req.body.verificationMethod || 'phone',
        verificationNotes: req.body.verificationNotes || 'New member application'
      };
      db.communityMemberships.push(mem);
    }

    // Notify community admins
    const admins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.membershipStatus === 'active');
    admins.forEach(a => {
      db.createNotification(
        a.userId,
        'membership_requested',
        'New Membership Request',
        `${currentUser.firstName} ${currentUser.lastName} requested to join ${comm.name}.`,
        'community',
        comm._id
      );
    });

    db.save();
    res.json({ success: true, membership: mem });
  });

  // Cancel Pending Membership Request (Resident member withdraws/deletes request before admin accepts)
  app.post('/api/communities/:id/cancel-join', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const memIndex = db.communityMemberships.findIndex(m => m.communityId === comm._id && m.userId === currentUser._id);
    if (memIndex === -1) {
      return res.status(404).json({ error: 'No membership request found for this community.' });
    }

    const mem = db.communityMemberships[memIndex];
    if (mem.membershipStatus !== 'pending') {
      return res.status(400).json({ error: 'Only pending membership requests can be cancelled.' });
    }

    // Remove the pending membership record so admin cannot approve it and request is completely cleared
    db.communityMemberships.splice(memIndex, 1);
    db.save();

    res.json({ success: true, message: 'Membership request cancelled successfully.' });
  });

  // Leave Community (Section 18 & 25)
  app.post('/api/communities/:id/leave', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const mem = db.getMembership(currentUser._id, comm._id);
    if (!mem || (mem.membershipStatus !== 'active' && mem.membershipStatus !== 'pending')) {
      return res.status(400).json({ error: 'You do not have an active or pending membership in this community.' });
    }

    if (mem.membershipStatus === 'pending') {
      // If user cancels from leave action
      const idx = db.communityMemberships.findIndex(m => m._id === mem._id);
      if (idx !== -1) db.communityMemberships.splice(idx, 1);
      db.save();
      return res.json({ success: true, message: 'Membership request cancelled.' });
    }

    const previousRole = mem.role;
    mem.membershipStatus = 'left';
    mem.leftAt = new Date().toISOString();
    db.updateCommunityCounts(comm._id);

    if (previousRole === 'communityAdmin') {
      const remainingAdmins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.membershipStatus === 'active');
      if (remainingAdmins.length === 0) {
        db.createAuditLog(currentUser._id, 'ADMIN_LEAVE_ORPHAN', 'community', comm._id, comm._id, {
          note: 'Sole Community Admin left the community. Community is now Admin-less under Platform Admin oversight.'
        });
        const pAdmin = db.users.find(u => u.platformRole === 'platformAdmin');
        if (pAdmin) {
          db.createNotification(
            pAdmin._id,
            'community_announcement',
            'Admin-less Community Alert',
            `${comm.name} has no Community Admins remaining after ${currentUser.firstName} ${currentUser.lastName} left. Please appoint a replacement.`,
            'community',
            comm._id
          );
        }
      } else {
        remainingAdmins.forEach(a => {
          db.createNotification(
            a.userId,
            'co_admin_action',
            'Co-Admin Left Community',
            `${currentUser.firstName} ${currentUser.lastName} has left ${comm.name} and relinquished their Admin role.`,
            'community',
            comm._id
          );
        });
        db.createAuditLog(currentUser._id, 'ADMIN_LEAVE', 'community', comm._id, comm._id, {
          remainingAdmins: remainingAdmins.length
        });
      }
    } else {
      db.createAuditLog(currentUser._id, 'LEAVE_COMMUNITY', 'community', comm._id, comm._id, { role: previousRole });
    }

    db.save();
    res.json({ success: true, message: `You have left ${comm.name}.` });
  });

  // Admin Resignation (Section 8 & 9)
  app.post('/api/communities/:id/resign-admin', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const mem = db.getMembership(currentUser._id, comm._id);
    if (!mem || mem.role !== 'communityAdmin' || mem.membershipStatus !== 'active') {
      return res.status(403).json({ error: 'Only active Community Admins can resign.' });
    }

    mem.role = 'member'; // demoted to normal member or left
    db.updateCommunityCounts(comm._id);

    const remainingAdmins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.membershipStatus === 'active');
    
    if (remainingAdmins.length === 0) {
      // Community becomes Admin-less! (Section 9)
      db.createAuditLog(currentUser._id, 'ADMIN_RESIGN_ORPHAN', 'community', comm._id, comm._id, {
        note: 'Final Community Admin resigned. Community is now Admin-less under Platform Admin oversight.'
      });
      // Notify Platform Admin
      const pAdmin = db.users.find(u => u.platformRole === 'platformAdmin');
      if (pAdmin) {
        db.createNotification(
          pAdmin._id,
          'community_announcement',
          'Admin-less Community Alert',
          `${comm.name} has no Community Admins remaining. Please appoint a replacement.`,
          'community',
          comm._id
        );
      }
    } else {
      // Other admins receive notification (Section 7.1 & 8)
      remainingAdmins.forEach(a => {
        db.createNotification(
          a.userId,
          'co_admin_action',
          'Co-Admin Resigned',
          `${currentUser.firstName} ${currentUser.lastName} has resigned as Community Admin.`,
          'community',
          comm._id
        );
      });
      db.createAuditLog(currentUser._id, 'ADMIN_RESIGN', 'community', comm._id, comm._id, {
        remainingAdmins: remainingAdmins.length
      });
    }

    db.save();
    res.json({ success: true, message: 'You have resigned as Community Admin.', isAdminless: remainingAdmins.length === 0 });
  });

  // 4. Community Administration & Moderation Endpoints
  app.get('/api/communities/:id/members', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, comm._id);

    if (role !== 'communityAdmin' && role !== 'moderator' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Access restricted to Community Admins and Moderators.' });
    }

    const { status } = req.query as { status?: string };
    let memberships = db.communityMemberships.filter(m => m.communityId === comm._id);
    if (status) {
      memberships = memberships.filter(m => m.membershipStatus === status);
    }

    const enriched = memberships.map(m => {
      const user = db.getUserById(m.userId);
      const pendingOffer = (db.roleOffers || []).find(
        ro => ro.communityId === comm._id && ro.userId === m.userId && ro.status === 'pending'
      );
      return {
        ...m,
        user,
        pendingOfferRole: pendingOffer ? pendingOffer.targetRole : null
      };
    });

    res.json({ members: enriched });
  });

  // Approve / Reject Membership Request (with verification method notes)
  app.post('/api/communities/:id/members/:userId/verify', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, comm._id);

    if (role !== 'communityAdmin' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Community Admins can approve membership requests.' });
    }

    const { action, verificationMethod, notes } = req.body as { action: 'approve' | 'reject'; verificationMethod?: any; notes?: string };
    const mem = db.getMembership(req.params.userId, comm._id);
    if (!mem || mem.membershipStatus !== 'pending') {
      return res.status(400).json({ error: 'Membership request not found or is no longer pending verification (may have been cancelled by applicant).' });
    }

    if (action === 'approve') {
      mem.membershipStatus = 'active';
      mem.joinedAt = new Date().toISOString();
      mem.verificationMethod = verificationMethod || mem.verificationMethod || 'phone';
      mem.verificationNotes = notes || 'Verified by Community Admin';

      db.updateCommunityCounts(comm._id);
      db.createNotification(
        mem.userId,
        'membership_approved',
        'Membership Approved! 🎉',
        `Your request to join ${comm.name} has been approved by ${currentUser.firstName}.`,
        'community',
        comm._id
      );
      db.createAuditLog(currentUser._id, 'APPROVE_MEMBERSHIP', 'user', mem.userId, comm._id, { method: verificationMethod });
    } else {
      mem.membershipStatus = 'rejected';
      db.createNotification(
        mem.userId,
        'membership_rejected',
        'Membership Request Update',
        `Your request to join ${comm.name} was not approved at this time.`,
        'community',
        comm._id
      );
      db.createAuditLog(currentUser._id, 'REJECT_MEMBERSHIP', 'user', mem.userId, comm._id, { notes });
    }

    db.save();
    res.json({ success: true, membership: mem });
  });

  // Promote to Co-Admin (Direct Promotion & Role Update)
  app.post('/api/communities/:id/members/:userId/promote-co-admin', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, comm._id);

    if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Community Admins cannot appoint other Community Admins. Community Admin appointments are handled exclusively by Platform Admins or requested through Platform Admin review.' });
    }

    const targetUser = db.getUserById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const targetMem = db.getMembership(targetUser._id, comm._id);
    if (targetMem && targetMem.role === 'communityAdmin') {
      return res.status(400).json({ error: `${targetUser.firstName} ${targetUser.lastName} is already a Community Admin for this community.` });
    }

    // Check if a pending role offer already exists
    const existingOffer = (db.roleOffers || []).find(ro => ro.userId === targetUser._id && ro.communityId === comm._id && ro.targetRole === 'communityAdmin' && ro.status === 'pending');
    if (existingOffer) {
      return res.json({ success: true, message: `An active Co-Admin appointment offer is already pending acceptance for ${targetUser.firstName} ${targetUser.lastName}.`, offer: existingOffer });
    }

    // Create role offer requiring candidate acceptance
    const offer = {
      _id: `ro-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      communityId: comm._id,
      communityName: comm.name,
      userId: targetUser._id,
      targetRole: 'communityAdmin' as const,
      offeredBy: currentUser._id,
      offeredByName: `${currentUser.firstName} ${currentUser.lastName} (${currentUser.platformRole === 'platformAdmin' ? 'Platform Admin' : 'Community Admin'})`,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };
    db.roleOffers.unshift(offer);

    // Notify candidate resident with interactive role offer
    db.createNotification(
      targetUser._id,
      'role_offer',
      'Community Co-Admin Appointment Offer 🌟',
      `${currentUser.firstName} ${currentUser.lastName} has appointed you as Community Co-Admin for ${comm.name}. Please accept or decline this administrative appointment.`,
      'role_offer',
      offer._id
    );

    db.createAuditLog(currentUser._id, 'OFFER_CO_ADMIN_APPOINTMENT', 'user', targetUser._id, comm._id, {
      offeredBy: currentUser.username,
      targetUser: targetUser.username
    });

    db.save();
    res.json({ success: true, message: `Co-Admin appointment offer sent to ${targetUser.firstName} ${targetUser.lastName}! They must accept the role to activate leadership privileges.`, offer });
  });

  // Appoint / Offer Moderator (Section 7.1 & 11)
  app.post('/api/communities/:id/members/:userId/promote-mod', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, comm._id);

    // If community is admin-less, platform admin temporarily handles (Section 9)
    if (role !== 'communityAdmin' && !(comm.adminCount === 0 && currentUser.platformRole === 'platformAdmin')) {
      return res.status(403).json({ error: 'Only Community Admins (or Platform Admin for admin-less communities) can offer Moderator roles.' });
    }

    const targetMem = db.getMembership(req.params.userId, comm._id);
    if (!targetMem || targetMem.membershipStatus !== 'active') {
      return res.status(400).json({ error: 'Target user must be an active member.' });
    }

    if (targetMem.role === 'moderator' || targetMem.role === 'communityAdmin') {
      return res.status(400).json({ error: `User is already a ${targetMem.role === 'communityAdmin' ? 'Community Admin' : 'Moderator'}.` });
    }

    const existingOffer = (db.roleOffers || []).find(ro => ro.userId === targetMem.userId && ro.communityId === comm._id && ro.targetRole === 'moderator' && ro.status === 'pending');
    if (existingOffer) {
      return res.json({ success: true, message: `An active Moderator offer is already pending acceptance for this member.`, offer: existingOffer });
    }

    const targetUser = db.getUserById(targetMem.userId);

    // Create In-App Role Offer
    const offer = {
      _id: `ro-${Date.now()}`,
      communityId: comm._id,
      communityName: comm.name,
      userId: targetMem.userId,
      targetRole: 'moderator',
      offeredBy: currentUser._id,
      offeredByName: `${currentUser.firstName} ${currentUser.lastName}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    db.roleOffers.unshift(offer);

    db.createNotification(
      targetMem.userId,
      'role_offer',
      'Community Moderator Role Offer 🛡️',
      `${currentUser.firstName} has offered you the role of Moderator for ${comm.name}. Accept the offer to activate your new role.`,
      'role_offer',
      offer._id
    );

    db.createAuditLog(currentUser._id, 'OFFER_MODERATOR', 'user', targetMem.userId, comm._id);
    db.save();
    res.json({ success: true, message: `Moderator role offer sent to ${targetUser?.firstName}. They will become Moderator upon accepting the invitation.`, offer });
  });

  // Get Role Offers for current user
  app.get('/api/role-offers', (req, res) => {
    const currentUser = (req as any).currentUser;
    const offers = (db.roleOffers || [])
      .filter(ro => ro.userId === currentUser._id && ro.status === 'pending')
      .map(ro => ({
        ...ro,
        community: db.getCommunityByIdOrSlug(ro.communityId),
        offeredByUser: db.getUserById(ro.offeredBy)
      }));
    res.json({ roleOffers: offers });
  });

  // Appoint / Offer Role (Accept or Decline: Section 7.1, 161-162)
  app.post('/api/role-offers/:id/respond', (req, res) => {
    const currentUser = (req as any).currentUser;
    const offer = (db.roleOffers || []).find(ro => ro._id === req.params.id);
    if (!offer) return res.status(404).json({ error: 'Role offer not found.' });

    if (offer.userId !== currentUser._id) {
      return res.status(403).json({ error: 'You are not the recipient of this role offer.' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ error: `This role offer is already ${offer.status}.` });
    }

    const { response } = req.body as { response: 'accept' | 'decline' };
    const comm = db.getCommunityByIdOrSlug(offer.communityId);
    if (!comm) return res.status(404).json({ error: 'Community no longer exists.' });

    const roleName = offer.targetRole === 'communityAdmin' ? 'Community Admin' : 'Community Moderator';

    if (response === 'accept') {
      offer.status = 'accepted';
      offer.respondedAt = new Date().toISOString();

      let mem = db.getMembership(currentUser._id, comm._id);
      if (mem) {
        mem.role = offer.targetRole;
        mem.membershipStatus = 'active';
      } else {
        mem = {
          _id: `mem-${Date.now()}`,
          userId: currentUser._id,
          communityId: comm._id,
          role: offer.targetRole,
          membershipStatus: 'active',
          joinedAt: new Date().toISOString()
        };
        db.communityMemberships.push(mem);
      }

      db.updateCommunityCounts(comm._id);

      // 1. Notify the Appointing Admin (offer.offeredBy)
      if (offer.offeredBy && offer.offeredBy !== currentUser._id) {
        db.createNotification(
          offer.offeredBy,
          'admin_action',
          `${roleName} Appointment Accepted! ✅`,
          `${currentUser.firstName} ${currentUser.lastName} has accepted the ${roleName} appointment for ${comm.name} and is now an active ${roleName}.`,
          'community',
          comm._id
        );
      }

      // Also notify all Platform Admins if different from offer.offeredBy
      db.users.filter(u => u.platformRole === 'platformAdmin' && u._id !== offer.offeredBy && u._id !== currentUser._id).forEach(pa => {
        db.createNotification(
          pa._id,
          'admin_action',
          `${roleName} Appointment Accepted! ✅`,
          `${currentUser.firstName} ${currentUser.lastName} has accepted the ${roleName} appointment for ${comm.name}.`,
          'community',
          comm._id
        );
      });

      // 2. Notify the Candidate User
      db.createNotification(
        currentUser._id,
        'role_changed',
        `${roleName} Role Activated! 🌟`,
        `You have accepted the ${roleName} appointment for ${comm.name}. You now have full community administrative privileges.`,
        'community',
        comm._id
      );

      // 3. Notify other Co-Admins in this community
      const otherAdmins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.userId !== currentUser._id && m.membershipStatus === 'active');
      otherAdmins.forEach(a => {
        if (a.userId !== offer.offeredBy) {
          db.createNotification(
            a.userId,
            'co_admin_action',
            `New ${roleName} Active`,
            `${currentUser.firstName} ${currentUser.lastName} accepted the role offer and is now an active ${roleName} in ${comm.name}.`,
            'community',
            comm._id
          );
        }
      });

      db.createAuditLog(currentUser._id, 'ACCEPT_ROLE_OFFER', 'user', currentUser._id, comm._id, {
        activatedRole: offer.targetRole,
        offeredBy: offer.offeredBy
      });

      db.save();
      return res.json({ success: true, message: `Congratulations! You are now an active ${roleName} for ${comm.name}.`, role: offer.targetRole });
    } else {
      offer.status = 'declined';
      offer.respondedAt = new Date().toISOString();

      // 1. Notify the Appointing Admin (offer.offeredBy)
      if (offer.offeredBy && offer.offeredBy !== currentUser._id) {
        db.createNotification(
          offer.offeredBy,
          'admin_action',
          `${roleName} Appointment Declined ❌`,
          `${currentUser.firstName} ${currentUser.lastName} has declined the ${roleName} appointment offer for ${comm.name}.`,
          'community',
          comm._id
        );
      }

      // Also notify Platform Admins if different from offer.offeredBy
      db.users.filter(u => u.platformRole === 'platformAdmin' && u._id !== offer.offeredBy && u._id !== currentUser._id).forEach(pa => {
        db.createNotification(
          pa._id,
          'admin_action',
          `${roleName} Appointment Declined ❌`,
          `${currentUser.firstName} ${currentUser.lastName} has declined the ${roleName} appointment for ${comm.name}.`,
          'community',
          comm._id
        );
      });

      // 2. Notify the Candidate User
      db.createNotification(
        currentUser._id,
        'community_announcement',
        'Appointment Declined',
        `You have declined the ${roleName} appointment for ${comm.name}. Your previous status remains unchanged.`,
        'community',
        comm._id
      );

      db.createAuditLog(currentUser._id, 'DECLINE_ROLE_OFFER', 'user', currentUser._id, comm._id, {
        declinedRole: offer.targetRole,
        offeredBy: offer.offeredBy
      });

      db.save();
      return res.json({ success: true, message: `You have declined the ${roleName} appointment.` });
    }
  });

  // Step-Down from Role & Last Admin Warning (Section 8, 187-188)
  app.post('/api/communities/:id/step-down', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const mem = db.getMembership(currentUser._id, comm._id);
    if (!mem || mem.membershipStatus !== 'active') {
      return res.status(400).json({ error: 'You are not an active member of this community.' });
    }

    const { targetRole, force } = req.body as { targetRole: 'moderator' | 'member'; force?: boolean };
    const currentRole = mem.role;

    if (currentRole !== 'communityAdmin' && currentRole !== 'moderator') {
      return res.status(400).json({ error: 'Only Community Admins or Moderators can step down.' });
    }

    // Check Last Admin Warning (Section 8 & 188)
    if (currentRole === 'communityAdmin') {
      const activeAdmins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.membershipStatus === 'active');
      if (activeAdmins.length <= 1 && !force) {
        return res.json({
          warningRequired: true,
          isLastAdmin: true,
          message: `Warning: You are the last remaining Community Admin for ${comm.name}. Stepping down will leave the community Admin-less and initiate Platform Admin recovery oversight. Are you sure you want to proceed?`
        });
      }
    }

    mem.role = targetRole || 'member';
    db.updateCommunityCounts(comm._id);

    const remainingAdmins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.membershipStatus === 'active');
    const isNowAdminless = remainingAdmins.length === 0;

    if (isNowAdminless) {
      // Community becomes Admin-less: alert Platform Admin
      const pAdmin = db.users.find(u => u.platformRole === 'platformAdmin');
      if (pAdmin) {
        db.createNotification(
          pAdmin._id,
          'community_announcement',
          'Admin-less Community Alert 🚨',
          `The final Community Admin for "${comm.name}" has stepped down. The community is now Admin-less under Platform Admin recovery oversight.`,
          'community',
          comm._id
        );
      }
      db.createAuditLog(currentUser._id, 'ADMIN_STEP_DOWN_ADMINLESS', 'community', comm._id, comm._id, {
        previousRole: currentRole,
        newRole: mem.role
      });
    } else {
      // Notify remaining co-admins
      remainingAdmins.forEach(a => {
        if (a.userId !== currentUser._id) {
          db.createNotification(
            a.userId,
            'co_admin_action',
            'Co-Admin Stepped Down',
            `${currentUser.firstName} stepped down from Community Admin to ${mem.role}.`,
            'community',
            comm._id
          );
        }
      });
      db.createAuditLog(currentUser._id, 'ADMIN_STEP_DOWN', 'community', comm._id, comm._id, {
        previousRole: currentRole,
        newRole: mem.role
      });
    }

    db.save();
    res.json({
      success: true,
      message: `You have successfully stepped down to ${mem.role}.`,
      newRole: mem.role,
      isAdminless: isNowAdminless
    });
  });

  // Member Role Transition Request (Section 9 & 10: Member requests Admin or Moderator)
  app.post('/api/communities/:id/request-role', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const mem = db.getMembership(currentUser._id, comm._id);
    if (!mem || mem.membershipStatus !== 'active') {
      return res.status(403).json({ error: 'You must be an active verified member of this community to request a leadership role.' });
    }

    const { requestedRole, reason } = req.body as { requestedRole: 'moderator' | 'communityAdmin'; reason?: string };
    if (!requestedRole || (requestedRole !== 'moderator' && requestedRole !== 'communityAdmin')) {
      return res.status(400).json({ error: 'Valid requestedRole (moderator or communityAdmin) is required.' });
    }

    // Save persistent role request object
    const roleReq = {
      _id: `rolereq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      communityId: comm._id,
      userId: currentUser._id,
      requestedRole,
      reason: reason || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    db.roleRequests.unshift(roleReq);

    const activeAdmins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.membershipStatus === 'active');
    
    if (activeAdmins.length === 0) {
      // Admin-less: route directly to Platform Admin (Section 9 & 10)
      const pAdmin = db.users.find(u => u.platformRole === 'platformAdmin');
      if (pAdmin) {
        db.createNotification(
          pAdmin._id,
          'community_announcement',
          'Leadership Role Request (Admin-less Community)',
          `${currentUser.firstName} ${currentUser.lastName} requested the role of ${requestedRole === 'communityAdmin' ? 'Community Admin' : 'Moderator'} in admin-less community "${comm.name}". Reason: ${reason || 'Wishes to serve community'}.`,
          'community',
          comm._id
        );
      }
    } else {
      if (requestedRole === 'communityAdmin') {
        // Admin requests are reviewed by Platform Admin
        const pAdmins = db.users.filter(u => u.platformRole === 'platformAdmin');
        pAdmins.forEach(pa => {
          db.createNotification(
            pa._id,
            'community_announcement',
            'Community Admin Role Request',
            `${currentUser.firstName} ${currentUser.lastName} requested to become Community Admin for "${comm.name}". Reason: ${reason || 'None specified'}.`,
            'community',
            comm._id
          );
        });
      } else {
        // Moderator requests are reviewed by Community Admins
        activeAdmins.forEach(a => {
          db.createNotification(
            a.userId,
            'community_announcement',
            'Member Moderator Request',
            `${currentUser.firstName} ${currentUser.lastName} requested to become a Moderator for "${comm.name}". Reason: ${reason || 'None specified'}.`,
            'community',
            comm._id
          );
        });
      }
    }

    db.createAuditLog(currentUser._id, 'REQUEST_COMMUNITY_ROLE', 'user', currentUser._id, comm._id, {
      requestedRole,
      reason
    });

    db.save();
    res.json({ success: true, message: `Your request to become a ${requestedRole === 'communityAdmin' ? 'Community Admin' : 'Moderator'} has been submitted for review.` });
  });

  // Get Community Moderator Requests (For Community Admin)
  app.get('/api/communities/:id/role-requests', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, comm._id);
    if (role !== 'communityAdmin' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Community Admins can view role requests.' });
    }

    const reqs = (db.roleRequests || [])
      .filter(r => r.communityId === comm._id && r.requestedRole === 'moderator')
      .map(r => {
        const targetMem = db.getMembership(r.userId, comm._id);
        const hasOffer = (db.roleOffers || []).some(
          ro => ro.communityId === comm._id && ro.userId === r.userId && ro.targetRole === 'moderator' && ro.status === 'pending'
        );
        return {
          ...r,
          user: db.getUserById(r.userId),
          currentMemberRole: targetMem?.role || 'member',
          isAlreadyGiven: r.status === 'approved' || targetMem?.role === 'moderator' || targetMem?.role === 'communityAdmin' || hasOffer
        };
      });

    res.json({ roleRequests: reqs });
  });

  // Review Moderator Request (Approved or Rejected by Community Admin)
  app.post('/api/communities/:id/role-requests/:requestId/review', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, comm._id);
    if (role !== 'communityAdmin' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Community Admins can review moderator requests.' });
    }

    const request = (db.roleRequests || []).find(r => r._id === req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Role request not found' });

    const { action } = req.body as { action: 'approve' | 'reject' };

    if (action === 'approve') {
      request.status = 'approved';
      request.reviewedBy = currentUser._id;
      request.reviewedAt = new Date().toISOString();

      const mem = db.getMembership(request.userId, comm._id);
      if (mem) {
        mem.role = 'moderator';
        db.updateCommunityCounts(comm._id);
      }

      db.createNotification(
        request.userId,
        'role_changed',
        'Moderator Request Approved! 🛡️',
        `Your request to become a Moderator for ${comm.name} was approved by ${currentUser.firstName}. You are now a Moderator!`,
        'community',
        comm._id
      );
    } else {
      request.status = 'rejected';
      request.reviewedBy = currentUser._id;
      request.reviewedAt = new Date().toISOString();

      db.createNotification(
        request.userId,
        'community_announcement',
        'Moderator Request Declined',
        `Your request to become a Moderator for ${comm.name} was declined.`,
        'community',
        comm._id
      );
    }

    db.save();
    res.json({ success: true, request });
  });

  // Get All Community Admin Requests (For Platform Admin)
  app.get('/api/admin/community-admin-requests', (req, res) => {
    const currentUser = (req as any).currentUser;
    if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Platform Admin can view Community Admin requests.' });
    }

    const reqs = (db.roleRequests || [])
      .filter(r => r.requestedRole === 'communityAdmin')
      .map(r => {
        const comm = db.getCommunityByIdOrSlug(r.communityId);
        const targetMem = comm ? db.getMembership(r.userId, comm._id) : null;
        const hasOffer = comm ? (db.roleOffers || []).some(
          ro => ro.communityId === comm._id && ro.userId === r.userId && ro.targetRole === 'communityAdmin' && ro.status === 'pending'
        ) : false;
        return {
          ...r,
          community: comm,
          user: db.getUserById(r.userId),
          currentMemberRole: targetMem?.role || 'member',
          isAlreadyGiven: r.status === 'approved' || targetMem?.role === 'communityAdmin' || hasOffer
        };
      });

    res.json({ adminRequests: reqs });
  });

  // Review Community Admin Request (Approved or Rejected by Platform Admin)
  app.post('/api/admin/community-admin-requests/:requestId/review', (req, res) => {
    const currentUser = (req as any).currentUser;
    if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Platform Admin can review Community Admin requests.' });
    }

    const request = (db.roleRequests || []).find(r => r._id === req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Role request not found' });

    const { action } = req.body as { action: 'approve' | 'reject' };
    const comm = db.getCommunityByIdOrSlug(request.communityId);

    if (action === 'approve') {
      request.status = 'approved';
      request.reviewedBy = currentUser._id;
      request.reviewedAt = new Date().toISOString();

      if (comm) {
        let mem = db.getMembership(request.userId, comm._id);
        if (mem) {
          mem.role = 'communityAdmin';
          mem.membershipStatus = 'active';
        } else {
          db.communityMemberships.push({
            _id: `mem-${Date.now()}`,
            userId: request.userId,
            communityId: comm._id,
            role: 'communityAdmin',
            membershipStatus: 'active',
            joinedAt: new Date().toISOString()
          });
        }
        db.updateCommunityCounts(comm._id);
      }

      db.createNotification(
        request.userId,
        'role_changed',
        'Community Admin Request Approved! 🎉',
        `Platform Admin approved your request to become Community Admin for ${comm?.name || 'the community'}. You now have full Community Admin privileges!`,
        'community',
        request.communityId
      );
    } else {
      request.status = 'rejected';
      request.reviewedBy = currentUser._id;
      request.reviewedAt = new Date().toISOString();

      db.createNotification(
        request.userId,
        'community_announcement',
        'Community Admin Request Declined',
        `Your request to become Community Admin for ${comm?.name || 'the community'} was declined by Platform Admin.`,
        'community',
        request.communityId
      );
    }

    db.save();
    res.json({ success: true, request });
  });

  // Remove Moderator (Section 11.2)
  app.post('/api/communities/:id/members/:userId/remove-mod', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const mem = db.getMembership(currentUser._id, comm._id);
    const isCommAdmin = (mem && mem.role === 'communityAdmin' && mem.membershipStatus === 'active') || currentUser.platformRole === 'platformAdmin';

    if (!isCommAdmin) {
      return res.status(403).json({ error: 'Only Community Admins or Platform Admins can remove Moderators.' });
    }

    const targetMem = db.getMembership(req.params.userId, comm._id);
    if (!targetMem || targetMem.role !== 'moderator') {
      return res.status(400).json({ error: 'Target is not a moderator.' });
    }

    targetMem.role = 'member';
    db.updateCommunityCounts(comm._id);

    db.createNotification(
      targetMem.userId,
      'role_changed',
      'Moderator Role Removed',
      `Your moderator privileges for ${comm.name} were updated by ${currentUser.firstName}.`,
      'community',
      comm._id
    );

    db.createAuditLog(currentUser._id, 'REMOVE_MODERATOR', 'user', targetMem.userId, comm._id);
    db.save();
    res.json({ success: true, message: 'Moderator role removed.' });
  });

  // Ban Member (Section 17: Auto-cancels future hosted events & RSVPs, auto-promotes waitlist)
  app.post('/api/communities/:id/members/:userId/ban', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, comm._id);

    if (role !== 'communityAdmin' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Moderators cannot ban users. Only Community Admins can ban members.' });
    }

    const targetMem = db.getMembership(req.params.userId, comm._id);
    if (!targetMem) return res.status(404).json({ error: 'Member not found.' });
    if (targetMem.role === 'communityAdmin') {
      return res.status(400).json({ error: 'Community Admins cannot ban other Community Admins.' });
    }

    const { reason } = req.body;
    targetMem.membershipStatus = 'banned';
    targetMem.bannedAt = new Date().toISOString();
    targetMem.bannedBy = currentUser._id;
    targetMem.banReason = reason || 'Violation of community guidelines';

    // Section 17 & 540-543: Future Hosted Events auto-cancelled, future RSVPs cancelled, waitlist promoted
    const now = new Date().toISOString();
    db.events.forEach(e => {
      if (e.communityId === comm._id && e.createdBy === req.params.userId && e.startTime > now && e.status !== 'cancelled') {
        e.status = 'cancelled';
        e.updatedAt = new Date().toISOString();
      }
    });

    db.eventParticipants.forEach(ep => {
      const evt = db.events.find(e => e._id === ep.eventId);
      if (evt && evt.communityId === comm._id && ep.userId === req.params.userId && evt.startTime > now && ep.participationStatus !== 'cancelled') {
        const wasGoing = ep.participationStatus === 'going';
        ep.participationStatus = 'cancelled';
        ep.cancelledAt = new Date().toISOString();
        if (wasGoing && evt.participantCount > 0) {
          evt.participantCount--;
          // Auto-promote next waitlist participant (Section 32)
          const nextWaitlist = db.eventParticipants.find(p => p.eventId === evt._id && p.participationStatus === 'waitlist');
          if (nextWaitlist) {
            nextWaitlist.participationStatus = 'going';
            evt.participantCount++;
            db.createNotification(
              nextWaitlist.userId,
              'waitlist_promoted',
              'Promoted from Waitlist! 🎉',
              `A spot opened up for "${evt.title}"! You are now confirmed as Going.`,
              'event',
              evt._id
            );
          }
        }
      }
    });

    db.updateCommunityCounts(comm._id);

    // Notify other Co-Admins
    const otherAdmins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.userId !== currentUser._id && m.membershipStatus === 'active');
    const targetUser = db.getUserById(req.params.userId);
    otherAdmins.forEach(a => {
      db.createNotification(
        a.userId,
        'co_admin_action',
        'Member Banned',
        `${currentUser.firstName} banned ${targetUser?.firstName} ${targetUser?.lastName} from ${comm.name}.`,
        'community',
        comm._id
      );
    });

    db.createAuditLog(currentUser._id, 'BAN_MEMBER', 'user', req.params.userId, comm._id, { reason });
    db.save();

    res.json({ success: true, message: 'Member banned from community.' });
  });

  // Unban Member (Section 7.1 Co-Admin reversibility rule)
  app.post('/api/communities/:id/members/:userId/unban', (req, res) => {
    const comm = db.getCommunityByIdOrSlug(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Community not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, comm._id);

    if (role !== 'communityAdmin' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Community Admins can unban members.' });
    }

    const targetMem = db.getMembership(req.params.userId, comm._id);
    if (!targetMem || targetMem.membershipStatus !== 'banned') {
      return res.status(400).json({ error: 'User is not banned.' });
    }

    targetMem.membershipStatus = 'active';
    targetMem.bannedAt = undefined;
    targetMem.bannedBy = undefined;
    targetMem.banReason = undefined;

    db.updateCommunityCounts(comm._id);

    // Notify other Co-Admins (Co-Admin Reversibility Notification)
    const otherAdmins = db.communityMemberships.filter(m => m.communityId === comm._id && m.role === 'communityAdmin' && m.userId !== currentUser._id && m.membershipStatus === 'active');
    const targetUser = db.getUserById(req.params.userId);
    otherAdmins.forEach(a => {
      db.createNotification(
        a.userId,
        'co_admin_action',
        'Member Unbanned',
        `${currentUser.firstName} unbanned ${targetUser?.firstName} ${targetUser?.lastName} in ${comm.name}.`,
        'community',
        comm._id
      );
    });

    db.createAuditLog(currentUser._id, 'UNBAN_MEMBER', 'user', req.params.userId, comm._id);
    db.save();

    res.json({ success: true, message: 'Member unbanned and restored to active status.' });
  });

  // 5. Community Creation Requests & Platform Admin Workflows (Section 5, 9, 10, 55, 56)
  app.get('/api/community-requests', (req, res) => {
    const currentUser = (req as any).currentUser;
    if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Access restricted to Platform Admin.' });
    }

    const requests = db.communityCreationRequests.map(r => {
      const requester = db.getUserById(r.requestedBy);
      return { ...r, requester };
    });

    res.json({ requests });
  });

  app.post('/api/community-requests', (req, res) => {
    const rawBody = req.body || {};
    const proposedCommunityName = rawBody.proposedCommunityName || rawBody.communityName || rawBody.name;
    
    // Normalize location whether passed as a nested object or flat fields
    const loc = rawBody.location || {};
    const country = loc.country || rawBody.country || 'India';
    const state = loc.state || rawBody.state;
    const district = loc.district || rawBody.district || '';
    const townOrLocality = loc.townOrLocality || rawBody.townOrLocality || rawBody.town || rawBody.locality;
    const postalCode = loc.postalCode || rawBody.postalCode || '';

    if (!proposedCommunityName || !country || !state || !townOrLocality) {
      return res.status(400).json({ error: 'Proposed name, country, state, and town/locality are required.' });
    }

    const location = {
      country: String(country).trim(),
      state: String(state).trim(),
      district: String(district).trim(),
      townOrLocality: String(townOrLocality).trim(),
      postalCode: String(postalCode).trim(),
      latitude: loc.latitude || 13.0,
      longitude: loc.longitude || 80.0
    };

    const description = rawBody.description || rawBody.reasonForCreation || '';
    const reasonForCreation = rawBody.reasonForCreation || '';
    const applicantCredentials = rawBody.applicantCredentials || '';

    const currentUser = (req as any).currentUser;

    // Check duplicate locality tuple (Country + State + District + Locality)
    const uniqueness = db.checkLocalityUniqueness(
      location.country,
      location.state,
      location.district || '',
      location.townOrLocality
    );

    if (uniqueness.isDuplicate) {
      return res.status(400).json({
        error: `An official community already exists for ${location.townOrLocality}, ${location.state}, ${location.country} ("${uniqueness.existingCommunity?.name}"). Only one official community is permitted per locality.`
      });
    }

    let similarityWarning = undefined;
    if (uniqueness.similarCommunity) {
      similarityWarning = `Notice: Locality name is similar to existing community "${uniqueness.similarCommunity.name}". Platform Admin will verify during review.`;
    }

    // Platform Admin Proposal Rule:
    // If created by the Platform Admin him/herself, no need of approval: community is created automatically.
    if (currentUser.platformRole === 'platformAdmin') {
      const newLoc = {
        _id: `loc-${Date.now()}`,
        country: location.country,
        state: location.state,
        district: location.district || '',
        townOrLocality: location.townOrLocality,
        postalCode: location.postalCode || '',
        latitude: location.latitude || 13.0,
        longitude: location.longitude || 80.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.locations.push(newLoc);

      const slug = String(proposedCommunityName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newComm = {
        _id: `comm-${Date.now()}`,
        name: String(proposedCommunityName).trim(),
        slug,
        locationId: newLoc._id,
        description: String(description).trim() || `Official locality hub for ${location.townOrLocality}, ${location.state}.`,
        profileImage: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=80',
        memberCount: 1,
        status: 'active',
        adminCount: 1,
        moderatorCount: 0,
        contactEmail: `admin@${slug}.hometownhub.local`,
        createdBy: currentUser._id,
        approvedBy: currentUser._id,
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.communities.push(newComm);

      // Appoint initial Community Admin
      const adminMem = {
        _id: `mem-${Date.now()}`,
        userId: currentUser._id,
        communityId: newComm._id,
        role: 'communityAdmin',
        membershipStatus: 'active',
        joinedAt: new Date().toISOString()
      };
      db.communityMemberships.push(adminMem);
      db.updateCommunityCounts(newComm._id);

      // Create pre-approved request audit item
      const request = {
        _id: `req-${Date.now()}`,
        requestedBy: currentUser._id,
        proposedCommunityName: String(proposedCommunityName).trim(),
        location,
        description: String(description).trim(),
        reasonForCreation: String(reasonForCreation).trim(),
        applicantCredentials: String(applicantCredentials).trim(),
        status: 'approved',
        reviewedBy: currentUser._id,
        reviewedAt: new Date().toISOString(),
        reviewNotes: 'Automatically approved and initialized upon Platform Admin creation',
        similarityWarning,
        createdAt: new Date().toISOString()
      };
      db.communityCreationRequests.unshift(request);

      db.createAuditLog(currentUser._id, 'DIRECT_COMMUNITY_CREATION', 'community', newComm._id, newComm._id, {
        communityName: newComm.name,
        locality: location.townOrLocality
      });

      db.save();
      return res.json({ success: true, autoApproved: true, community: newComm, request });
    }

    // Standard resident proposal: requires Platform Admin approval
    const request = {
      _id: `req-${Date.now()}`,
      requestedBy: currentUser._id,
      proposedCommunityName: String(proposedCommunityName).trim(),
      location,
      description: String(description).trim(),
      reasonForCreation: String(reasonForCreation).trim(),
      applicantCredentials: String(applicantCredentials).trim(),
      status: 'pending',
      similarityWarning,
      createdAt: new Date().toISOString()
    };

    db.communityCreationRequests.unshift(request);

    // Notify platform admin
    const pAdmin = db.users.find(u => u.platformRole === 'platformAdmin');
    if (pAdmin) {
      db.createNotification(
        pAdmin._id,
        'community_announcement',
        'New Community Creation Request',
        `${currentUser.firstName} requested new community "${proposedCommunityName}" (${location.townOrLocality}).`,
        'community',
        request._id
      );
    }

    db.save();
    res.json({ success: true, autoApproved: false, request });
  });

  // Platform Admin approves request and assigns initial Community Admin (Section 5.1 & 6.1)
  app.post('/api/community-requests/:id/review', (req, res) => {
    try {
      const currentUser = (req as any).currentUser;
      if (currentUser.platformRole !== 'platformAdmin') {
        return res.status(403).json({ error: 'Access restricted to Platform Admin.' });
      }

      const request = db.communityCreationRequests.find(r => r._id === req.params.id);
      if (!request) return res.status(404).json({ error: 'Request not found' });

      // Platform Admin cannot approve or review their own proposal
      if (request.requestedBy === currentUser._id) {
        return res.status(403).json({ error: 'Platform Admins cannot approve or reject their own community proposals. Proposals created by Platform Admins are automatically initialized upon submission.' });
      }

      const { action, reviewNotes, initialAdminUserId } = req.body as { action: 'approve' | 'reject'; reviewNotes?: string; initialAdminUserId?: string };

      const proposedName = request.proposedCommunityName || request.name || 'New Community';

      if (action === 'approve') {
        request.status = 'approved';
        request.reviewedBy = currentUser._id;
        request.reviewNotes = reviewNotes || 'Approved by Platform Admin';
        request.reviewedAt = new Date().toISOString();

        // Create location entity
        const reqLoc = request.location || {};
        const newLoc = {
          _id: `loc-${Date.now()}`,
          country: reqLoc.country || 'India',
          state: reqLoc.state || '',
          district: reqLoc.district || '',
          townOrLocality: reqLoc.townOrLocality || reqLoc.city || proposedName,
          postalCode: reqLoc.postalCode || reqLoc.pincode || '',
          latitude: reqLoc.latitude || 13.0,
          longitude: reqLoc.longitude || 80.0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.locations.push(newLoc);

        // Create official community entity
        const slug = proposedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newComm = {
          _id: `comm-${Date.now()}`,
          name: proposedName,
          slug,
          locationId: newLoc._id,
          description: request.description || '',
          profileImage: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80',
          coverImage: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=80',
          memberCount: 0,
          status: 'active',
          adminCount: 0,
          moderatorCount: 0,
          contactEmail: `admin@${slug}.hometownhub.local`,
          createdBy: request.requestedBy,
          approvedBy: currentUser._id,
          approvedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.communities.push(newComm);

        // Assign initial Community Admin (chosen by Platform Admin, Section 6.1)
        const assignedAdminId = initialAdminUserId || request.requestedBy;
        const adminMem = {
          _id: `mem-${Date.now()}`,
          userId: assignedAdminId,
          communityId: newComm._id,
          role: 'communityAdmin',
          membershipStatus: 'active',
          joinedAt: new Date().toISOString()
        };
        db.communityMemberships.push(adminMem);
        db.updateCommunityCounts(newComm._id);

        db.createNotification(
          assignedAdminId,
          'role_changed',
          'Community Created & Admin Assigned! 🎉',
          `Official community "${newComm.name}" is now live and you have been appointed as Community Admin.`,
          'community',
          newComm._id
        );

        db.createAuditLog(currentUser._id, 'APPROVE_COMMUNITY_CREATION', 'community', newComm._id, newComm._id, {
          assignedAdminId
        });
      } else {
        request.status = 'rejected';
        request.reviewedBy = currentUser._id;
        request.reviewNotes = reviewNotes || 'Declined by Platform Admin';
        request.reviewedAt = new Date().toISOString();

        db.createNotification(
          request.requestedBy,
          'community_announcement',
          'Community Request Declined',
          `Your request for "${proposedName}" was declined: ${reviewNotes || 'Does not meet guidelines.'}`,
          'community',
          request._id
        );
      }

      db.save();
      res.json({ success: true, request });
    } catch (e: any) {
      console.error('Error in /api/community-requests/:id/review:', e);
      res.status(500).json({ error: e.message || 'Failed to review request' });
    }
  });

  // Admin-less Replacement Workflow (Section 10 & 56)
  app.get('/api/admin/adminless-communities', (req, res) => {
    const adminless = db.communities
      .filter(c => c.status === 'active' && c.adminCount === 0)
      .map(c => ({
        ...c,
        location: db.getLocationById(c.locationId),
        activeMembers: db.communityMemberships
          .filter(m => m.communityId === c._id && m.membershipStatus === 'active')
          .map(m => db.getUserById(m.userId))
          .filter(Boolean),
        pendingInvitation: db.communityAdminInvitations.find(inv => inv.communityId === c._id && inv.status !== 'rejected' && inv.status !== 'cancelled')
      }));

    res.json({ adminless });
  });

  app.get('/api/admin/invitations', (req, res) => {
    const currentUser = (req as any).currentUser;
    const invs = db.communityAdminInvitations
      .filter(inv => currentUser.platformRole === 'platformAdmin' || inv.invitedUserId === currentUser._id)
      .map(inv => ({
        ...inv,
        community: db.getCommunityByIdOrSlug(inv.communityId),
        invitedUser: db.getUserById(inv.invitedUserId)
      }));
    res.json({ invitations: invs });
  });

  // Step 1: Platform Admin invites member
  app.post('/api/admin/invite-community-admin', (req, res) => {
    const currentUser = (req as any).currentUser;
    if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Platform Admin can send replacement Admin invitations.' });
    }

    const { communityId, invitedUserId } = req.body;
    const comm = db.getCommunityByIdOrSlug(communityId);
    const user = db.getUserById(invitedUserId);
    if (!comm || !user) return res.status(404).json({ error: 'Community or User not found.' });

    const inv = {
      _id: `inv-${Date.now()}`,
      communityId: comm._id,
      invitedUserId: user._id,
      invitedByPlatformAdmin: currentUser._id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    db.communityAdminInvitations.unshift(inv);

    db.createNotification(
      user._id,
      'admin_invitation',
      'Community Admin Invitation 🌟',
      `Platform Admin has invited you to become the Community Admin for ${comm.name}.`,
      'invitation',
      inv._id
    );

    db.createAuditLog(currentUser._id, 'SEND_ADMIN_INVITATION', 'invitation', inv._id, comm._id, { invitedUserId });
    db.save();
    res.json({ success: true, invitation: inv });
  });

  // Community Admin Appointment by Platform Admin (Requires Candidate Acceptance)
  app.post('/api/admin/assign-community-admin', (req, res) => {
    const currentUser = (req as any).currentUser;
    if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Platform Admin can appoint Community Admins.' });
    }

    const { communityId, userId } = req.body;
    const comm = db.getCommunityByIdOrSlug(communityId);
    const user = db.getUserById(userId);
    if (!comm || !user) return res.status(404).json({ error: 'Community or User not found.' });

    // Check if an offer is already pending for this user in this community
    const existingOffer = (db.roleOffers || []).find(ro => ro.userId === user._id && ro.communityId === comm._id && ro.targetRole === 'communityAdmin' && ro.status === 'pending');
    if (existingOffer) {
      return res.json({
        success: true,
        message: `An official Community Admin appointment offer is already pending acceptance for ${user.firstName} ${user.lastName}.`,
        offer: existingOffer
      });
    }

    // Create official Role Offer for Community Admin
    const offer = {
      _id: `ro-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      communityId: comm._id,
      communityName: comm.name,
      userId: user._id,
      targetRole: 'communityAdmin' as const,
      offeredBy: currentUser._id,
      offeredByName: `${currentUser.firstName} ${currentUser.lastName} (Platform Admin)`,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };
    db.roleOffers.unshift(offer);

    // Notify the user immediately with an actionable invitation
    db.createNotification(
      user._id,
      'role_offer',
      'Community Admin Appointment Offer 🌟',
      `Platform Admin (${currentUser.firstName} ${currentUser.lastName}) has appointed you as Community Admin for ${comm.name}. Please accept or decline this administrative appointment.`,
      'role_offer',
      offer._id
    );

    db.createAuditLog(currentUser._id, 'OFFER_COMMUNITY_ADMIN_APPOINTMENT', 'user', user._id, comm._id, {
      appointedBy: currentUser.username,
      targetUser: user.username
    });

    db.save();
    res.json({
      success: true,
      message: `Community Admin appointment offer dispatched to ${user.firstName} ${user.lastName}! They will receive a notification and banner to accept or decline the appointment.`,
      offer
    });
  });

  // Get All Platform Users (for Platform Admin Appointment Modal)
  app.get('/api/admin/users', (req, res) => {
    const currentUser = (req as any).currentUser;
    if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Platform Admins can view all platform users.' });
    }
    const safeUsers = (db.users || []).map(u => {
      const { password, passwordHash, ...rest } = u;
      return rest;
    });
    res.json({ users: safeUsers });
  });

  // Step 2: Member accepts / rejects invitation (Admin-less recovery)
  app.post('/api/admin/invitations/:id/respond', (req, res) => {
    const currentUser = (req as any).currentUser;
    const inv = db.communityAdminInvitations.find(i => i._id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invitation not found' });
    if (inv.invitedUserId !== currentUser._id) {
      return res.status(403).json({ error: 'You are not the recipient of this invitation.' });
    }

    const { response } = req.body as { response: 'accept' | 'reject' };
    const comm = db.getCommunityByIdOrSlug(inv.communityId);

    if (response === 'accept') {
      inv.status = 'accepted';
      inv.acceptedAt = new Date().toISOString();

      // Notify Platform Admin for final confirmation
      const pAdmins = db.users.filter(u => u.platformRole === 'platformAdmin');
      pAdmins.forEach(pa => {
        db.createNotification(
          pa._id,
          'admin_invitation',
          'Admin Invitation Accepted ✅',
          `${currentUser.firstName} ${currentUser.lastName} accepted the admin invitation for ${comm?.name || 'community'}. Final confirmation required to activate.`,
          'invitation',
          inv._id
        );
      });

      // Notify User
      db.createNotification(
        currentUser._id,
        'community_announcement',
        'Invitation Accepted',
        `You have accepted the Community Admin invitation for ${comm?.name || 'community'}. Platform Admin has been notified for final activation.`,
        'community',
        inv.communityId
      );
    } else {
      inv.status = 'rejected';

      // Notify Platform Admin
      const pAdmins = db.users.filter(u => u.platformRole === 'platformAdmin');
      pAdmins.forEach(pa => {
        db.createNotification(
          pa._id,
          'admin_invitation',
          'Admin Invitation Declined ❌',
          `${currentUser.firstName} ${currentUser.lastName} declined the admin invitation for ${comm?.name || 'community'}.`,
          'invitation',
          inv._id
        );
      });

      // Notify User
      db.createNotification(
        currentUser._id,
        'community_announcement',
        'Invitation Declined',
        `You have declined the Community Admin invitation for ${comm?.name || 'community'}.`,
        'community',
        inv.communityId
      );
    }

    db.save();
    res.json({ success: true, invitation: inv });
  });

  // Step 3: Platform Admin finalizes the appointment
  app.post('/api/admin/invitations/:id/finalize', (req, res) => {
    const currentUser = (req as any).currentUser;
    if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Platform Admin can finalize appointments.' });
    }

    const inv = db.communityAdminInvitations.find(i => i._id === req.params.id);
    if (!inv || inv.status !== 'accepted') {
      return res.status(400).json({ error: 'Invitation must be accepted by candidate before finalizing.' });
    }

    inv.status = 'finalized';
    inv.finalizedAt = new Date().toISOString();

    const comm = db.getCommunityByIdOrSlug(inv.communityId);
    let mem = db.getMembership(inv.invitedUserId, inv.communityId);

    if (mem) {
      mem.role = 'communityAdmin';
      mem.membershipStatus = 'active';
    } else {
      mem = {
        _id: `mem-${Date.now()}`,
        userId: inv.invitedUserId,
        communityId: inv.communityId,
        role: 'communityAdmin',
        membershipStatus: 'active',
        joinedAt: new Date().toISOString()
      };
      db.communityMemberships.push(mem);
    }

    db.updateCommunityCounts(inv.communityId);

    db.createNotification(
      inv.invitedUserId,
      'role_changed',
      'Appointment Finalized! 🌟',
      `You are now officially the Community Admin for ${comm?.name}.`,
      'community',
      inv.communityId
    );

    db.createAuditLog(currentUser._id, 'FINALIZE_COMMUNITY_ADMIN', 'user', inv.invitedUserId, inv.communityId);
    db.save();
    res.json({ success: true, message: 'Community Admin appointed successfully.', invitation: inv });
  });

  // 6. Posts & Discussions (Section 20, 24, 25, 38)
  app.get('/api/posts', (req, res) => {
    const { communityId, category, search, authorId } = req.query as { communityId?: string; category?: string; search?: string; authorId?: string };
    const currentUser = (req as any).currentUser;

    let list = db.posts.filter(p => p.status === 'active');

    if (communityId) {
      list = list.filter(p => p.communityId === communityId);
    }

    if (category && category.toString().trim().toLowerCase() !== 'all' && category !== 'undefined' && category !== 'null') {
      const catNorm = category.toString().trim().toLowerCase();
      list = list.filter(p => p.category && p.category.toString().trim().toLowerCase() === catNorm);
    }

    if (authorId) {
      list = list.filter(p => p.authorId === authorId);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
    }

    // Filter by Public / Private visibility rules (Section 20)
    list = list.filter(p => {
      if (p.visibility === 'public') return true;
      if (!currentUser) return false;
      const role = db.getActiveRole(currentUser._id, p.communityId);
      return role === 'member' || role === 'moderator' || role === 'communityAdmin' || currentUser.platformRole === 'platformAdmin';
    });

    // Pinned posts first, then newest
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const enriched = list.map(p => {
      const author = db.getUserById(p.authorId);
      const comm = db.getCommunityByIdOrSlug(p.communityId);
      const userReaction = currentUser ? db.reactions.find(r => r.postId === p._id && r.userId === currentUser._id)?.reactionType : null;
      
      const reactionsSummary: Record<string, number> = { like: 0, love: 0, celebrate: 0, support: 0 };
      db.reactions.filter(r => r.postId === p._id).forEach(r => {
        reactionsSummary[r.reactionType] = (reactionsSummary[r.reactionType] || 0) + 1;
      });

      return {
        ...p,
        author,
        communityName: comm?.name,
        userReaction,
        reactionsSummary
      };
    });

    res.json({ posts: enriched });
  });

  app.post('/api/posts', (req, res) => {
    const { communityId, title, content, category, media, visibility, isPinned } = req.body;
    if (!communityId || !title || !content) {
      return res.status(400).json({ error: 'Community, title, and content are required.' });
    }

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, communityId);

    if (role === 'guest' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'You must be an approved active member to create posts.' });
    }

    const post = {
      _id: `post-${Date.now()}`,
      communityId,
      authorId: currentUser._id,
      title,
      content,
      category: category || 'General',
      media: Array.isArray(media) ? media : [],
      isPinned: (role === 'communityAdmin' || currentUser.platformRole === 'platformAdmin') ? !!isPinned : false,
      visibility: visibility === 'private' ? 'private' : 'public',
      status: 'active',
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.posts.unshift(post);
    db.createAuditLog(currentUser._id, 'CREATE_POST', 'post', post._id, communityId, { title, category });
    db.save();

    res.json({ success: true, post: { ...post, author: currentUser } });
  });

  app.put('/api/posts/:id', (req, res) => {
    const post = db.posts.find(p => p._id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, post.communityId);
    const isAuthor = post.authorId === currentUser._id;
    const isAdmin = role === 'communityAdmin' || currentUser.platformRole === 'platformAdmin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to edit this post.' });
    }

    const { title, content, category, media, visibility, isPinned } = req.body;
    if (isAuthor) {
      if (title) post.title = title;
      if (content) post.content = content;
      if (category) post.category = category;
      if (media) post.media = media;
      if (visibility) post.visibility = visibility;
    }
    if (isAdmin && isPinned !== undefined) {
      post.isPinned = !!isPinned;
    }
    post.updatedAt = new Date().toISOString();
    db.save();

    res.json({ success: true, post });
  });

  // Soft-Delete Post (Section 25, 38 & 679-693)
  app.delete('/api/posts/:id', (req, res) => {
    const post = db.posts.find(p => p._id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, post.communityId);
    const isAuthor = post.authorId === currentUser._id;
    const isMod = role === 'moderator';
    const isAdmin = role === 'communityAdmin' || currentUser.platformRole === 'platformAdmin';

    if (!isAuthor && !isMod && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this post.' });
    }

    post.status = 'deleted';
    post.deletedBy = currentUser._id;
    post.deletedByRole = isAuthor ? 'author' : (isAdmin ? 'communityAdmin' : 'moderator');
    post.deletedAt = new Date().toISOString();

    db.createAuditLog(currentUser._id, 'DELETE_POST', 'post', post._id, post.communityId, {
      deletedByRole: post.deletedByRole
    });
    db.save();

    res.json({ success: true, message: 'Post soft-deleted successfully.' });
  });

  // Restore Soft-Deleted Post (Restoration Authority Matrix: Section 25, 38, 683-693)
  app.post('/api/posts/:id/restore', (req, res) => {
    const post = db.posts.find(p => p._id === req.params.id);
    if (!post || post.status !== 'deleted') return res.status(404).json({ error: 'Deleted post not found.' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, post.communityId);
    const isAuthor = post.authorId === currentUser._id;
    const isMod = role === 'moderator';
    const isAdmin = role === 'communityAdmin' || currentUser.platformRole === 'platformAdmin';

    // Enforcement of Restoration Matrix:
    if (post.deletedByRole === 'author') {
      // Only Author can restore Author-deleted items
      if (!isAuthor) {
        return res.status(403).json({ error: 'Only the original Author can restore an Author-deleted post.' });
      }
    } else if (post.deletedByRole === 'moderator') {
      // Community Admin CAN restore Moderator-deleted items. Author CANNOT restore Moderator-deleted items.
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only a Community Admin can restore content deleted by a Moderator.' });
      }
    } else if (post.deletedByRole === 'communityAdmin') {
      // Moderator or Author CANNOT restore Admin-deleted items. Only Community Admin can restore.
      if (!isAdmin) {
        return res.status(403).json({ error: 'Neither Moderator nor Author can restore content deleted by a Community Admin.' });
      }
    }

    post.status = 'active';
    post.deletedBy = undefined;
    post.deletedByRole = undefined;
    post.deletedAt = undefined;
    post.updatedAt = new Date().toISOString();

    db.createAuditLog(currentUser._id, 'RESTORE_POST', 'post', post._id, post.communityId);
    db.save();

    res.json({ success: true, post });
  });

  // Trash Bin (Author 30-Day Trash & Admin Community Trash)
  app.get('/api/posts/trash', (req, res) => {
    const { communityId } = req.query as { communityId?: string };
    const currentUser = (req as any).currentUser;

    let deletedPosts = db.posts.filter(p => p.status === 'deleted');

    if (communityId) {
      const role = db.getActiveRole(currentUser._id, communityId);
      if (role === 'communityAdmin' || currentUser.platformRole === 'platformAdmin') {
        deletedPosts = deletedPosts.filter(p => p.communityId === communityId);
      } else {
        deletedPosts = deletedPosts.filter(p => p.communityId === communityId && p.authorId === currentUser._id);
      }
    } else {
      deletedPosts = deletedPosts.filter(p => p.authorId === currentUser._id);
    }

    const enriched = deletedPosts.map(p => ({
      ...p,
      author: db.getUserById(p.authorId),
      deletedByUser: db.getUserById(p.deletedBy || '')
    }));

    res.json({ trash: enriched });
  });

  // 7. Comments & Nested Replies (Section 26, 49)
  app.get('/api/posts/:id/comments', (req, res) => {
    const comments = db.comments.filter(c => c.postId === req.params.id && c.status === 'active');
    
    // Build tree
    const rootComments: any[] = [];
    const map = new Map();

    comments.forEach(c => {
      const author = db.getUserById(c.authorId);
      map.set(c._id, { ...c, author, replies: [] });
    });

    comments.forEach(c => {
      const node = map.get(c._id);
      if (c.parentCommentId && map.has(c.parentCommentId)) {
        map.get(c.parentCommentId).replies.push(node);
      } else {
        rootComments.push(node);
      }
    });

    res.json({ comments: rootComments });
  });

  app.post('/api/posts/:id/comments', (req, res) => {
    const post = db.posts.find(p => p._id === req.params.id);
    if (!post || post.status !== 'active') return res.status(404).json({ error: 'Post not found.' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, post.communityId);

    if (role === 'guest' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'You must be a member of this community to comment.' });
    }

    const { content, parentCommentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    const comment = {
      _id: `comment-${Date.now()}`,
      postId: post._id,
      authorId: currentUser._id,
      parentCommentId: parentCommentId || null,
      content: content.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.comments.push(comment);
    post.commentCount = (post.commentCount || 0) + 1;

    // Notify post author or parent comment author
    if (parentCommentId) {
      const parent = db.comments.find(c => c._id === parentCommentId);
      if (parent && parent.authorId !== currentUser._id) {
        db.createNotification(
          parent.authorId,
          'comment_reply',
          'New Reply to your Comment',
          `${currentUser.firstName} replied to your comment on "${post.title}".`,
          'comment',
          comment._id
        );
      }
    } else if (post.authorId !== currentUser._id) {
      db.createNotification(
        post.authorId,
        'comment_reply',
        'New Comment on your Post',
        `${currentUser.firstName} commented on "${post.title}".`,
        'post',
        post._id
      );
    }

    db.save();
    res.json({ success: true, comment: { ...comment, author: currentUser, replies: [] } });
  });

  app.delete('/api/comments/:id', (req, res) => {
    const comment = db.comments.find(c => c._id === req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    const post = db.posts.find(p => p._id === comment.postId);
    const currentUser = (req as any).currentUser;
    const role = post ? db.getActiveRole(currentUser._id, post.communityId) : 'guest';
    const isAuthor = comment.authorId === currentUser._id;
    const isMod = role === 'moderator';
    const isAdmin = role === 'communityAdmin' || currentUser.platformRole === 'platformAdmin';

    if (!isAuthor && !isMod && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
    }

    comment.status = 'deleted';
    comment.deletedBy = currentUser._id;
    comment.deletedByRole = isAuthor ? 'author' : (isAdmin ? 'communityAdmin' : 'moderator');
    comment.deletedAt = new Date().toISOString();

    if (post && post.commentCount > 0) {
      post.commentCount--;
    }

    db.save();
    res.json({ success: true, message: 'Comment soft-deleted.' });
  });

  // 8. Reactions (Section 27: like, helpful, heart, celebrate)
  app.post('/api/posts/:id/reactions', (req, res) => {
    const post = db.posts.find(p => p._id === req.params.id);
    if (!post || post.status !== 'active') return res.status(404).json({ error: 'Post not found.' });

    const currentUser = (req as any).currentUser;
    const { reactionType } = req.body as { reactionType: 'like' | 'helpful' | 'heart' | 'celebrate' };
    const validTypes = ['like', 'helpful', 'heart', 'celebrate'];
    const type = validTypes.includes(reactionType) ? reactionType : 'like';

    const existingIdx = db.reactions.findIndex(r => r.postId === post._id && r.userId === currentUser._id);
    let userReaction: string | null = null;

    if (existingIdx !== -1) {
      const current = db.reactions[existingIdx];
      if (current.reactionType === type) {
        // Untoggle
        db.reactions.splice(existingIdx, 1);
        userReaction = null;
      } else {
        // Change type
        current.reactionType = type;
        userReaction = type;
      }
    } else {
      // Add reaction
      db.reactions.push({
        _id: `react-${Date.now()}`,
        userId: currentUser._id,
        postId: post._id,
        reactionType: type,
        createdAt: new Date().toISOString()
      });
      userReaction = type;

      if (post.authorId !== currentUser._id) {
        db.createNotification(
          post.authorId,
          'post_reaction',
          'Post Reaction',
          `${currentUser.firstName} reacted (${type}) to your post "${post.title}".`,
          'post',
          post._id
        );
      }
    }

    const postReactions = db.reactions.filter(r => r.postId === post._id);
    post.likeCount = postReactions.length;

    const reactionsSummary: Record<string, number> = {
      like: 0,
      helpful: 0,
      heart: 0,
      celebrate: 0
    };
    postReactions.forEach(r => {
      const rt = r.reactionType || 'like';
      reactionsSummary[rt] = (reactionsSummary[rt] || 0) + 1;
    });

    db.save();
    res.json({ success: true, likeCount: post.likeCount, userReaction, reactionsSummary });
  });

  // 9. Events & Proposals (Section 30-33, 51-52)
  app.get('/api/events', (req, res) => {
    const { communityId, status, upcomingOnly } = req.query as { communityId?: string; status?: string; upcomingOnly?: string };
    const currentUser = (req as any).currentUser;

    let list = db.events.filter(e => e.status !== 'cancelled');

    if (communityId) {
      list = list.filter(e => e.communityId === communityId);
    }

    const role = communityId && currentUser ? db.getActiveRole(currentUser._id, communityId) : 'guest';
    const isLeadership = role === 'communityAdmin' || role === 'moderator' || currentUser?.platformRole === 'platformAdmin';

    // Non-leaders only see approved events
    if (!isLeadership) {
      list = list.filter(e => e.approvalStatus === 'approved');
    }

    if (status && status !== 'All') {
      list = list.filter(e => e.approvalStatus === status);
    }

    if (upcomingOnly === 'true') {
      const now = new Date().toISOString();
      list = list.filter(e => e.startTime >= now);
    }

    list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const enriched = list.map(e => {
      const creator = db.getUserById(e.createdBy);
      const comm = db.getCommunityByIdOrSlug(e.communityId);
      const userParticipant = currentUser ? db.eventParticipants.find(ep => ep.eventId === e._id && ep.userId === currentUser._id && ep.participationStatus !== 'cancelled') : null;
      
      const goingParticipants = db.eventParticipants.filter(ep => ep.eventId === e._id && ep.participationStatus === 'going');
      const waitlistParticipants = db.eventParticipants.filter(ep => ep.eventId === e._id && ep.participationStatus === 'waitlist');

      const participants = goingParticipants
        .map(ep => db.getUserById(ep.userId))
        .filter(Boolean);

      return {
        ...e,
        creator,
        communityName: comm?.name,
        participantCount: goingParticipants.length,
        waitlistCount: waitlistParticipants.length,
        userRsvp: userParticipant ? userParticipant.participationStatus : null,
        participants
      };
    });

    res.json({ events: enriched });
  });

  // Create Event Proposal (Community Admin creates approved; Member submits proposal)
  app.post('/api/events', (req, res) => {
    const { communityId, title, description, location, startTime, endTime, coverImage, capacity } = req.body;
    if (!communityId || !title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Community, title, start time, and end time are required.' });
    }

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, communityId);

    if (role === 'guest' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'You must be an active member to propose events.' });
    }

    const comm = db.getCommunityByIdOrSlug(communityId);
    const isAdmin = role === 'communityAdmin' || currentUser.platformRole === 'platformAdmin';
    const isApprovedInstantly = isAdmin;

    const event = {
      _id: `event-${Date.now()}`,
      communityId,
      createdBy: currentUser._id,
      title,
      description: description || '',
      location: location || 'Community Venue',
      startTime,
      endTime,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
      capacity: capacity ? Number(capacity) : 50,
      status: 'active',
      approvalStatus: isApprovedInstantly ? 'approved' : 'pending',
      approvedBy: isApprovedInstantly ? currentUser._id : undefined,
      approvedByRole: isApprovedInstantly ? (role === 'communityAdmin' ? 'communityAdmin' : 'platformAdmin') : undefined,
      participantCount: 1,
      waitlistCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.events.unshift(event);

    // Creator auto-RSVPs
    db.eventParticipants.push({
      _id: `ep-${Date.now()}`,
      eventId: event._id,
      userId: currentUser._id,
      participationStatus: 'going',
      joinedAt: new Date().toISOString()
    });

    if (!isApprovedInstantly && comm) {
      // Notify Community Admins & Mods for review (Section 31 & 33)
      const leaders = db.communityMemberships.filter(m => m.communityId === comm._id && (m.role === 'communityAdmin' || m.role === 'moderator') && m.membershipStatus === 'active');
      
      if (leaders.length === 0 && comm.adminCount === 0) {
        // Admin-less community fallback: notify platform admin (Section 9 & 31)
        const pAdmin = db.users.find(u => u.platformRole === 'platformAdmin');
        if (pAdmin) {
          db.createNotification(
            pAdmin._id,
            'event_proposal',
            'Event Proposal in Admin-less Community',
            `${currentUser.firstName} proposed event "${title}" in ${comm.name}. Platform Admin review required.`,
            'event',
            event._id
          );
        }
      } else {
        leaders.forEach(l => {
          db.createNotification(
            l.userId,
            'event_proposal',
            'New Event Proposal for Review',
            `${currentUser.firstName} proposed "${title}" in ${comm.name}.`,
            'event',
            event._id
          );
        });
      }
    }

    db.save();
    res.json({ success: true, event: { ...event, creator: currentUser, userRsvp: 'going' } });
  });

  // Final Event Approval (Section 31, 33: Community Admin has final authority; Platform Admin if admin-less)
  app.post('/api/events/:id/approve', (req, res) => {
    const event = db.events.find(e => e._id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, event.communityId);
    const comm = db.getCommunityByIdOrSlug(event.communityId);

    const isCommAdmin = role === 'communityAdmin';
    const isPlatformAdminFallback = comm?.adminCount === 0 && currentUser.platformRole === 'platformAdmin';

    if (!isCommAdmin && !isPlatformAdminFallback) {
      return res.status(403).json({ error: 'Only Community Admins (or Platform Admin for admin-less communities) have final event approval authority.' });
    }

    event.approvalStatus = 'approved';
    event.approvedBy = currentUser._id;
    event.approvedByRole = isCommAdmin ? 'communityAdmin' : 'platformAdmin';
    event.updatedAt = new Date().toISOString();

    db.createNotification(
      event.createdBy,
      'event_approved',
      'Event Proposal Approved! 🎉',
      `Your event "${event.title}" has been approved and is now live on the community calendar.`,
      'event',
      event._id
    );

    db.createAuditLog(currentUser._id, 'APPROVE_EVENT', 'event', event._id, event.communityId);
    db.save();
    res.json({ success: true, event });
  });

  app.post('/api/events/:id/reject', (req, res) => {
    const event = db.events.find(e => e._id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, event.communityId);

    if (role !== 'communityAdmin' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Only Community Admins can reject event proposals.' });
    }

    event.approvalStatus = 'rejected';
    event.updatedAt = new Date().toISOString();

    db.createNotification(
      event.createdBy,
      'event_rejected',
      'Event Proposal Update',
      `Your proposal for "${event.title}" was not approved by community administration.`,
      'event',
      event._id
    );

    db.save();
    res.json({ success: true, event });
  });

  // RSVP to Event with Waitlist & Auto-Promotion (Section 32, 283-285)
  app.post('/api/events/:id/rsvp', (req, res) => {
    const event = db.events.find(e => e._id === req.params.id);
    if (!event || event.status !== 'active' || event.approvalStatus !== 'approved') {
      return res.status(404).json({ error: 'Event not found or not currently active.' });
    }

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, event.communityId);

    if (role === 'guest' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'You must be an active member of this community to RSVP.' });
    }

    const { participationStatus } = req.body as { participationStatus: 'going' | 'interested' | 'cancelled' };
    let ep = db.eventParticipants.find(p => p.eventId === event._id && p.userId === currentUser._id);
    const prevStatus = ep ? ep.participationStatus : null;

    let targetStatus: 'going' | 'interested' | 'cancelled' | 'waitlist' = participationStatus;
    let message = 'RSVP updated successfully.';

    // Check Capacity & Waitlist for 'going'
    if (participationStatus === 'going') {
      const currentGoingCount = db.eventParticipants.filter(p => p.eventId === event._id && p.participationStatus === 'going' && p.userId !== currentUser._id).length;
      if (event.capacity && currentGoingCount >= event.capacity) {
        targetStatus = 'waitlist';
        message = 'Event is at full capacity. You have been added to the waitlist.';
      } else {
        targetStatus = 'going';
      }
    }

    if (ep) {
      ep.participationStatus = targetStatus;
      if (targetStatus === 'cancelled') {
        ep.cancelledAt = new Date().toISOString();
      }
    } else {
      ep = {
        _id: `ep-${Date.now()}`,
        eventId: event._id,
        userId: currentUser._id,
        participationStatus: targetStatus,
        joinedAt: new Date().toISOString()
      };
      db.eventParticipants.push(ep);
    }

    // If a confirmed 'going' user cancelled, auto-promote first waitlisted member (Section 32)
    if (prevStatus === 'going' && targetStatus !== 'going') {
      const nextWaitlist = db.eventParticipants.find(p => p.eventId === event._id && p.participationStatus === 'waitlist');
      if (nextWaitlist) {
        nextWaitlist.participationStatus = 'going';
        const waitlistUser = db.getUserById(nextWaitlist.userId);
        db.createNotification(
          nextWaitlist.userId,
          'waitlist_promoted',
          'Promoted from Waitlist! 🎉',
          `A spot opened up for "${event.title}"! You are now confirmed as Going.`,
          'event',
          event._id
        );
        db.createAuditLog(currentUser._id, 'PROMOTE_EVENT_WAITLIST', 'event', event._id, event.communityId, {
          promotedUser: waitlistUser?.username
        });
      }
    }

    // Recalculate participantCount & waitlistCount
    const goingCount = db.eventParticipants.filter(p => p.eventId === event._id && p.participationStatus === 'going').length;
    const waitlistCount = db.eventParticipants.filter(p => p.eventId === event._id && p.participationStatus === 'waitlist').length;
    event.participantCount = goingCount;
    event.waitlistCount = waitlistCount;

    db.save();
    res.json({
      success: true,
      message,
      participantCount: event.participantCount,
      waitlistCount: event.waitlistCount,
      userRsvp: targetStatus
    });
  });

  // 10. In-App Notifications (Section 34, 53)
  app.get('/api/notifications', (req, res) => {
    try {
      const currentUser = (req as any).currentUser;
      if (!currentUser) {
        return res.json({ notifications: [], unreadCount: 0 });
      }
      const userNotifs = (db.notifications || [])
        .filter(n => n.recipientId === currentUser._id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const unreadCount = userNotifs.filter(n => !n.isRead).length;
      res.json({ notifications: userNotifs, unreadCount });
    } catch (e: any) {
      console.error('Error fetching notifications:', e);
      res.json({ notifications: [], unreadCount: 0 });
    }
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    try {
      const notif = (db.notifications || []).find(n => n._id === req.params.id);
      if (notif) {
        notif.isRead = true;
        notif.readAt = new Date().toISOString();
        db.save();
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error('Error marking notification read:', e);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  app.post('/api/notifications/mark-all-read', (req, res) => {
    try {
      const currentUser = (req as any).currentUser;
      if (currentUser && db.notifications) {
        db.notifications.forEach(n => {
          if (n.recipientId === currentUser._id) {
            n.isRead = true;
            n.readAt = new Date().toISOString();
          }
        });
        db.save();
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error('Error marking all notifications read:', e);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  });

  // 11. Reports & Moderation Queue (Section 37, 54)
  app.get('/api/reports', (req, res) => {
    const { communityId } = req.query as { communityId?: string };
    const currentUser = (req as any).currentUser;

    let list = db.reports;
    if (communityId) {
      const role = db.getActiveRole(currentUser._id, communityId);
      if (role !== 'communityAdmin' && role !== 'moderator' && currentUser.platformRole !== 'platformAdmin') {
        return res.status(403).json({ error: 'Only Community Admins and Moderators can view reports.' });
      }
      list = list.filter(r => r.communityId === communityId);
    } else if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Access restricted.' });
    }

    const enriched = list.map(r => ({
      ...r,
      reporter: db.getUserById(r.reporterId)
    }));

    res.json({ reports: enriched });
  });

  app.post('/api/reports', (req, res) => {
    const { targetType, targetId, communityId, reason, description, targetSnippet } = req.body;
    const currentUser = (req as any).currentUser;

    const report = {
      _id: `rep-${Date.now()}`,
      reporterId: currentUser._id,
      targetType,
      targetId,
      targetSnippet: targetSnippet || '',
      communityId,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    db.reports.unshift(report);

    // Notify community moderators and admins
    const modsAndAdmins = db.communityMemberships.filter(m => m.communityId === communityId && (m.role === 'moderator' || m.role === 'communityAdmin') && m.membershipStatus === 'active');
    modsAndAdmins.forEach(m => {
      db.createNotification(
        m.userId,
        'content_moderated',
        'New Content Report Submitted',
        `A member reported content for "${reason}". Please review the moderation queue.`,
        'community',
        communityId
      );
    });

    db.save();
    res.json({ success: true, report });
  });

  app.post('/api/reports/:id/resolve', (req, res) => {
    const report = db.reports.find(r => r._id === req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const currentUser = (req as any).currentUser;
    const role = db.getActiveRole(currentUser._id, report.communityId);

    if (role !== 'communityAdmin' && role !== 'moderator' && currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Permission denied.' });
    }

    const { action, resolution } = req.body as { action: 'delete_content' | 'no_action'; resolution?: string };
    report.status = 'resolved';
    report.reviewedBy = currentUser._id;
    report.reviewedAt = new Date().toISOString();
    report.resolution = resolution || (action === 'delete_content' ? 'Content soft-deleted by moderator/admin' : 'Marked resolved with no action');

    // If deleting reported content
    if (action === 'delete_content') {
      if (report.targetType === 'post') {
        const post = db.posts.find(p => p._id === report.targetId);
        if (post) {
          post.status = 'deleted';
          post.deletedBy = currentUser._id;
          post.deletedByRole = role === 'communityAdmin' ? 'communityAdmin' : 'moderator';
          post.deletedAt = new Date().toISOString();
        }
      } else if (report.targetType === 'comment') {
        const comment = db.comments.find(c => c._id === report.targetId);
        if (comment) {
          comment.status = 'deleted';
          comment.deletedBy = currentUser._id;
          comment.deletedByRole = role === 'communityAdmin' ? 'communityAdmin' : 'moderator';
          comment.deletedAt = new Date().toISOString();
        }
      }
    }

    db.createAuditLog(currentUser._id, 'RESOLVE_REPORT', 'report', report._id, report.communityId, { action, resolution });
    db.save();
    res.json({ success: true, report });
  });

  // 12. Audit Logs (Section 57)
  app.get('/api/audit-logs', (req, res) => {
    const { communityId } = req.query as { communityId?: string };
    const currentUser = (req as any).currentUser;

    let list = db.auditLogs;
    if (communityId) {
      const role = db.getActiveRole(currentUser._id, communityId);
      if (role !== 'communityAdmin' && currentUser.platformRole !== 'platformAdmin') {
        return res.status(403).json({ error: 'Only Community Admins and Platform Admin can view audit logs.' });
      }
      list = list.filter(l => l.communityId === communityId);
    } else if (currentUser.platformRole !== 'platformAdmin') {
      return res.status(403).json({ error: 'Platform Admin privileges required.' });
    }

    const enriched = list.map(l => ({
      ...l,
      actor: db.getUserById(l.actorId)
    }));

    res.json({ logs: enriched });
  });

  // Reset database endpoint for demo testing
  app.post('/api/reset-db', (req, res) => {
    db.resetToSeed();
    res.json({ success: true, message: 'Database reset to initial demo state.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hometown Hub server running on http://localhost:${PORT}`);
  });
}

startServer();
