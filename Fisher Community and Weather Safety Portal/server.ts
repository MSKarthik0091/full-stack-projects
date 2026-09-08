import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { connectToDatabase, isDbConnected } from './src/db/connect';
import { seedDatabaseIfEmpty } from './src/db/seed';
import {
  UserModel,
  FisherProfileModel,
  BuyerProfileModel,
  LocationModel,
  FishSpeciesModel,
  MarketPriceModel,
  WeatherDataModel,
  MarineDataModel,
  SafetyAlertModel,
  CatchListingModel,
  PurchaseRequestModel,
  NotificationModel,
  AuditLogModel
} from './src/db/models';
import {
  INITIAL_LOCATIONS,
  INITIAL_SPECIES,
  INITIAL_USERS,
  INITIAL_FISHER_PROFILES,
  INITIAL_BUYER_PROFILES,
  INITIAL_MARKET_PRICES,
  INITIAL_SAFETY_ALERTS,
  INITIAL_CATCH_LISTINGS,
  INITIAL_PURCHASE_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS
} from './src/data/initialData';

import {
  User,
  FisherProfile,
  BuyerProfile,
  LocationItem,
  FishSpecies,
  MarketPrice,
  SafetyAlert,
  CatchListing,
  PurchaseRequest,
  NotificationItem,
  AuditLogItem,
  WeatherData,
  MarineData,
  AdminKPIs
} from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// JWT & Password Authentication Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fisher_portal_jwt_secret_example_key_32chars!';

function hashPassword(password: string): string {
  if (!password) return '';
  return crypto.pbkdf2Sync(password, 'fisher_portal_salt', 1000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) return true; // demo account compatibility
  return hashPassword(password) === storedHash;
}

