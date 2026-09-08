import {
  User,
  LocationItem,
  FishSpecies,
  MarketPrice,
  WeatherData,
  MarineData,
  SafetyAlert,
  CatchListing,
  PurchaseRequest,
  NotificationItem,
  AuditLogItem,
  AdminKPIs
} from '../types';

let currentUserId: string = 'usr-admin'; // default role context for initial state
let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('fisher_jwt_token') : null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('fisher_jwt_token', token);
    } else {
      localStorage.removeItem('fisher_jwt_token');
    }
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setCurrentUserHeader(userId: string) {
  currentUserId = userId;
  if (!userId) {
    setAuthToken(null);
  }
}

export function getCurrentUserHeader(): string {
  return currentUserId;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': currentUserId,
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error?.message || 'API request failed');
  }
  return data;
}

export const api = {
  // Auth
  register: (payload: any) => request<{ success: boolean; user: User; token?: string; message: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  login: (payload: { email?: string; password?: string; role?: string }) => request<{ success: boolean; user: User; token?: string; profile: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getMe: () => request<{ success: boolean; user: User | null; profile: any }>('/api/auth/me'),

  // Locations
  getLocations: (query?: string) => request<{ success: boolean; locations: LocationItem[] }>(`/api/locations/search${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  geocodeLocations: (query: string) => request<{ success: boolean; results: Array<{ displayName: string; name: string; country: string; city: string; latitude: number; longitude: number; countryCode?: string }> }>(`/api/locations/geocode?q=${encodeURIComponent(query)}`),
  createLocation: (payload: any) => request<{ success: boolean; location: LocationItem }>('/api/admin/locations', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateLocation: (id: string, payload: any) => request<{ success: boolean; location: LocationItem }>(`/api/admin/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteLocation: (id: string) => request<{ success: boolean; message: string }>(`/api/admin/locations/${id}`, {
    method: 'DELETE'
  }),

  // Weather & Marine
  getWeather: (locationId: string) => request<{ success: boolean; data: WeatherData }>(`/api/weather?locationId=${locationId}`),
  getMarine: (locationId: string) => request<{ success: boolean; data: MarineData }>(`/api/marine?locationId=${locationId}`),

  // Safety Alerts
  getSafetyAlerts: (locationId?: string) => request<{ success: boolean; alerts: SafetyAlert[] }>(`/api/safety-alerts${locationId ? `?locationId=${locationId}` : ''}`),

  // Species
  getSpecies: () => request<{ success: boolean; species: FishSpecies[] }>('/api/species'),

  // Prices
  getMarketPrices: (speciesId?: string, locationId?: string) => {
    const params = new URLSearchParams();
    if (speciesId) params.append('speciesId', speciesId);
    if (locationId) params.append('locationId', locationId);
    return request<{ success: boolean; prices: MarketPrice[] }>(`/api/market-prices?${params.toString()}`);
  },
  getPriceTrends: (speciesId?: string, locationId?: string) => {
    const params = new URLSearchParams();
    if (speciesId) params.append('speciesId', speciesId);
    if (locationId) params.append('locationId', locationId);
    return request<{ success: boolean; species: FishSpecies; currentPrice: MarketPrice; history: any[] }>(`/api/market-prices/trends?${params.toString()}`);
  },

  // Catch Listings
  getListings: (filters?: { speciesId?: string; locationId?: string; freshness?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.speciesId) params.append('speciesId', filters.speciesId);
    if (filters?.locationId) params.append('locationId', filters.locationId);
    if (filters?.freshness) params.append('freshness', filters.freshness);
    if (filters?.search) params.append('search', filters.search);
    return request<{ success: boolean; listings: CatchListing[] }>(`/api/listings?${params.toString()}`);
  },
  getListingById: (id: string) => request<{ success: boolean; listing: CatchListing }>(`/api/listings/${id}`),
  createListing: (payload: any) => request<{ success: boolean; listing: CatchListing }>('/api/listings', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  cancelListing: (id: string) => request<{ success: boolean }>({
    url: `/api/listings/${id}`
  } as any, { method: 'DELETE' }),
  moderateListing: (id: string, status: string) => request<{ success: boolean }>(`/api/admin/listings/${id}/moderate`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Purchase Requests
  submitPurchaseRequest: (payload: { listingId: string; requestedQuantityKg: number; offeredPricePerKg?: number; message?: string }) => request<{ success: boolean; request: PurchaseRequest }>('/api/purchase-requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getMyPurchaseRequests: () => request<{ success: boolean; requests: PurchaseRequest[] }>('/api/purchase-requests/mine'),
  updatePurchaseRequestStatus: (id: string, status: string, responseMessage?: string) => request<{ success: boolean; request: PurchaseRequest }>(`/api/purchase-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, responseMessage })
  }),

  // Notifications
  getNotifications: () => request<{ success: boolean; notifications: NotificationItem[] }>('/api/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  // Admin
  getPendingUsers: () => request<{ success: boolean; users: User[] }>('/api/admin/users/pending'),
  approveUser: (id: string) => request<{ success: boolean; user: User }>(`/api/admin/users/${id}/approve`, { method: 'PATCH' }),
  rejectUser: (id: string, reason?: string) => request<{ success: boolean; user: User }>(`/api/admin/users/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  }),
  suspendUser: (id: string) => request<{ success: boolean; user: User }>(`/api/admin/users/${id}/suspend`, { method: 'PATCH' }),
  addMarketPrice: (payload: any) => request<{ success: boolean; price: MarketPrice }>('/api/admin/market-prices', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  publishSafetyAlert: (payload: any) => request<{ success: boolean; alert: SafetyAlert }>('/api/admin/alerts', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getAdminKPIs: () => request<{ success: boolean; kpis: AdminKPIs }>('/api/admin/reports/overview'),
  getAuditLogs: () => request<{ success: boolean; auditLogs: AuditLogItem[] }>('/api/admin/audit-logs'),
  addFishSpecies: (payload: any) => request<{ success: boolean; species: FishSpecies }>('/api/admin/species', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
};
