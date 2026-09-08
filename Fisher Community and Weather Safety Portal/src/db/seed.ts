import crypto from 'crypto';
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
} from '../data/initialData';

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
} from './models';

function defaultHashPassword(pwd: string): string {
  return crypto.pbkdf2Sync(pwd, 'fisher_portal_salt', 1000, 64, 'sha512').toString('hex');
}

export async function seedDatabaseIfEmpty(force = false) {
  console.log('Starting independent collection seed check...');
  const defaultPwdHash = defaultHashPassword('password123');

  // 1. Users
  try {
    const count = await UserModel.countDocuments();
    if (count === 0 || force) {
      if (force) await UserModel.deleteMany({});
      await UserModel.insertMany(
        INITIAL_USERS.map(u => ({
          ...u,
          id: u._id,
          passwordHash: u.passwordHash || defaultPwdHash,
          approvedAt: u.approvedAt ? new Date(u.approvedAt) : undefined,
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : new Date()
        }))
      );
      console.log(`[Seed] Seeded ${INITIAL_USERS.length} users.`);
    }
  } catch (err) {
    console.error('[Seed Error] Users:', err);
  }

  // 2. Fisher Profiles
  try {
    const count = await FisherProfileModel.countDocuments();
    if (count === 0 || force) {
      if (force) await FisherProfileModel.deleteMany({});
      await FisherProfileModel.insertMany(INITIAL_FISHER_PROFILES);
      console.log(`[Seed] Seeded ${INITIAL_FISHER_PROFILES.length} fisher profiles.`);
    }
  } catch (err) {
    console.error('[Seed Error] Fisher Profiles:', err);
  }

  // 3. Buyer Profiles
  try {
    const count = await BuyerProfileModel.countDocuments();
    if (count === 0 || force) {
      if (force) await BuyerProfileModel.deleteMany({});
      await BuyerProfileModel.insertMany(INITIAL_BUYER_PROFILES);
      console.log(`[Seed] Seeded ${INITIAL_BUYER_PROFILES.length} buyer profiles.`);
    }
  } catch (err) {
    console.error('[Seed Error] Buyer Profiles:', err);
  }

  // 4. Locations
  try {
    const count = await LocationModel.countDocuments();
    if (count === 0 || force) {
      if (force) await LocationModel.deleteMany({});
      await LocationModel.insertMany(INITIAL_LOCATIONS.map(l => ({ ...l, id: l._id })));
      console.log(`[Seed] Seeded ${INITIAL_LOCATIONS.length} locations.`);
    }
  } catch (err) {
    console.error('[Seed Error] Locations:', err);
  }

  // 5. Fish Species
  try {
    const count = await FishSpeciesModel.countDocuments();
    if (count === 0 || force) {
      if (force) await FishSpeciesModel.deleteMany({});
      await FishSpeciesModel.insertMany(INITIAL_SPECIES.map(s => ({ ...s, id: s._id })));
      console.log(`[Seed] Seeded ${INITIAL_SPECIES.length} fish species.`);
    }
  } catch (err) {
    console.error('[Seed Error] Fish Species:', err);
  }

  // 6. Market Prices
  try {
    const count = await MarketPriceModel.countDocuments();
    if (count === 0 || force) {
      if (force) await MarketPriceModel.deleteMany({});
      await MarketPriceModel.insertMany(INITIAL_MARKET_PRICES.map(m => ({ ...m, id: m._id })));
      console.log(`[Seed] Seeded ${INITIAL_MARKET_PRICES.length} market prices.`);
    }
  } catch (err) {
    console.error('[Seed Error] Market Prices:', err);
  }

  // 7. Safety Alerts
  try {
    const count = await SafetyAlertModel.countDocuments();
    if (count === 0 || force) {
      if (force) await SafetyAlertModel.deleteMany({});
      await SafetyAlertModel.insertMany(
        INITIAL_SAFETY_ALERTS.map(a => ({
          ...a,
          id: a._id,
          issuedAt: a.issuedAt ? new Date(a.issuedAt) : new Date(),
          effectiveFrom: a.effectiveFrom ? new Date(a.effectiveFrom) : new Date(),
          effectiveUntil: a.effectiveUntil ? new Date(a.effectiveUntil) : undefined
        }))
      );
      console.log(`[Seed] Seeded ${INITIAL_SAFETY_ALERTS.length} safety alerts.`);
    }
  } catch (err) {
    console.error('[Seed Error] Safety Alerts:', err);
  }

  // 8. Catch Listings
  try {
    const count = await CatchListingModel.countDocuments();
    if (count === 0 || force) {
      if (force) await CatchListingModel.deleteMany({});
      await CatchListingModel.insertMany(
        INITIAL_CATCH_LISTINGS.map(c => ({
          ...c,
          id: c._id,
          catchDate: c.catchDate ? new Date(c.catchDate) : new Date(),
          listingDate: c.listingDate ? new Date(c.listingDate) : new Date()
        }))
      );
      console.log(`[Seed] Seeded ${INITIAL_CATCH_LISTINGS.length} catch listings.`);
    }
  } catch (err) {
    console.error('[Seed Error] Catch Listings:', err);
  }

  // 9. Purchase Requests
  try {
    const count = await PurchaseRequestModel.countDocuments();
    if (count === 0 || force) {
      if (force) await PurchaseRequestModel.deleteMany({});
      await PurchaseRequestModel.insertMany(
        INITIAL_PURCHASE_REQUESTS.map(p => ({
          ...p,
          id: p._id,
          respondedAt: p.respondedAt ? new Date(p.respondedAt) : undefined,
          completedAt: p.completedAt ? new Date(p.completedAt) : undefined
        }))
      );
      console.log(`[Seed] Seeded ${INITIAL_PURCHASE_REQUESTS.length} purchase requests.`);
    }
  } catch (err) {
    console.error('[Seed Error] Purchase Requests:', err);
  }

  // 10. Notifications
  try {
    const count = await NotificationModel.countDocuments();
    if (count === 0 || force) {
      if (force) await NotificationModel.deleteMany({});
      await NotificationModel.insertMany(
        INITIAL_NOTIFICATIONS.map(n => ({
          ...n,
          id: n._id,
          readAt: n.readAt ? new Date(n.readAt) : undefined
        }))
      );
      console.log(`[Seed] Seeded ${INITIAL_NOTIFICATIONS.length} notifications.`);
    }
  } catch (err) {
    console.error('[Seed Error] Notifications:', err);
  }

  // 11. Audit Logs
  try {
    const count = await AuditLogModel.countDocuments();
    if (count === 0 || force) {
      if (force) await AuditLogModel.deleteMany({});
      await AuditLogModel.insertMany(INITIAL_AUDIT_LOGS.map(a => ({ ...a, id: a._id })));
      console.log(`[Seed] Seeded ${INITIAL_AUDIT_LOGS.length} audit logs.`);
    }
  } catch (err) {
    console.error('[Seed Error] Audit Logs:', err);
  }

  // 12. Weather Data
  try {
    const count = await WeatherDataModel.countDocuments();
    if (count === 0 || force) {
      if (force) await WeatherDataModel.deleteMany({});
      const weatherSeeds = INITIAL_LOCATIONS.map(loc => ({
        _id: `weather-${loc._id}`,
        locationId: loc._id,
        latitude: loc.coordinates.coordinates[1],
        longitude: loc.coordinates.coordinates[0],
        observedAt: new Date(),
        dataSource: 'Open-Meteo Marine API',
        temperature: { value: 21.5, unit: 'C' },
        wind: { speed: 14.2, speedUnit: 'km/h', direction: 230, directionUnit: 'deg' },
        humidity: 78,
        precipitation: { amount: 0.0, probability: 10, unit: 'mm' },
        weatherCondition: 'Partly Cloudy',
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      }));
      await WeatherDataModel.insertMany(weatherSeeds);
      console.log(`[Seed] Seeded ${weatherSeeds.length} weather data records.`);
    }
  } catch (err) {
    console.error('[Seed Error] Weather Data:', err);
  }

  // 13. Marine Data
  try {
    const count = await MarineDataModel.countDocuments();
    if (count === 0 || force) {
      if (force) await MarineDataModel.deleteMany({});
      const marineSeeds = INITIAL_LOCATIONS.map(loc => ({
        _id: `marine-${loc._id}`,
        locationId: loc._id,
        latitude: loc.coordinates.coordinates[1],
        longitude: loc.coordinates.coordinates[0],
        observedAt: new Date(),
        dataSource: 'Open-Meteo Marine API',
        wave: { height: 1.4, heightUnit: 'm', direction: 210, period: 7.5 },
        swell: { height: 1.1, direction: 200, period: 9.0 },
        seaSurfaceTemperature: { value: 19.8, unit: 'C' },
        oceanCurrent: { speed: 0.8, direction: 180 },
        seaCondition: 'moderate',
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      }));
      await MarineDataModel.insertMany(marineSeeds);
      console.log(`[Seed] Seeded ${marineSeeds.length} marine data records.`);
    }
  } catch (err) {
    console.error('[Seed Error] Marine Data:', err);
  }

  console.log('MongoDB successfully checked and seeded initial records across all collections.');
}