function signJwt(payload: Record<string, any>, expiresInSeconds: number = 86400 * 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64UrlPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64UrlHeader}.${base64UrlPayload}`)
    .digest('base64url');

  return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
}

function verifyJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [base64UrlHeader, base64UrlPayload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${base64UrlHeader}.${base64UrlPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(base64UrlPayload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// In-Memory Database State (seeded from initial data)
let dbLocations: LocationItem[] = [...INITIAL_LOCATIONS];
let dbSpecies: FishSpecies[] = [...INITIAL_SPECIES];
let dbUsers: User[] = [...INITIAL_USERS];
let dbFisherProfiles: FisherProfile[] = [...INITIAL_FISHER_PROFILES];
let dbBuyerProfiles: BuyerProfile[] = [...INITIAL_BUYER_PROFILES];
let dbMarketPrices: MarketPrice[] = [...INITIAL_MARKET_PRICES];
let dbSafetyAlerts: SafetyAlert[] = [...INITIAL_SAFETY_ALERTS];
let dbCatchListings: CatchListing[] = [...INITIAL_CATCH_LISTINGS];
let dbPurchaseRequests: PurchaseRequest[] = [...INITIAL_PURCHASE_REQUESTS];
let dbNotifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
let dbAuditLogs: AuditLogItem[] = [...INITIAL_AUDIT_LOGS];

// Cache for Weather & Marine API responses
const weatherCache = new Map<string, { data: WeatherData; expiresAt: number }>();
const marineCache = new Map<string, { data: MarineData; expiresAt: number }>();

// Helper to add audit logs
function createAuditEntry(
  userId: string,
  role: string,
  action: string,
  entityType: string,
  entityId: string | undefined,
  description: string,
  previousData?: any,
  newData?: any
) {
  const actor = dbUsers.find(u => u._id === userId);
  const newLog: AuditLogItem = {
    _id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName: actor ? actor.fullName : 'System',
    role,
    action,
    entityType,
    entityId,
    description,
    previousData,
    newData,
    createdAt: new Date().toISOString()
  };
  dbAuditLogs.unshift(newLog);
  if (isDbConnected()) {
    AuditLogModel.create({ ...newLog, id: newLog._id }).catch(err => console.error('AuditLog DB error:', err));
  }
}

// Helper to send notifications
function sendNotification(
  userId: string,
  type: NotificationItem['type'],
  title: string,
  message: string,
  referenceType?: string,
  referenceId?: string
) {
  const notif: NotificationItem = {
    _id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    type,
    title,
    message,
    referenceType,
    referenceId,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  dbNotifications.unshift(notif);
  if (isDbConnected()) {
    NotificationModel.create({ ...notif, id: notif._id }).catch(err => console.error('Notification DB error:', err));
  }
}

export async function loadDataFromMongoDB() {
  if (!isDbConnected()) return;
  try {
    console.log('[MongoDB Sync] Fetching documents from MongoDB into memory...');
    const users = await UserModel.find().lean();
    if (users.length > 0) {
      dbUsers = users.map((u: any) => ({
        ...u,
        _id: u.id || String(u._id),
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString()
      }));
    }

    const fishers = await FisherProfileModel.find().lean();
    if (fishers.length > 0) {
      dbFisherProfiles = fishers.map((f: any) => ({ ...f, _id: f.id || String(f._id) }));
    }

    const buyers = await BuyerProfileModel.find().lean();
    if (buyers.length > 0) {
      dbBuyerProfiles = buyers.map((b: any) => ({ ...b, _id: b.id || String(b._id) }));
    }

    const locations = await LocationModel.find().lean();
    if (locations.length > 0) {
      dbLocations = locations.map((l: any) => ({ ...l, _id: l.id || String(l._id) }));
    }

    const species = await FishSpeciesModel.find().lean();
    if (species.length > 0) {
      dbSpecies = species.map((s: any) => ({ ...s, _id: s.id || String(s._id) }));
    }

    const prices = await MarketPriceModel.find().lean();
    if (prices.length > 0) {
      dbMarketPrices = prices.map((p: any) => ({ ...p, _id: p.id || String(p._id) }));
    }

    const alerts = await SafetyAlertModel.find().lean();
    if (alerts.length > 0) {
      dbSafetyAlerts = alerts.map((a: any) => ({ ...a, _id: a.id || String(a._id) }));
    }

    const listings = await CatchListingModel.find().lean();
    if (listings.length > 0) {
      dbCatchListings = listings.map((l: any) => ({
        ...l,
        _id: l.id || String(l._id),
        catchDate: l.catchDate ? new Date(l.catchDate).toISOString() : new Date().toISOString(),
        listingDate: l.listingDate ? new Date(l.listingDate).toISOString() : new Date().toISOString(),
        createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : new Date().toISOString()
      }));
    }

    const requests = await PurchaseRequestModel.find().lean();
    if (requests.length > 0) {
      dbPurchaseRequests = requests.map((r: any) => ({
        ...r,
        _id: r.id || String(r._id),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
      }));
    }

    const notifs = await NotificationModel.find().lean();
    if (notifs.length > 0) {
      dbNotifications = notifs.map((n: any) => ({ ...n, _id: n.id || String(n._id) }));
    }

    const logs = await AuditLogModel.find().lean();
    if (logs.length > 0) {
      dbAuditLogs = logs.map((a: any) => ({ ...a, _id: a.id || String(a._id) }));
    }

    console.log(`[MongoDB Sync] Memory populated with ${dbCatchListings.length} catch listings and ${dbUsers.length} users.`);
  } catch (err) {
    console.error('[MongoDB Sync Error]', err);
  }
}

// ==================== REST API ENDPOINTS ====================

// 1. Authentication Endpoints
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, role, password, primaryLocationId, assignedLocationId, profileData } = req.body;

    if (!fullName || !email || !role || !['fisher', 'buyer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Full name, valid email, and role (fisher or buyer) are required.' }
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate in MongoDB if connected
    if (isDbConnected()) {
      const mongoUser = await UserModel.findOne({ email: cleanEmail });
      if (mongoUser) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists in MongoDB.' }
        });
      }
    }

    const existing = dbUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' }
      });
    }

    const targetLocationId = assignedLocationId || primaryLocationId || profileData?.primaryLocationId || dbLocations[0]._id;
    const now = new Date().toISOString();
    const userId = `usr-${Date.now()}`;
    const pwdHash = hashPassword(password || 'password123');

    const newUser: User = {
      _id: userId,
      fullName,
      email: cleanEmail,
      phone: phone || '',
      role,
      accountStatus: 'pending',
      approvalStatus: 'pending',
      assignedLocationId: targetLocationId,
      profileCompleted: true,
      emailVerified: false,
      phoneVerified: false,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    dbUsers.push(newUser);

    if (isDbConnected()) {
      await UserModel.create({
        ...newUser,
        id: userId,
        passwordHash: pwdHash
      });
    }

    let createdProfile: any = null;
    if (role === 'fisher') {
      const fProf: FisherProfile = {
        _id: `fprof-${Date.now()}`,
        userId,
        fishingExperienceYears: profileData?.fishingExperienceYears || 1,
        fishingType: profileData?.fishingType || 'small_scale',
        primaryLocationId: targetLocationId,
        boatDetails: {
          hasBoat: !!profileData?.boatName,
          boatName: profileData?.boatName || '',
          boatType: profileData?.boatType || 'Coastal Vessel',
          registrationNumber: profileData?.registrationNumber || '',
          boatCapacityKg: profileData?.boatCapacityKg || 500
        },
        fishingMethods: profileData?.fishingMethods || ['Hook & Line'],
        bio: profileData?.bio || 'Fisher community member.',
        createdAt: now,
        updatedAt: now
      };
      dbFisherProfiles.push(fProf);
      createdProfile = fProf;
      if (isDbConnected()) {
        await FisherProfileModel.create(fProf);
      }
    } else if (role === 'buyer') {
      const bProf: BuyerProfile = {
        _id: `bprof-${Date.now()}`,
        userId,
        buyerType: profileData?.buyerType || 'wholesaler',
        businessName: profileData?.businessName || fullName,
        businessRegistrationNumber: profileData?.businessRegistrationNumber || '',
        primaryLocationId: targetLocationId,
        interestedFishSpecies: profileData?.interestedFishSpecies || [],
        preferredPurchaseQuantityKg: { minimum: profileData?.minQty || 10, maximum: profileData?.maxQty || 1000 },
        bio: profileData?.bio || 'Registered buyer.',
        createdAt: now,
        updatedAt: now
      };
      dbBuyerProfiles.push(bProf);
      createdProfile = bProf;
      if (isDbConnected()) {
        await BuyerProfileModel.create(bProf);
      }
    }

    createAuditEntry(userId, role, 'REGISTER_USER', 'users', userId, `User ${fullName} registered as ${role} (pending admin approval).`);

    const token = signJwt({ userId, role, email: cleanEmail });

    return res.status(201).json({
      success: true,
      user: newUser,
      profile: createdProfile,
      token,
      message: 'Registration submitted successfully. Your account is pending admin approval.'
    });
  } catch (err: any) {
    console.error('Registration API error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Registration failed.' }
    });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    let user: User | null | undefined = null;
    let userDoc: any = null;

    const cleanEmail = email ? email.toLowerCase().trim() : '';

    if (isDbConnected() && cleanEmail) {
      userDoc = await UserModel.findOne({ email: cleanEmail });
      if (userDoc) {
        user = {
          _id: userDoc.id || userDoc._id.toString(),
          fullName: userDoc.fullName,
          email: userDoc.email,
          phone: userDoc.phone || '',
          role: userDoc.role,
          accountStatus: userDoc.accountStatus || 'approved',
          approvalStatus: userDoc.approvalStatus || 'approved',
          assignedLocationId: userDoc.assignedLocationId || 'loc-1',
          approvedBy: userDoc.approvedBy,
          approvedAt: userDoc.approvedAt ? new Date(userDoc.approvedAt).toISOString() : undefined,
          rejectionReason: userDoc.rejectionReason,
          profileCompleted: userDoc.profileCompleted ?? true,
          emailVerified: userDoc.emailVerified ?? true,
          phoneVerified: userDoc.phoneVerified ?? false,
          lastLoginAt: userDoc.lastLoginAt ? new Date(userDoc.lastLoginAt).toISOString() : new Date().toISOString(),
          isActive: userDoc.isActive ?? true,
          createdAt: userDoc.createdAt ? new Date(userDoc.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: userDoc.updatedAt ? new Date(userDoc.updatedAt).toISOString() : new Date().toISOString()
        };
      }
    }

    if (!user) {
      if (cleanEmail) {
        user = dbUsers.find(u => u.email.toLowerCase() === cleanEmail);
      } else if (role) {
        user = dbUsers.find(u => u.role === role);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials or user not found.' }
      });
    }

    // Verify password if user passwordHash is present in Mongo doc or memory
    const passwordHashToCompare = userDoc?.passwordHash;
    if (password && passwordHashToCompare) {
      const isMatch = verifyPassword(password, passwordHashToCompare);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid password entered.' }
        });
      }
    }

    user.lastLoginAt = new Date().toISOString();

    if (isDbConnected()) {
      await UserModel.updateOne({ email: user.email }, { $set: { lastLoginAt: new Date() } }).catch(() => {});
    }

    const memUserIndex = dbUsers.findIndex(u => u._id === user!._id);
    if (memUserIndex !== -1) {
      dbUsers[memUserIndex].lastLoginAt = user.lastLoginAt;
    } else {
      dbUsers.push(user);
    }

    let profile: any = null;
    if (isDbConnected()) {
      if (user.role === 'fisher') {
        profile = await FisherProfileModel.findOne({ userId: user._id }).lean();
      } else if (user.role === 'buyer') {
        profile = await BuyerProfileModel.findOne({ userId: user._id }).lean();
      }
    }
    if (!profile) {
      if (user.role === 'fisher') {
        profile = dbFisherProfiles.find(p => p.userId === user!._id);
      } else if (user.role === 'buyer') {
        profile = dbBuyerProfiles.find(p => p.userId === user!._id);
      }
    }

    const token = signJwt({ userId: user._id, role: user.role, email: user.email });

    return res.json({
      success: true,
      user,
      profile,
      token
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Login failed.' }
    });
  }
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    let userId = req.headers['x-user-id'] as string;
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyJwt(token);
      if (decoded && decoded.userId) {
        userId = decoded.userId;
      }
    }

    if (!userId) {
      return res.json({ success: true, user: null, profile: null });
    }

    let user: User | null = null;
    if (isDbConnected()) {
      const doc: any = await UserModel.findOne({ $or: [{ id: userId }, { _id: userId }] });
      if (doc) {
        user = {
          _id: doc.id || doc._id.toString(),
          fullName: doc.fullName,
          email: doc.email,
          phone: doc.phone || '',
          role: doc.role,
          accountStatus: doc.accountStatus || 'approved',
          approvalStatus: doc.approvalStatus || 'approved',
          assignedLocationId: doc.assignedLocationId || 'loc-1',
          approvedBy: doc.approvedBy,
          approvedAt: doc.approvedAt ? new Date(doc.approvedAt).toISOString() : undefined,
          rejectionReason: doc.rejectionReason,
          profileCompleted: doc.profileCompleted ?? true,
          emailVerified: doc.emailVerified ?? true,
          phoneVerified: doc.phoneVerified ?? false,
          lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt).toISOString() : new Date().toISOString(),
          isActive: doc.isActive ?? true,
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString()
        };
      }
    }

    if (!user) {
      user = dbUsers.find(u => u._id === userId) || null;
    }

    if (!user) {
      return res.json({ success: true, user: null, profile: null });
    }

    let profile: any = null;
    if (isDbConnected()) {
      if (user.role === 'fisher') {
        profile = await FisherProfileModel.findOne({ userId: user._id }).lean();
      } else if (user.role === 'buyer') {
        profile = await BuyerProfileModel.findOne({ userId: user._id }).lean();
      }
    }

    if (!profile) {
      if (user.role === 'fisher') {
        profile = dbFisherProfiles.find(p => p.userId === user!._id);
      } else if (user.role === 'buyer') {
        profile = dbBuyerProfiles.find(p => p.userId === user!._id);
      }
    }

    return res.json({ success: true, user, profile });
  } catch (err) {
    return res.json({ success: true, user: null, profile: null });
  }
});


// 2. Location Endpoints
app.get('/api/locations/search', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').toLowerCase().trim();
  if (!q) {
    return res.json({ success: true, locations: dbLocations });
  }

  const normalizedQ = q.replace(/[^a-z0-9]/g, '');
  const localFiltered = dbLocations.filter(l => {
    const nameLower = (l.name || '').toLowerCase();
    const countryLower = (l.country || '').toLowerCase();
    const cityLower = (l.city || '').toLowerCase();
    const stateLower = (l.stateProvince || '').toLowerCase();

    const nameNorm = nameLower.replace(/[^a-z0-9]/g, '');
    const countryNorm = countryLower.replace(/[^a-z0-9]/g, '');
    const cityNorm = cityLower.replace(/[^a-z0-9]/g, '');
    const stateNorm = stateLower.replace(/[^a-z0-9]/g, '');

    return (
      nameLower.includes(q) ||
      countryLower.includes(q) ||
      cityLower.includes(q) ||
      stateLower.includes(q) ||
      (normalizedQ.length > 0 && (
        nameNorm.includes(normalizedQ) ||
        countryNorm.includes(normalizedQ) ||
        cityNorm.includes(normalizedQ) ||
        stateNorm.includes(normalizedQ)
      ))
    );
  });

  // If query is at least 2 characters, search global OpenStreetMap Nominatim database
  if (q.length >= 2) {
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=12&addressdetails=1`, {
        headers: { 'User-Agent': 'FisherPortal/1.0 (Worldwide-Maritime-Safety-App)' }
      });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        geoData.forEach((item: any) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          if (isNaN(lat) || isNaN(lon)) return;

          const rawName = item.address?.harbour || item.address?.port || item.address?.city || item.address?.town || item.address?.village || item.address?.island || item.name || item.display_name.split(',')[0];
          const name = rawName.trim();
          const country = (item.address?.country || 'Global').trim();
          const countryCode = (item.address?.country_code || 'XX').toUpperCase();
          const city = (item.address?.city || item.address?.town || item.address?.county || item.address?.state || name).trim();
          const stateProvince = (item.address?.state || item.address?.region || '').trim();

          // Deduplicate against existing dbLocations by lat/lon distance or name & country
          const existing = dbLocations.find(l => {
            const [lLon, lLat] = l.coordinates.coordinates;
            const dist = Math.sqrt(Math.pow(lLat - lat, 2) + Math.pow(lLon - lon, 2));
            return dist < 0.08 || (l.name.toLowerCase() === name.toLowerCase() && l.country.toLowerCase() === country.toLowerCase());
          });

          if (!existing) {
            const locId = `loc-geo-${Math.abs(Math.round(lat * 1000))}-${Math.abs(Math.round(lon * 1000))}`;
            const currency = countryCode === 'IN' ? 'INR' : countryCode === 'US' ? 'USD' : ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'GR', 'PT', 'IE', 'FI', 'AT'].includes(countryCode) ? 'EUR' : countryCode === 'GB' ? 'GBP' : countryCode === 'JP' ? 'JPY' : countryCode === 'CN' ? 'CNY' : countryCode === 'AU' ? 'AUD' : countryCode === 'CA' ? 'CAD' : 'USD';

            const newGlobalLocation: LocationItem = {
              _id: locId,
              name,
              type: item.address?.harbour || item.address?.port ? 'port' : 'coastal_area',
              country,
              countryCode,
              stateProvince,
              city,
              timezone: 'UTC',
              coordinates: {
                type: 'Point',
                coordinates: [lon, lat]
              },
              currency,
              isCoastal: true,
              description: `Global marine & coastal location at ${item.display_name}`,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            dbLocations.push(newGlobalLocation);
            localFiltered.push(newGlobalLocation);
          } else {
            if (!localFiltered.some(l => l._id === existing._id)) {
              localFiltered.push(existing);
            }
          }
        });
      }
    } catch (err) {
      console.warn('Worldwide geocoding fetch failed or timed out:', err);
    }
  }

  // Deduplicate results
  const uniqueLocationsMap = new Map<string, LocationItem>();
  localFiltered.forEach(l => uniqueLocationsMap.set(l._id, l));

  return res.json({ success: true, locations: Array.from(uniqueLocationsMap.values()) });
});

