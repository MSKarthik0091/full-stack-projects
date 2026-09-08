export type UserRole = 'guest' | 'fisher' | 'buyer' | 'admin';

export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'deactivated';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  accountStatus: AccountStatus;
  approvalStatus: ApprovalStatus;
  assignedLocationId?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  profileCompleted: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  passwordHash?: string;
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FisherProfile {
  _id: string;
  userId: string;
  profilePhoto?: string;
  fishingExperienceYears?: number;
  fishingType?: 'small_scale' | 'commercial' | 'traditional';
  primaryLocationId: string;
  boatDetails?: {
    hasBoat: boolean;
    boatName?: string;
    boatType?: string;
    registrationNumber?: string;
    boatCapacityKg?: number;
  };
  fishingMethods?: string[];
  preferredFishSpecies?: string[];
  preferredMarkets?: string[];
  bio?: string;
  address?: {
    addressLine1?: string;
    city?: string;
    stateProvince?: string;
    postalCode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfile {
  _id: string;
  userId: string;
  profilePhoto?: string;
  buyerType: 'wholesaler' | 'retailer' | 'restaurant' | 'seafood_market' | 'processor' | 'other';
  businessName?: string;
  businessRegistrationNumber?: string;
  primaryLocationId: string;
  interestedFishSpecies?: string[];
  preferredPurchaseQuantityKg?: {
    minimum?: number;
    maximum?: number;
  };
  address?: {
    addressLine1?: string;
    city?: string;
    stateProvince?: string;
    postalCode?: string;
    country?: string;
  };
  bio?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationItem {
  _id: string;
  name: string;
  type: 'country' | 'state' | 'city' | 'coastal_area' | 'port' | 'market' | 'fishing_zone';
  country: string;
  countryCode: string;
  stateProvince?: string;
  city?: string;
  timezone: string;
  currency: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  isCoastal: boolean;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FishSpecies {
  _id: string;
  commonName: string;
  scientificName?: string;
  localNames?: { name: string; language: string }[];
  category?: string;
  description?: string;
  imageUrl?: string;
  averageSizeKg?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistoryEntry {
  date: string;
  price: number;
  minimumPrice?: number;
  maximumPrice?: number;
}

export interface MarketPrice {
  _id: string;
  fishSpeciesId: string;
  marketLocationId: string;
  marketName: string;
  price: number;
  currency: string;
  unit: string;
  minimumPrice?: number;
  maximumPrice?: number;
  averagePrice?: number;
  priceDate: string;
  priceUpdatedAt: string;
  sourceType: 'admin' | 'external_api' | 'government' | 'market_data';
  sourceName: string;
  sourceUrl?: string;
  dataStatus: 'verified' | 'unverified' | 'expired';
  createdBy?: string;
  updatedBy?: string;
  history?: PriceHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface WeatherData {
  _id: string;
  locationId: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  dataSource: string;
  temperature: { value: number; unit: string };
  feelsLike: { value: number; unit: string };
  humidity: number;
  pressure: { value: number; unit: string };
  wind: { speed: number; speedUnit: string; direction: number; directionUnit: string };
  precipitation: { amount: number; probability: number; unit: string };
  visibility: { value: number; unit: string };
  cloudCover: number;
  weatherCondition: string;
  uvIndex?: number;
  weatherCode?: string;
  forecastType: 'current' | 'hourly' | 'daily';
  forecastFor?: string;
  fetchedAt: string;
  expiresAt?: string;
  isStale?: boolean;
  hourlyForecast?: Array<{
    time: string;
    temp: number;
    windSpeed: number;
    pop: number;
    condition: string;
  }>;
  dailyForecast?: Array<{
    day: string;
    maxTemp: number;
    minTemp: number;
    pop: number;
    condition: string;
  }>;
}

export interface MarineData {
  _id: string;
  locationId: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  dataSource: string;
  wave: {
    height: number;
    heightUnit: string;
    direction: number;
    directionUnit: string;
    period: number;
    periodUnit: string;
  };
  swell?: {
    height: number;
    direction: number;
    period: number;
  };
  seaSurfaceTemperature: { value: number; unit: string };
  oceanCurrent?: { speed: number; direction: number };
  seaCondition: 'calm' | 'moderate' | 'rough' | 'very_rough';
  forecastType: string;
  fetchedAt: string;
  expiresAt?: string;
  isStale?: boolean;
}

export interface SafetyAlert {
  _id: string;
  title: string;
  message: string;
  alertType: 'storm' | 'high_waves' | 'strong_wind' | 'heavy_rain' | 'cyclone' | 'marine_warning' | 'general';
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  locationId?: string;
  issuedAt: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  sourceType: 'admin' | 'external';
  sourceName: string;
  sourceUrl?: string;
  recommendations?: string[];
  status: 'active' | 'expired' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatchListing {
  _id: string;
  fisherId: string;
  fisherName?: string;
  fisherPhone?: string;
  fishSpeciesId: string;
  speciesName?: string;
  title: string;
  description?: string;
  quantityAvailableKg: number;
  originalQuantityKg: number;
  askingPricePerKg: number;
  currency: string;
  totalEstimatedValue?: number;
  catchDate: string;
  listingDate: string;
  freshness: 'very_fresh' | 'fresh' | 'chilled' | 'frozen';
  storageMethod?: 'ice' | 'refrigerated' | 'frozen' | 'none';
  catchLocationId: string;
  catchLocationName?: string;
  landingLocationId?: string;
  landingLocationName?: string;
  availableUntil?: string;
  images?: string[];
  minimumOrderQuantityKg?: number;
  listingStatus: 'active' | 'reserved' | 'partially_sold' | 'sold' | 'expired' | 'cancelled' | 'removed';
  viewsCount: number;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequest {
  _id: string;
  listingId: string;
  listingTitle?: string;
  buyerId: string;
  buyerName?: string;
  buyerBusinessName?: string;
  fisherId: string;
  requestedQuantityKg: number;
  offeredPricePerKg?: number;
  currency: string;
  message?: string;
  requestStatus: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  fisherResponseMessage?: string;
  respondedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'account_approved' | 'account_rejected' | 'purchase_request' | 'request_accepted' | 'request_rejected' | 'weather_alert' | 'market_price_update' | 'listing_expiring' | 'system';
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  userId: string;
  userName?: string;
  role: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  previousData?: any;
  newData?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminKPIs {
  registeredFishers: number;
  approvedFishers: number;
  pendingApprovals: number;
  registeredBuyers: number;
  approvedBuyers: number;
  activeListings: number;
  requestsToday: number;
  pricesUpdatedToday: number;
  weatherStatus: string;
  activeAlertsCount: number;
}
