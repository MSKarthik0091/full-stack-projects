import { Schema, model } from 'mongoose';

// 1. Users Collection
const UserSchema = new Schema({
  _id: { type: String },
  id: { type: String }, // support custom id string mapping if provided
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, default: '' },
  passwordHash: { type: String, default: '' },
  role: { type: String, enum: ['fisher', 'buyer', 'admin', 'guest'], required: true },
  accountStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended', 'deactivated'], default: 'approved' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  assignedLocationId: { type: String, default: '' },
  approvedBy: { type: String, default: '' },
  approvedAt: { type: Date },
  rejectionReason: { type: String, default: '' },
  profileCompleted: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  phoneVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 2. Fisher Profiles
const FisherProfileSchema = new Schema({
  _id: { type: String },
  userId: { type: String, required: true, unique: true },
  profilePhoto: { type: String, default: '' },
  fishingExperienceYears: { type: Number, default: 1 },
  fishingType: { type: String, enum: ['small_scale', 'commercial', 'traditional'], default: 'small_scale' },
  primaryLocationId: { type: String, default: '' },
  boatDetails: {
    hasBoat: { type: Boolean, default: false },
    boatName: { type: String, default: '' },
    boatType: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    boatCapacityKg: { type: Number, default: 0 }
  },
  fishingMethods: [{ type: String }],
  preferredFishSpecies: [{ type: String }],
  bio: { type: String, default: '' }
}, { timestamps: true });

// 3. Buyer Profiles
const BuyerProfileSchema = new Schema({
  _id: { type: String },
  userId: { type: String, required: true, unique: true },
  profilePhoto: { type: String, default: '' },
  buyerType: { type: String, enum: ['wholesaler', 'retailer', 'restaurant', 'seafood_market', 'processor', 'other'], default: 'wholesaler' },
  businessName: { type: String, default: '' },
  businessRegistrationNumber: { type: String, default: '' },
  primaryLocationId: { type: String, default: '' },
  interestedFishSpecies: [{ type: String }],
  preferredPurchaseQuantityKg: {
    minimum: { type: Number, default: 0 },
    maximum: { type: Number, default: 1000 }
  },
  bio: { type: String, default: '' }
}, { timestamps: true });

// 4. Locations
const LocationSchema = new Schema({
  _id: { type: String },
  id: { type: String },
  name: { type: String, required: true },
  type: { type: String, enum: ['country', 'state', 'city', 'coastal_area', 'port', 'market', 'fishing_zone'], default: 'port' },
  country: { type: String, required: true },
  countryCode: { type: String, required: true },
  stateProvince: { type: String, default: '' },
  city: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  coordinates: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  currency: { type: String, default: 'USD' },
  isCoastal: { type: Boolean, default: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 5. Fish Species Catalogue
const FishSpeciesSchema = new Schema({
  _id: { type: String },
  id: { type: String },
  commonName: { type: String, required: true },
  scientificName: { type: String, default: '' },
  category: { type: String, default: 'Pelagic' },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  averageSizeKg: { type: Number, default: 1.0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 6. Market Prices
const MarketPriceSchema = new Schema({
  _id: { type: String },
  id: { type: String },
  fishSpeciesId: { type: String, required: true },
  marketLocationId: { type: String, required: true },
  marketName: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  unit: { type: String, default: 'kg' },
  minimumPrice: { type: Number },
  maximumPrice: { type: Number },
  averagePrice: { type: Number },
  priceDate: { type: String, required: true },
  priceUpdatedAt: { type: Date, default: Date.now },
  sourceType: { type: String, enum: ['admin', 'external_api', 'government', 'market_data'], default: 'admin' },
  sourceName: { type: String, required: true },
  dataStatus: { type: String, enum: ['verified', 'unverified', 'expired'], default: 'verified' },
  createdBy: { type: String },
  history: [{ date: String, price: Number }]
}, { timestamps: true });

// 7. Weather Data
const WeatherDataSchema = new Schema({
  _id: { type: String },
  locationId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  observedAt: { type: Date, required: true },
  dataSource: { type: String, required: true },
  temperature: { value: Number, unit: String },
  wind: { speed: Number, speedUnit: String, direction: Number, directionUnit: String },
  humidity: { type: Number },
  precipitation: { amount: Number, probability: Number, unit: String },
  weatherCondition: { type: String },
  fetchedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, { timestamps: true });

// 8. Marine Data
const MarineDataSchema = new Schema({
  _id: { type: String },
  locationId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  observedAt: { type: Date, required: true },
  dataSource: { type: String, required: true },
  wave: { height: Number, heightUnit: String, direction: Number, period: Number },
  swell: { height: Number, direction: Number, period: Number },
  seaSurfaceTemperature: { value: Number, unit: String },
  oceanCurrent: { speed: Number, direction: Number },
  seaCondition: { type: String, enum: ['calm', 'moderate', 'rough', 'very_rough'] },
  fetchedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, { timestamps: true });

// 9. Safety Alerts
const SafetyAlertSchema = new Schema({
  _id: { type: String },
  id: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  alertType: { type: String, enum: ['storm', 'high_waves', 'strong_wind', 'heavy_rain', 'cyclone', 'marine_warning', 'general'], default: 'marine_warning' },
  severity: { type: String, enum: ['low', 'moderate', 'high', 'extreme'], required: true },
  locationId: { type: String },
  issuedAt: { type: Date, default: Date.now },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveUntil: { type: Date },
  sourceType: { type: String, enum: ['admin', 'external'], default: 'admin' },
  sourceName: { type: String, required: true },
  recommendations: [{ type: String }],
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  createdBy: { type: String }
}, { timestamps: true });

// 10. Catch Listings
const CatchListingSchema = new Schema({
  _id: { type: String },
  id: { type: String },
  fisherId: { type: String, required: true },
  fisherName: { type: String, default: '' },
  fisherPhone: { type: String, default: '' },
  fishSpeciesId: { type: String, default: '' },
  speciesName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  quantityAvailableKg: { type: Number, required: true },
  originalQuantityKg: { type: Number, required: true },
  askingPricePerKg: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  totalEstimatedValue: { type: Number },
  catchDate: { type: Date, required: true },
  listingDate: { type: Date, default: Date.now },
  freshness: { type: String, default: 'very_fresh' },
  storageMethod: { type: String, default: 'ice' },
  catchLocationId: { type: String, default: '' },
  landingLocationId: { type: String, default: '' },
  minimumOrderQuantityKg: { type: Number },
  listingStatus: { type: String, default: 'active' },
  viewsCount: { type: Number, default: 0 },
  contactCount: { type: Number, default: 0 }
}, { timestamps: true, strict: false });

// 11. Purchase Requests
const PurchaseRequestSchema = new Schema({
  _id: { type: String },
  id: { type: String },
  listingId: { type: String, required: true },
  listingTitle: { type: String, required: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  buyerBusinessName: { type: String, default: '' },
  fisherId: { type: String, required: true },
  requestedQuantityKg: { type: Number, required: true },
  offeredPricePerKg: { type: Number },
  currency: { type: String, default: 'USD' },
  message: { type: String, default: '' },
  requestStatus: { type: String, default: 'pending' },
  fisherResponseMessage: { type: String, default: '' },
  respondedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true, strict: false });

// 12. Notifications
const NotificationSchema = new Schema({
  _id: { type: String },
  id: { type: String },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  referenceType: { type: String },
  referenceId: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

// 13. Audit Logs
const AuditLogSchema = new Schema({
  _id: { type: String },
  id: { type: String },
  userId: { type: String, required: true },
  userName: { type: String, default: '' },
  role: { type: String, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },
  description: { type: String, required: true },
  previousData: { type: Schema.Types.Mixed },
  newData: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Export Models
export const UserModel = model('User', UserSchema);
export const FisherProfileModel = model('FisherProfile', FisherProfileSchema);
export const BuyerProfileModel = model('BuyerProfile', BuyerProfileSchema);
export const LocationModel = model('Location', LocationSchema);
export const FishSpeciesModel = model('FishSpecies', FishSpeciesSchema);
export const MarketPriceModel = model('MarketPrice', MarketPriceSchema);
export const WeatherDataModel = model('WeatherData', WeatherDataSchema);
export const MarineDataModel = model('MarineData', MarineDataSchema);
export const SafetyAlertModel = model('SafetyAlert', SafetyAlertSchema);
export const CatchListingModel = model('CatchListing', CatchListingSchema);
export const PurchaseRequestModel = model('PurchaseRequest', PurchaseRequestSchema);
export const NotificationModel = model('Notification', NotificationSchema);
export const AuditLogModel = model('AuditLog', AuditLogSchema);