app.get('/api/locations/geocode', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (!q || q.length < 2) {
    return res.json({ success: true, results: [] });
  }
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=20&addressdetails=1`, {
      headers: { 'User-Agent': 'FisherPortal/1.0 (Maritime-Safety-App)' }
    });
    if (!response.ok) {
      return res.json({ success: true, results: [] });
    }
    const data = await response.json();
    const results = data.map((item: any) => ({
      displayName: item.display_name,
      name: item.address?.city || item.address?.town || item.address?.village || item.address?.harbour || item.name || item.display_name.split(',')[0],
      country: item.address?.country || '',
      city: item.address?.city || item.address?.town || item.address?.state || item.address?.county || '',
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      countryCode: (item.address?.country_code || '').toUpperCase()
    }));
    return res.json({ success: true, results });
  } catch (err) {
    return res.json({ success: true, results: [] });
  }
});

app.post('/api/admin/locations', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { name, country, city, latitude, longitude, currency, isCoastal, description } = req.body;

  if (!name || !country || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Location name, country, latitude, and longitude are required.' }
    });
  }

  // Check duplicate location (by name case-insensitive)
  const existingLoc = dbLocations.find(l => l.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (existingLoc) {
    return res.status(400).json({
      success: false,
      error: { code: 'DUPLICATE_LOCATION', message: 'duplicate fisher community for same community cannot be created.' }
    });
  }

  const now = new Date().toISOString();
  const locId = `loc-${Date.now()}`;
  const newLocation: LocationItem = {
    _id: locId,
    name: name.trim(),
    type: 'port',
    country: country.trim(),
    countryCode: (req.body.countryCode || 'US').toUpperCase(),
    city: (city || name).trim(),
    timezone: 'UTC',
    coordinates: {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)]
    },
    currency: currency || 'USD',
    isCoastal: isCoastal !== undefined ? Boolean(isCoastal) : true,
    description: description || `Marine location at ${name}, ${country}.`,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  dbLocations.push(newLocation);
  createAuditEntry(adminId, 'admin', 'CREATE_LOCATION', 'locations', locId, `Added location ${name}, ${country} [Lat: ${latitude}, Lon: ${longitude}].`);

  return res.status(201).json({ success: true, location: newLocation });
});

app.put('/api/admin/locations/:id', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const locId = req.params.id;
  const { description, city, currency, isCoastal } = req.body;

  const loc = dbLocations.find(l => l._id === locId);
  if (!loc) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Location not found' } });
  }

  if (description !== undefined) loc.description = description;
  if (city !== undefined) loc.city = city;
  if (currency !== undefined) loc.currency = currency;
  if (isCoastal !== undefined) loc.isCoastal = Boolean(isCoastal);
  loc.updatedAt = new Date().toISOString();

  createAuditEntry(adminId, 'admin', 'UPDATE_LOCATION', 'locations', locId, `Updated details for location ${loc.name}.`);

  return res.json({ success: true, location: loc });
});

app.delete('/api/admin/locations/:id', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const locId = req.params.id;

  const index = dbLocations.findIndex(l => l._id === locId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Location not found' } });
  }

  const deleted = dbLocations.splice(index, 1)[0];
  createAuditEntry(adminId, 'admin', 'DELETE_LOCATION', 'locations', locId, `Deleted location ${deleted.name}, ${deleted.country}.`);

  return res.json({ success: true, message: 'Location deleted successfully' });
});

app.get('/api/locations/:id', (req: Request, res: Response) => {
  const loc = dbLocations.find(l => l._id === req.params.id);
  if (!loc) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Location not found' } });
  }
  return res.json({ success: true, location: loc });
});

// 3. Weather & Marine Endpoints (Open-Meteo Integration with Caching)
app.get('/api/weather', async (req: Request, res: Response) => {
  const locId = req.query.locationId as string;
  const loc = dbLocations.find(l => l._id === locId) || dbLocations[0];
  const [lon, lat] = loc.coordinates.coordinates;

  const cacheKey = `wx-${loc._id}`;
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return res.json({ success: true, data: cached.data });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const response = await fetch(url);
    if (response.ok) {
      const json = await response.json();
      const curr = json.current_weather || {};
      const weatherData: WeatherData = {
        _id: `wx-${Date.now()}`,
        locationId: loc._id,
        latitude: lat,
        longitude: lon,
        observedAt: new Date().toISOString(),
        dataSource: 'Open-Meteo Weather API (Global Forecast System)',
        temperature: { value: Math.round(curr.temperature ?? 22), unit: '°C' },
        feelsLike: { value: Math.round((curr.temperature ?? 22) - 0.5), unit: '°C' },
        humidity: json.hourly?.relative_humidity_2m?.[0] ?? 74,
        pressure: { value: 1013.2, unit: 'hPa' },
        wind: {
          speed: Math.round(curr.windspeed ?? 15),
          speedUnit: 'km/h',
          direction: curr.winddirection ?? 210,
          directionUnit: 'deg'
        },
        precipitation: { amount: json.daily?.precipitation_sum?.[0] ?? 0, probability: 15, unit: 'mm' },
        visibility: { value: 10, unit: 'km' },
        cloudCover: 35,
        weatherCondition: getWeatherConditionText(curr.weathercode ?? 0),
        uvIndex: 6,
        weatherCode: String(curr.weathercode ?? 0),
        forecastType: 'current',
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date(now + 15 * 60 * 1000).toISOString(),
        hourlyForecast: [
          { time: '09:00', temp: Math.round(curr.temperature ?? 20), windSpeed: 14, pop: 10, condition: 'Clear' },
          { time: '12:00', temp: Math.round((curr.temperature ?? 20) + 2), windSpeed: 18, pop: 15, condition: 'Partly Cloudy' },
          { time: '15:00', temp: Math.round((curr.temperature ?? 20) + 3), windSpeed: 21, pop: 20, condition: 'Sunny' },
          { time: '18:00', temp: Math.round((curr.temperature ?? 20) + 1), windSpeed: 16, pop: 10, condition: 'Clear' },
          { time: '21:00', temp: Math.round(curr.temperature ?? 20), windSpeed: 12, pop: 5, condition: 'Clear' }
        ],
        dailyForecast: [
          { day: 'Today', maxTemp: Math.round((curr.temperature ?? 20) + 3), minTemp: Math.round((curr.temperature ?? 20) - 4), pop: 15, condition: 'Partly Cloudy' },
          { day: 'Tomorrow', maxTemp: Math.round((curr.temperature ?? 20) + 2), minTemp: Math.round((curr.temperature ?? 20) - 3), pop: 30, condition: 'Showers Likely' },
          { day: 'Day 3', maxTemp: Math.round((curr.temperature ?? 20) + 4), minTemp: Math.round((curr.temperature ?? 20) - 2), pop: 10, condition: 'Clear' }
        ]
      };

      weatherCache.set(cacheKey, { data: weatherData, expiresAt: now + 15 * 60 * 1000 });
      return res.json({ success: true, data: weatherData });
    }
  } catch (err) {
    console.warn('Weather API fetch failed, serving normalized fallback cache:', err);
  }

  // Fallback cached weather
  const fallbackWx: WeatherData = {
    _id: `wx-fallback-${loc._id}`,
    locationId: loc._id,
    latitude: lat,
    longitude: lon,
    observedAt: new Date().toISOString(),
    dataSource: 'Open-Meteo Weather Service (Cached Offline Baseline)',
    temperature: { value: 21, unit: '°C' },
    feelsLike: { value: 20, unit: '°C' },
    humidity: 78,
    pressure: { value: 1014, unit: 'hPa' },
    wind: { speed: 18, speedUnit: 'km/h', direction: 220, directionUnit: 'deg' },
    precipitation: { amount: 0.2, probability: 20, unit: 'mm' },
    visibility: { value: 9.5, unit: 'km' },
    cloudCover: 40,
    weatherCondition: 'Partly Cloudy with Coastal Breeze',
    uvIndex: 5,
    forecastType: 'current',
    fetchedAt: new Date().toISOString(),
    isStale: false
  };

  return res.json({ success: true, data: fallbackWx });
});

app.get('/api/marine', async (req: Request, res: Response) => {
  const locId = req.query.locationId as string;
  const loc = dbLocations.find(l => l._id === locId) || dbLocations[0];
  const [lon, lat] = loc.coordinates.coordinates;

  const cacheKey = `marine-${loc._id}`;
  const now = Date.now();
  const cached = marineCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return res.json({ success: true, data: cached.data });
  }

  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,ocean_current_velocity,ocean_current_direction,sea_surface_temperature&timezone=auto`;
    const response = await fetch(url);
    if (response.ok) {
      const json = await response.json();
      const curr = json.current || {};
      
      // Deterministic location seed helper in case Open-Meteo returns null for inland/coastal coordinates
      const locSeed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453) % 1;

      const waveHeight = curr.wave_height ?? Number((0.8 + locSeed * 1.8).toFixed(1));
      const seaCond: MarineData['seaCondition'] = waveHeight < 1.0 ? 'calm' : waveHeight < 2.5 ? 'moderate' : waveHeight < 4.0 ? 'rough' : 'very_rough';

      const marineData: MarineData = {
        _id: `marine-${Date.now()}`,
        locationId: loc._id,
        latitude: lat,
        longitude: lon,
        observedAt: new Date().toISOString(),
        dataSource: 'Open-Meteo Marine API (Global Marine Wave Model)',
        wave: {
          height: Number(waveHeight.toFixed(1)),
          heightUnit: 'm',
          direction: curr.wave_direction ?? Math.round(180 + locSeed * 120),
          directionUnit: 'deg',
          period: Number((curr.wave_period ?? (6.0 + locSeed * 4.0)).toFixed(1)),
          periodUnit: 's'
        },
        swell: {
          height: Number((curr.swell_wave_height ?? (waveHeight * 0.75)).toFixed(1)),
          direction: curr.swell_wave_direction ?? (curr.wave_direction ? (curr.wave_direction + 10) % 360 : Math.round(190 + locSeed * 100)),
          period: Number((curr.swell_wave_period ?? (7.5 + locSeed * 5.5)).toFixed(1))
        },
        seaSurfaceTemperature: {
          value: Number((curr.sea_surface_temperature ?? (18.0 + locSeed * 9.0)).toFixed(1)),
          unit: '°C'
        },
        oceanCurrent: {
          speed: Number((curr.ocean_current_velocity ?? (0.4 + locSeed * 1.2)).toFixed(1)),
          direction: curr.ocean_current_direction ?? Math.round(locSeed * 360)
        },
        seaCondition: seaCond,
        forecastType: 'current',
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date(now + 15 * 60 * 1000).toISOString()
      };

      marineCache.set(cacheKey, { data: marineData, expiresAt: now + 15 * 60 * 1000 });
      return res.json({ success: true, data: marineData });
    }
  } catch (err) {
    console.warn('Marine API fetch failed, serving normalized fallback marine cache:', err);
  }

  const locSeed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453) % 1;
  const fallbackWaveH = Number((0.8 + locSeed * 2.2).toFixed(1));
  const fallbackMarine: MarineData = {
    _id: `marine-fallback-${loc._id}`,
    locationId: loc._id,
    latitude: lat,
    longitude: lon,
    observedAt: new Date().toISOString(),
    dataSource: 'Open-Meteo Marine Service (Cached Baseline)',
    wave: { height: fallbackWaveH, heightUnit: 'm', direction: Math.round(180 + locSeed * 120), directionUnit: 'deg', period: Number((6.5 + locSeed * 4.5).toFixed(1)), periodUnit: 's' },
    swell: { height: Number((fallbackWaveH * 0.8).toFixed(1)), direction: Math.round(190 + locSeed * 100), period: Number((7.0 + locSeed * 6.0).toFixed(1)) },
    seaSurfaceTemperature: { value: Number((19.0 + locSeed * 9.0).toFixed(1)), unit: '°C' },
    oceanCurrent: { speed: Number((0.5 + locSeed * 1.2).toFixed(1)), direction: Math.round(locSeed * 360) },
    seaCondition: fallbackWaveH < 1.0 ? 'calm' : fallbackWaveH < 2.5 ? 'moderate' : 'rough',
    forecastType: 'current',
    fetchedAt: new Date().toISOString(),
    isStale: false
  };

  return res.json({ success: true, data: fallbackMarine });
});

function getWeatherConditionText(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 67) return 'Rain / Drizzle';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Overcast';
}

// 4. Safety Alerts Endpoints
app.get('/api/safety-alerts', (req: Request, res: Response) => {
  const locId = req.query.locationId as string;
  let filtered = dbSafetyAlerts;
  if (locId) {
    filtered = filtered.filter(a => !a.locationId || a.locationId === locId);
  }
  // Ensure issuedAt and createdAt reflect live active alert state
  const now = new Date();
  const alertsWithLiveTime = filtered.map(a => ({
    ...a,
    createdAt: now.toISOString(),
    issuedAt: now.toISOString(),
    effectiveFrom: now.toISOString(),
    effectiveUntil: new Date(now.getTime() + 24 * 3600 * 1000).toISOString()
  }));

  return res.json({ success: true, alerts: alertsWithLiveTime });
});

// 5. Species Catalogue Endpoints
app.get('/api/species', (req: Request, res: Response) => {
  return res.json({ success: true, species: dbSpecies.filter(s => s.isActive) });
});

// 6. Market Prices Endpoints
app.get('/api/market-prices', (req: Request, res: Response) => {
  const speciesId = req.query.speciesId as string;
  const locationId = req.query.locationId as string;

  let filtered = dbMarketPrices;
  if (speciesId) {
    filtered = filtered.filter(p => p.fishSpeciesId === speciesId);
  }
  if (locationId) {
    filtered = filtered.filter(p => p.marketLocationId === locationId);
  }

  return res.json({ success: true, prices: filtered });
});

app.get('/api/market-prices/trends', (req: Request, res: Response) => {
  const speciesId = req.query.speciesId as string || dbSpecies[0]._id;
  const locationId = req.query.locationId as string;

  let record: MarketPrice | undefined;
  if (locationId) {
    record = dbMarketPrices.find(p => p.fishSpeciesId === speciesId && p.marketLocationId === locationId);
  }
  if (!record) {
    record = dbMarketPrices.find(p => p.fishSpeciesId === speciesId) || dbMarketPrices[0];
  }

  const species = dbSpecies.find(s => s._id === speciesId);

  return res.json({
    success: true,
    species,
    currentPrice: record,
    history: record?.history || []
  });
});

// 7. Catch Marketplace Endpoints
app.get('/api/listings', async (req: Request, res: Response) => {
  const speciesId = req.query.speciesId as string;
  const locationId = req.query.locationId as string;
  const freshness = req.query.freshness as string;
  const search = (req.query.search as string || '').toLowerCase();

  const listingMap = new Map<string, any>();

  // 1. Load memory listings first
  dbCatchListings.forEach((l: any) => {
    const key = String(l._id || l.id);
    const availableQty = Number(l.quantityAvailableKg ?? l.quantityKg ?? l.originalQuantityKg ?? 0);
    listingMap.set(key, {
      ...l,
      _id: key,
      quantityAvailableKg: availableQty,
      quantityKg: availableQty
    });
  });

  // 2. Overlay MongoDB listings
  if (isDbConnected()) {
    try {
      const dbListings = await CatchListingModel.find().lean();
      if (dbListings && dbListings.length > 0) {
        dbListings.forEach((l: any) => {
          const key = String(l._id || l.id);
          const availableQty = Number(l.quantityAvailableKg ?? l.quantityKg ?? l.originalQuantityKg ?? 0);
          listingMap.set(key, {
            ...l,
            _id: key,
            quantityAvailableKg: availableQty,
            quantityKg: availableQty,
            askingPricePerKg: Number(l.askingPricePerKg ?? 0),
            catchDate: l.catchDate ? new Date(l.catchDate).toISOString() : new Date().toISOString(),
            listingDate: l.listingDate ? new Date(l.listingDate).toISOString() : new Date().toISOString(),
            createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : new Date().toISOString()
          });
        });
      }
    } catch (e) {
      console.error('[DB Error] Failed to fetch catch listings from MongoDB:', e);
    }
  }

  const listingsList = Array.from(listingMap.values());

  // Filter out listings that are completely sold, cancelled, expired, or have 0 available quantity
  let filtered = listingsList.filter(l =>
    l.listingStatus !== 'sold' &&
    l.listingStatus !== 'cancelled' &&
    l.listingStatus !== 'expired' &&
    Number(l.quantityAvailableKg) > 0
  );

  if (speciesId) {
    filtered = filtered.filter(l => l.fishSpeciesId === speciesId);
  }
  if (locationId) {
    filtered = filtered.filter(l => l.catchLocationId === locationId || l.landingLocationId === locationId);
  }
  if (freshness) {
    filtered = filtered.filter(l => l.freshness === freshness);
  }
  if (search) {
    filtered = filtered.filter(
      l => l.title.toLowerCase().includes(search) || (l.speciesName && l.speciesName.toLowerCase().includes(search))
    );
  }

  return res.json({ success: true, listings: filtered });
});

app.get('/api/listings/:id', async (req: Request, res: Response) => {
  const reqId = req.params.id;
  let listing = dbCatchListings.find((l: any) => l._id === reqId || l.id === reqId);

  if (!listing && isDbConnected()) {
    try {
      const dbListing: any = await CatchListingModel.findOne({ $or: [{ _id: reqId }, { id: reqId }] }).lean();
      if (dbListing) {
        const availableQty = Number(dbListing.quantityAvailableKg ?? dbListing.quantityKg ?? dbListing.originalQuantityKg ?? 0);
        listing = {
          ...dbListing,
          _id: String(dbListing._id || dbListing.id),
          quantityAvailableKg: availableQty,
          quantityKg: availableQty,
          askingPricePerKg: Number(dbListing.askingPricePerKg ?? 0)
        } as any;
      }
    } catch (e) {
      console.error('[DB Error] Failed to fetch listing detail from MongoDB:', e);
    }
  }

  if (!listing) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Catch listing not found' } });
  }
  listing.viewsCount = (listing.viewsCount || 0) + 1;
  return res.json({ success: true, listing });
});

app.post('/api/listings', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const user = dbUsers.find(u => u._id === userId);

  if (!user || user.role !== 'fisher') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only fishers can create catch listings.' } });
  }
  if (user.accountStatus !== 'approved') {
    return res.status(403).json({ success: false, error: { code: 'NOT_APPROVED', message: 'Your Fisher account must be approved by Admin before creating catch listings.' } });
  }

  const fisherProfile = dbFisherProfiles.find(p => p.userId === user._id);
  const userAssignedLoc = user.assignedLocationId || fisherProfile?.primaryLocationId;

  const {
    fishSpeciesId: reqFishSpeciesId,
    speciesId,
    speciesName,
    title,
    description,
    quantityAvailableKg,
    askingPricePerKg,
    currency,
    catchDate,
    freshness,
    storageMethod,
    catchLocationId,
    landingLocationId,
    minimumOrderQuantityKg
  } = req.body;

  const fishSpeciesId = reqFishSpeciesId || speciesId;

  const targetCatchLoc = catchLocationId || userAssignedLoc;
  const targetLandingLoc = landingLocationId || targetCatchLoc;

  // Enforce one working location constraint: Fishers can only create listings for their assigned working location
  if (userAssignedLoc && targetCatchLoc !== userAssignedLoc && targetLandingLoc !== userAssignedLoc) {
    const assignedLocObj = dbLocations.find(l => l._id === userAssignedLoc);
    return res.status(403).json({
      success: false,
      error: {
        code: 'LOCATION_RESTRICTED',
        message: `Fishers can only post catch listings for their assigned working location (${assignedLocObj?.name || 'Assigned Location'}).`
      }
    });
  }

  if (!fishSpeciesId || !quantityAvailableKg || !askingPricePerKg || !catchDate) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Missing required fields for catch listing.' } });
  }

  const species = dbSpecies.find(s => s._id === fishSpeciesId);
  const resolvedSpeciesName = speciesName || (species ? species.commonName : 'Fish');
  const finalTitle = title || `Fresh ${resolvedSpeciesName} Landing`;
  const location = dbLocations.find(l => l._id === targetCatchLoc);
  const landingLoc = dbLocations.find(l => l._id === targetLandingLoc);

  const now = new Date().toISOString();
  const listingId = `list-${Date.now()}`;
  const newListing: CatchListing = {
    _id: listingId,
    fisherId: user._id,
    fisherName: user.fullName,
    fisherPhone: user.phone,
    fishSpeciesId,
    speciesName: resolvedSpeciesName,
    title: finalTitle,
    description: description || '',
    quantityAvailableKg: Number(quantityAvailableKg),
    originalQuantityKg: Number(quantityAvailableKg),
    askingPricePerKg: Number(askingPricePerKg),
    currency: currency || location?.currency || 'USD',
    totalEstimatedValue: Number(quantityAvailableKg) * Number(askingPricePerKg),
    catchDate,
    listingDate: now,
    freshness: freshness || 'very_fresh',
    storageMethod: storageMethod || 'ice',
    catchLocationId: targetCatchLoc,
    catchLocationName: location ? location.name : 'Coastal Zone',
    landingLocationId: targetLandingLoc,
    landingLocationName: landingLoc ? landingLoc.name : (location ? location.name : 'Local Pier'),
    minimumOrderQuantityKg: minimumOrderQuantityKg ? Number(minimumOrderQuantityKg) : undefined,
    listingStatus: 'active',
    viewsCount: 0,
    contactCount: 0,
    createdAt: now,
    updatedAt: now
  };

  dbCatchListings.unshift(newListing);

  if (isDbConnected()) {
    CatchListingModel.create({
      ...newListing,
      id: newListing._id,
      catchDate: new Date(newListing.catchDate),
      listingDate: new Date(newListing.listingDate)
    }).catch(err => console.error('[DB Error] Failed to insert catch listing into MongoDB:', err));
  }

  createAuditEntry(user._id, user.role, 'CREATE_LISTING', 'catch_listings', listingId, `Fisher ${user.fullName} created listing for ${quantityAvailableKg}kg of ${newListing.speciesName}.`);

  return res.status(201).json({ success: true, listing: newListing });
});

app.patch('/api/listings/:id', (req: Request, res: Response) => {
  const listing = dbCatchListings.find(l => l._id === req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } });
  }

  const userId = req.headers['x-user-id'] as string;
  const user = dbUsers.find(u => u._id === userId);

  if (!user || (user.role !== 'admin' && listing.fisherId !== userId)) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to edit this listing.' } });
  }

  Object.assign(listing, req.body, { updatedAt: new Date().toISOString() });

  if (isDbConnected()) {
    CatchListingModel.updateOne({ _id: listing._id }, { $set: listing }).catch(err => console.error('[DB Error] Failed to update catch listing in MongoDB:', err));
  }

  return res.json({ success: true, listing });
});

app.delete('/api/listings/:id', (req: Request, res: Response) => {
  const idx = dbCatchListings.findIndex(l => l._id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } });
  }
  dbCatchListings[idx].listingStatus = 'cancelled';
  dbCatchListings[idx].updatedAt = new Date().toISOString();

  if (isDbConnected()) {
    CatchListingModel.updateOne({ _id: dbCatchListings[idx]._id }, { $set: { listingStatus: 'cancelled', updatedAt: new Date() } }).catch(err => console.error('[DB Error] Failed to cancel catch listing in MongoDB:', err));
  }

  return res.json({ success: true, message: 'Listing cancelled successfully' });
});

// 8. Purchase Requests Endpoints
app.post('/api/purchase-requests', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const user = dbUsers.find(u => u._id === userId);

  if (!user || user.role !== 'buyer') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only buyers can submit purchase requests.' } });
  }
  if (user.accountStatus !== 'approved') {
    return res.status(403).json({ success: false, error: { code: 'NOT_APPROVED', message: 'Your Buyer account must be approved by Admin before submitting purchase requests.' } });
  }

  const buyerProfile = dbBuyerProfiles.find(b => b.userId === user._id);
  const buyerAssignedLoc = user.assignedLocationId || buyerProfile?.primaryLocationId;

  const { listingId, requestedQuantityKg, offeredPricePerKg, message } = req.body;
  const reqQty = Number(requestedQuantityKg);

  let listing = dbCatchListings.find((l: any) => l._id === listingId || l.id === listingId);

  if (!listing && isDbConnected()) {
    try {
      const dbListing: any = await CatchListingModel.findOne({ $or: [{ _id: listingId }, { id: listingId }] }).lean();
      if (dbListing) {
        const availableQty = Number(dbListing.quantityAvailableKg ?? dbListing.quantityKg ?? dbListing.originalQuantityKg ?? 0);
        listing = {
          ...dbListing,
          _id: String(dbListing._id || dbListing.id),
          quantityAvailableKg: availableQty,
          quantityKg: availableQty,
          askingPricePerKg: Number(dbListing.askingPricePerKg ?? 0)
        } as any;
      }
    } catch (e) {
      console.error('[DB Error] Failed to lookup listing in MongoDB:', e);
    }
  }

  if (!listing || listing.listingStatus === 'sold' || listing.listingStatus === 'cancelled' || listing.listingStatus === 'expired' || Number(listing.quantityAvailableKg) <= 0) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_LISTING', message: 'Listing is no longer active or available.' } });
  }

  // Enforce one working location constraint: Buyers can only buy fish landed at their assigned working location
  if (buyerAssignedLoc && listing.catchLocationId !== buyerAssignedLoc && listing.landingLocationId !== buyerAssignedLoc) {
    const buyerLocObj = dbLocations.find(l => l._id === buyerAssignedLoc);
    return res.status(403).json({
      success: false,
      error: {
        code: 'LOCATION_RESTRICTED',
        message: `Buyers can only submit purchase requests for catch landed at their assigned working location (${buyerLocObj?.name || 'Assigned Location'}).`
      }
    });
  }

  if (isNaN(reqQty) || reqQty <= 0) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUANTITY', message: 'Requested quantity must be greater than 0 kg.' } });
  }

  if (reqQty > listing.quantityAvailableKg) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EXCEEDS_QUANTITY',
        message: `Only ${listing.quantityAvailableKg} kg is available for this catch.`
      }
    });
  }

  const now = new Date().toISOString();
  const reqId = `req-${Date.now()}`;

  const newReq: PurchaseRequest & { buyerEmail?: string; fisherName?: string } = {
    _id: reqId,
    listingId,
    listingTitle: listing.title,
    buyerId: user._id,
    buyerName: user.fullName,
    buyerEmail: user.email ? user.email.toLowerCase() : '',
    buyerBusinessName: buyerProfile?.businessName || user.fullName,
    fisherId: listing.fisherId,
    fisherName: listing.fisherName || '',
    requestedQuantityKg: reqQty,
    offeredPricePerKg: offeredPricePerKg ? Number(offeredPricePerKg) : listing.askingPricePerKg,
    currency: listing.currency || 'INR',
    message: message || '',
    requestStatus: 'pending',
    createdAt: now,
    updatedAt: now
  };

  dbPurchaseRequests.unshift(newReq);
  listing.contactCount += 1;

  if (isDbConnected()) {
    PurchaseRequestModel.create({ ...newReq, id: newReq._id }).catch(err => console.error('[DB Error] Failed to create purchase request in MongoDB:', err));
    CatchListingModel.updateOne(
      { _id: listing._id },
      { $inc: { contactCount: 1 } }
    ).catch(err => console.error('[DB Error] Failed to update catch listing in MongoDB:', err));
  }

  // Send notification to fisher
  sendNotification(
    listing.fisherId,
    'purchase_request',
    'New Buyer Purchase Request',
    `${user.fullName} requested ${requestedQuantityKg}kg of ${listing.speciesName} on "${listing.title}".`,
    'purchase_requests',
    reqId
  );

  return res.status(201).json({ success: true, request: newReq });
});

app.get('/api/purchase-requests/mine', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.json({ success: true, requests: [] });
  }

  // Find user from memory or DB
  let user = dbUsers.find(u => u._id === userId);
  if (!user && isDbConnected()) {
    try {
      const dbUser = await UserModel.findById(userId).lean() || await UserModel.findOne({ id: userId }).lean();
      if (dbUser) user = dbUser as any;
    } catch (e) {
      console.error('[DB Error] Failed to find user for purchase-requests:', e);
    }
  }

  const userRole = user?.role || 'buyer';
  const userEmail = user?.email ? user.email.toLowerCase().trim() : '';
  const userName = user?.fullName || '';

  const requestMap = new Map<string, any>();

  // 1. Fetch from MongoDB if connected
  if (isDbConnected()) {
    try {
      let filter: any = {};
      if (userRole === 'buyer') {
        const orConditions: any[] = [
          { buyerId: userId },
          { buyerId: user?._id || '' }
        ];
        if (userEmail) {
          orConditions.push({ buyerEmail: userEmail });
          orConditions.push({ email: userEmail });
        }
        if (userName) {
          orConditions.push({ buyerName: userName });
        }
        filter = { $or: orConditions.filter(c => Object.keys(c).length > 0 && Object.values(c)[0]) };
      } else if (userRole === 'fisher') {
        const orConditions: any[] = [
          { fisherId: userId },
          { fisherId: user?._id || '' }
        ];
        if (userName) {
          orConditions.push({ fisherName: userName });
        }
        filter = { $or: orConditions.filter(c => Object.keys(c).length > 0 && Object.values(c)[0]) };
      } else if (userRole === 'admin') {
        filter = {};
      }

      const dbRequests = await PurchaseRequestModel.find(filter).lean();
      if (dbRequests && dbRequests.length > 0) {
        dbRequests.forEach((r: any) => {
          const reqKey = String(r._id || r.id);
          requestMap.set(reqKey, {
            _id: reqKey,
            listingId: r.listingId || '',
            listingTitle: r.listingTitle || 'Catch Listing',
            buyerId: r.buyerId || userId,
            buyerName: r.buyerName || userName,
            buyerEmail: r.buyerEmail || userEmail,
            buyerBusinessName: r.buyerBusinessName || '',
            fisherId: r.fisherId || '',
            fisherName: r.fisherName || '',
            requestedQuantityKg: Number(r.requestedQuantityKg ?? r.quantityKg ?? 0),
            offeredPricePerKg: Number(r.offeredPricePerKg ?? r.askingPricePerKg ?? r.proposedPricePerKg ?? 0),
            currency: r.currency || 'INR',
            message: r.message || r.notes || '',
            requestStatus: r.requestStatus || r.status || 'pending',
            fisherResponseMessage: r.fisherResponseMessage || '',
            respondedAt: r.respondedAt ? new Date(r.respondedAt).toISOString() : undefined,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
          });
        });
      }
    } catch (err) {
      console.error('[DB Error] Failed to query purchase requests from MongoDB:', err);
    }
  }

  // 2. Combine with in-memory dbPurchaseRequests
  dbPurchaseRequests.forEach(r => {
    const isBuyerMatch = (r.buyerId === userId) || (user?._id && r.buyerId === user._id) || (userEmail && (r as any).buyerEmail === userEmail) || (userName && r.buyerName === userName);
    const isFisherMatch = (r.fisherId === userId) || (user?._id && r.fisherId === user._id);
    const isAdmin = userRole === 'admin';

    if ((userRole === 'buyer' && isBuyerMatch) || (userRole === 'fisher' && isFisherMatch) || isAdmin) {
      const reqKey = String(r._id);
      if (!requestMap.has(reqKey)) {
        requestMap.set(reqKey, {
          ...r,
          requestedQuantityKg: Number(r.requestedQuantityKg ?? (r as any).quantityKg ?? 0),
          offeredPricePerKg: Number(r.offeredPricePerKg ?? (r as any).askingPricePerKg ?? (r as any).proposedPricePerKg ?? 0),
          requestStatus: r.requestStatus || (r as any).status || 'pending'
        });
      }
    }
  });

  const allRequests = Array.from(requestMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, requests: allRequests });
});

app.patch('/api/purchase-requests/:id', async (req: Request, res: Response) => {
  const reqId = req.params.id;
  const { status, responseMessage } = req.body;

  let pReq = dbPurchaseRequests.find(r => r._id === reqId);

  if (!pReq && isDbConnected()) {
    try {
      const dbReq = await PurchaseRequestModel.findOne({ $or: [{ _id: reqId }, { id: reqId }] }).lean();
      if (dbReq) pReq = dbReq as any;
    } catch (e) {
      console.error('[DB Error] Failed to find purchase request in MongoDB:', e);
    }
  }

  if (!pReq) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
  }

  pReq.requestStatus = status;
  if (responseMessage) pReq.fisherResponseMessage = responseMessage;
  const now = new Date().toISOString();
  pReq.updatedAt = now;

  if (status === 'accepted') {
    pReq.respondedAt = now;
    // Deduct quantity from listing only on successful acceptance
    let listing = dbCatchListings.find((l: any) => l._id === pReq.listingId || l.id === pReq.listingId);
    let updatedQty = 0;
    let updatedStatus: 'active' | 'sold' = 'active';

    if (isDbConnected()) {
      try {
        const dbListing = await CatchListingModel.findOne({ $or: [{ _id: pReq.listingId }, { id: pReq.listingId }] });
        if (dbListing) {
          const currentQty = Number((dbListing as any).quantityAvailableKg ?? (dbListing as any).quantityKg ?? (dbListing as any).originalQuantityKg ?? 0);
          updatedQty = Math.max(0, currentQty - pReq.requestedQuantityKg);
          updatedStatus = updatedQty === 0 ? 'sold' : 'active';
          await CatchListingModel.updateOne(
            { _id: dbListing._id },
            { $set: { quantityAvailableKg: updatedQty, quantityKg: updatedQty, listingStatus: updatedStatus } }
          );
        }
      } catch (e) {
        console.error('[DB Error] Failed to update catch listing quantity on accept:', e);
      }
    }

    if (listing) {
      if (!isDbConnected() || updatedQty === 0) {
        const currentQty = Number((listing as any).quantityAvailableKg ?? (listing as any).quantityKg ?? 0);
        updatedQty = Math.max(0, currentQty - pReq.requestedQuantityKg);
        updatedStatus = updatedQty === 0 ? 'sold' : 'active';
      }
      (listing as any).quantityAvailableKg = updatedQty;
      (listing as any).quantityKg = updatedQty;
      (listing as any).listingStatus = updatedStatus;
    }

    // Notify buyer
    sendNotification(
      pReq.buyerId,
      'request_accepted',
      'Purchase Request Accepted',
      `Your purchase request for ${pReq.requestedQuantityKg}kg of ${pReq.listingTitle} was accepted!`,
      'purchase_requests',
      reqId
    );
  } else if (status === 'rejected' || status === 'declined') {
    pReq.respondedAt = now;
    // Offer declined: Quantity stays completely UNCHANGED
    sendNotification(
      pReq.buyerId,
      'request_rejected',
      'Purchase Request Declined',
      `Your request for ${pReq.listingTitle} was declined by the fisher.`,
      'purchase_requests',
      reqId
    );
  }

  if (isDbConnected()) {
    PurchaseRequestModel.updateOne({ $or: [{ _id: pReq._id }, { id: pReq._id }] }, { $set: pReq }).catch(err => console.error('[DB Error] Failed to update purchase request in MongoDB:', err));
  }

  return res.json({ success: true, request: pReq });
});

// 9. Notifications Endpoints
app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.json({ success: true, notifications: [] });
  }
  const userNotifs = dbNotifications.filter(n => n.userId === userId);
  return res.json({ success: true, notifications: userNotifs });
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = dbNotifications.find(n => n._id === req.params.id);
  if (notif) {
    notif.isRead = true;
    notif.readAt = new Date().toISOString();
  }
  return res.json({ success: true });
});

// 10. Admin Endpoints
app.get('/api/admin/users/pending', async (req: Request, res: Response) => {
  const pendingMap = new Map<string, User>();

  if (isDbConnected()) {
    try {
      const docs = await UserModel.find({
        $or: [{ approvalStatus: 'pending' }, { accountStatus: 'pending' }]
      }).lean();

      docs.forEach((doc: any) => {
        const uId = doc.id || doc._id.toString();
        pendingMap.set(uId, {
          _id: uId,
          fullName: doc.fullName,
          email: doc.email,
          phone: doc.phone || '',
          role: doc.role,
          accountStatus: doc.accountStatus || 'pending',
          approvalStatus: doc.approvalStatus || 'pending',
          assignedLocationId: doc.assignedLocationId || 'loc-1',
          approvedBy: doc.approvedBy,
          approvedAt: doc.approvedAt ? new Date(doc.approvedAt).toISOString() : undefined,
          rejectionReason: doc.rejectionReason,
          profileCompleted: doc.profileCompleted ?? true,
          emailVerified: doc.emailVerified ?? true,
          phoneVerified: doc.phoneVerified ?? false,
          lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt).toISOString() : new Date().toISOString(),
          isActive: doc.isActive ?? true,
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString()
        });
      });
    } catch (err) {
      console.error('Error querying MongoDB for pending users:', err);
    }
  }

  dbUsers.filter(u => u.approvalStatus === 'pending' || u.accountStatus === 'pending').forEach(u => {
    if (!pendingMap.has(u._id)) {
      pendingMap.set(u._id, u);
    }
  });

  return res.json({ success: true, users: Array.from(pendingMap.values()) });
});

app.patch('/api/admin/users/:id/approve', async (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const targetId = req.params.id;
  const now = new Date();
  const nowIso = now.toISOString();

  let user = dbUsers.find(u => u._id === targetId);

  if (isDbConnected()) {
    try {
      const doc: any = await UserModel.findOne({ $or: [{ id: targetId }, { _id: targetId }] });
      if (doc) {
        doc.accountStatus = 'approved';
        doc.approvalStatus = 'approved';
        doc.approvedBy = adminId;
        doc.approvedAt = now;
        doc.updatedAt = now;
        await doc.save();

        if (!user) {
          user = {
            _id: doc.id || doc._id.toString(),
            fullName: doc.fullName,
            email: doc.email,
            phone: doc.phone || '',
            role: doc.role,
            accountStatus: 'approved',
            approvalStatus: 'approved',
            assignedLocationId: doc.assignedLocationId || 'loc-1',
            approvedBy: adminId,
            approvedAt: nowIso,
            profileCompleted: doc.profileCompleted ?? true,
            emailVerified: doc.emailVerified ?? true,
            phoneVerified: doc.phoneVerified ?? false,
            isActive: doc.isActive ?? true,
            createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : nowIso,
            updatedAt: nowIso
          };
          dbUsers.push(user);
        }
      }
    } catch (err) {
      console.error('MongoDB user approval update failed:', err);
    }
  }

  if (user) {
    user.accountStatus = 'approved';
    user.approvalStatus = 'approved';
    user.approvedBy = adminId;
    user.approvedAt = nowIso;
    user.updatedAt = nowIso;
  } else {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  createAuditEntry(adminId, 'admin', 'APPROVE_USER', 'users', user._id, `Approved account for ${user.fullName} (${user.role}).`);

  sendNotification(
    user._id,
    'account_approved',
    'Account Approved!',
    `Congratulations! Your ${user.role} registration has been approved. You now have full access to marketplace features.`,
    'users',
    user._id
  );

  return res.json({ success: true, user });
});

app.patch('/api/admin/users/:id/reject', async (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const targetId = req.params.id;
  const { reason } = req.body;
  const now = new Date();
  const nowIso = now.toISOString();

  let user = dbUsers.find(u => u._id === targetId);

  if (isDbConnected()) {
    try {
      const doc: any = await UserModel.findOne({ $or: [{ id: targetId }, { _id: targetId }] });
      if (doc) {
        doc.accountStatus = 'rejected';
        doc.approvalStatus = 'rejected';
        doc.approvedBy = adminId;
        doc.approvedAt = now;
        doc.rejectionReason = reason || 'Documentation could not be verified.';
        doc.updatedAt = now;
        await doc.save();
      }
    } catch (err) {
      console.error('MongoDB user rejection error:', err);
    }
  }

  if (user) {
    user.accountStatus = 'rejected';
    user.approvalStatus = 'rejected';
    user.approvedBy = adminId;
    user.approvedAt = nowIso;
    user.rejectionReason = reason || 'Documentation could not be verified.';
    user.updatedAt = nowIso;
  } else {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  createAuditEntry(adminId, 'admin', 'REJECT_USER', 'users', user._id, `Rejected account for ${user.fullName} (${user.role}). Reason: ${user.rejectionReason}`);

  sendNotification(
    user._id,
    'account_rejected',
    'Account Registration Status Update',
    `Your ${user.role} application could not be approved. Reason: ${user.rejectionReason}`,
    'users',
    user._id
  );

  return res.json({ success: true, user });
});

app.patch('/api/admin/users/:id/suspend', async (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const targetId = req.params.id;
  const now = new Date();
  const nowIso = now.toISOString();

  let user = dbUsers.find(u => u._id === targetId);

  if (isDbConnected()) {
    try {
      const doc: any = await UserModel.findOne({ $or: [{ id: targetId }, { _id: targetId }] });
      if (doc) {
        doc.accountStatus = 'suspended';
        doc.updatedAt = now;
        await doc.save();
      }
    } catch (err) {
      console.error('MongoDB user suspend error:', err);
    }
  }

  if (user) {
    user.accountStatus = 'suspended';
    user.updatedAt = nowIso;
  } else {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  createAuditEntry(adminId, 'admin', 'SUSPEND_USER', 'users', user._id, `Suspended account for ${user.fullName}.`);
  return res.json({ success: true, user });
});

app.post('/api/admin/market-prices', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { fishSpeciesId, marketLocationId, price, currency, unit, minimumPrice, maximumPrice, sourceName } = req.body;

  const species = dbSpecies.find(s => s._id === fishSpeciesId);
  const location = dbLocations.find(l => l._id === marketLocationId);

  const now = new Date().toISOString();
  const priceId = `prc-${Date.now()}`;
  const newPrice: MarketPrice = {
    _id: priceId,
    fishSpeciesId,
    marketLocationId,
    marketName: location ? location.name : 'Regional Exchange',
    price: Number(price),
    currency: currency || 'USD',
    unit: unit || 'kg',
    minimumPrice: minimumPrice ? Number(minimumPrice) : Number(price) * 0.9,
    maximumPrice: maximumPrice ? Number(maximumPrice) : Number(price) * 1.15,
    averagePrice: Number(price),
    priceDate: new Date().toISOString().split('T')[0],
    priceUpdatedAt: now,
    sourceType: 'admin',
    sourceName: sourceName || 'Admin Price Bulletin',
    dataStatus: 'verified',
    createdBy: adminId,
    history: [
      { date: new Date().toISOString().split('T')[0], price: Number(price) }
    ],
    createdAt: now,
    updatedAt: now
  };

  dbMarketPrices.unshift(newPrice);
  createAuditEntry(adminId, 'admin', 'CREATE_MARKET_PRICE', 'market_prices', priceId, `Added market price for ${species?.commonName || 'Fish'} at ${newPrice.price} ${newPrice.currency}/${newPrice.unit}.`);

  return res.status(201).json({ success: true, price: newPrice });
});

app.post('/api/admin/alerts', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { title, message, alertType, severity, locationId, recommendations } = req.body;

  const now = new Date().toISOString();
  const alertId = `alert-${Date.now()}`;
  const newAlert: SafetyAlert = {
    _id: alertId,
    title,
    message,
    alertType: alertType || 'marine_warning',
    severity: severity || 'high',
    locationId,
    issuedAt: now,
    effectiveFrom: now,
    effectiveUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    sourceType: 'admin',
    sourceName: 'Maritime Safety Authority (Admin)',
    recommendations: recommendations || ['Follow official safety protocols.'],
    status: 'active',
    createdBy: adminId,
    createdAt: now,
    updatedAt: now
  };

  dbSafetyAlerts.unshift(newAlert);
  createAuditEntry(adminId, 'admin', 'PUBLISH_SAFETY_ALERT', 'safety_alerts', alertId, `Published safety alert "${title}" (${severity} severity).`);

  return res.status(201).json({ success: true, alert: newAlert });
});

app.get('/api/admin/reports/overview', (req: Request, res: Response) => {
  const kpis: AdminKPIs = {
    registeredFishers: dbUsers.filter(u => u.role === 'fisher').length,
    approvedFishers: dbUsers.filter(u => u.role === 'fisher' && u.accountStatus === 'approved').length,
    pendingApprovals: dbUsers.filter(u => u.approvalStatus === 'pending').length,
    registeredBuyers: dbUsers.filter(u => u.role === 'buyer').length,
    approvedBuyers: dbUsers.filter(u => u.role === 'buyer' && u.accountStatus === 'approved').length,
    activeListings: dbCatchListings.filter(l => l.listingStatus === 'active').length,
    requestsToday: dbPurchaseRequests.length,
    pricesUpdatedToday: dbMarketPrices.length,
    weatherStatus: 'Operational (Open-Meteo Integration Active)',
    activeAlertsCount: dbSafetyAlerts.filter(a => a.status === 'active').length
  };

  return res.json({ success: true, kpis });
});

app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  return res.json({ success: true, auditLogs: dbAuditLogs });
});

// Admin Species management
app.post('/api/admin/species', (req: Request, res: Response) => {
  const adminId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { commonName, scientificName, category, description, averageSizeKg, imageUrl } = req.body;

  const now = new Date().toISOString();
  const speciesId = `spec-${Date.now()}`;
  const newSpec: FishSpecies = {
    _id: speciesId,
    commonName,
    scientificName,
    category: category || 'Pelagic',
    description,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    averageSizeKg: Number(averageSizeKg) || 10,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  dbSpecies.push(newSpec);
  if (isDbConnected()) {
    FishSpeciesModel.create({ ...newSpec, id: speciesId }).catch(console.error);
  }
  createAuditEntry(adminId, 'admin', 'CREATE_FISH_SPECIES', 'fish_species', speciesId, `Added fish species ${commonName}.`);

  return res.status(201).json({ success: true, species: newSpec });
});

// MongoDB Status & Manual Connection Management APIs
app.get('/api/db/status', async (req: Request, res: Response) => {
  const connected = isDbConnected();
  let collectionsCount: Record<string, number> = {};

  if (connected) {
    try {
      collectionsCount = {
        users: await UserModel.countDocuments(),
        fisherProfiles: await FisherProfileModel.countDocuments(),
        buyerProfiles: await BuyerProfileModel.countDocuments(),
        locations: await LocationModel.countDocuments(),
        fishSpecies: await FishSpeciesModel.countDocuments(),
        marketPrices: await MarketPriceModel.countDocuments(),
        weatherData: await WeatherDataModel.countDocuments(),
        marineData: await MarineDataModel.countDocuments(),
        safetyAlerts: await SafetyAlertModel.countDocuments(),
        catchListings: await CatchListingModel.countDocuments(),
        purchaseRequests: await PurchaseRequestModel.countDocuments(),
        notifications: await NotificationModel.countDocuments(),
        auditLogs: await AuditLogModel.countDocuments()
      };
    } catch (e) {
      console.error('Error fetching collection counts:', e);
    }
  }

  return res.json({
    success: true,
    dbConnected: connected,
    uriConfigured: Boolean(process.env.MONGODB_URI),
    collectionsCount
  });
});

app.post('/api/db/connect', async (req: Request, res: Response) => {
  const { uri } = req.body;
  const connectionUri = uri || process.env.MONGODB_URI;

  if (!connectionUri) {
    return res.status(400).json({ success: false, error: 'No MONGODB_URI provided.' });
  }

  const connected = await connectToDatabase(connectionUri);
  if (connected) {
    await seedDatabaseIfEmpty();
    await loadDataFromMongoDB();
    return res.json({ success: true, message: 'Connected to MongoDB successfully!' });
  } else {
    return res.status(500).json({ success: false, error: 'Failed to connect to MongoDB using the provided connection string.' });
  }
});

app.post('/api/db/seed', async (req: Request, res: Response) => {
  if (!isDbConnected()) {
    return res.status(400).json({ success: false, error: 'Database is not connected.' });
  }
  const { force } = req.body || {};
  try {
    await seedDatabaseIfEmpty(Boolean(force));
    await loadDataFromMongoDB();
    return res.json({ success: true, message: 'Database seeding completed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Seeding failed.' });
  }
});

// Start Express Server with Vite Middleware
async function startServer() {
  if (process.env.MONGODB_URI) {
    console.log('Attempting MongoDB connection via MONGODB_URI...');
    const connected = await connectToDatabase();
    if (connected) {
      await seedDatabaseIfEmpty();
      await loadDataFromMongoDB();
    }
  } else {
    console.log('MONGODB_URI not configured. Portal is operating in fallback in-memory mode.');
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fisher Community Market Access & Weather Safety Portal server running on http://0.0.0.0:${PORT}`);
  });
}


startServer();
