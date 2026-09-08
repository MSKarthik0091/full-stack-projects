import React, { useEffect, useState } from 'react';
import { User, LocationItem, FishSpecies, MarketPrice, SafetyAlert, CatchListing, AuditLogItem, AdminKPIs } from '../types';
import { api } from '../services/api';
import { ShieldAlert, UserCheck, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Plus, Activity, RefreshCw, Layers, FileText, Ban, X, MapPin, Trash2, Search, Globe, Edit3, Edit } from 'lucide-react';

interface AdminDashboardProps {
  locations: LocationItem[];
  speciesList: FishSpecies[];
  onRefreshAll: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  locations,
  speciesList,
  onRefreshAll
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'prices' | 'alerts' | 'listings' | 'species' | 'locations' | 'audit'>('pending');

  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [allListings, setAllListings] = useState<CatchListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Location Management State
  const [addLocationModalOpen, setAddLocationModalOpen] = useState(false);
  const [editLocationModalOpen, setEditLocationModalOpen] = useState(false);
  const [editingLocItem, setEditingLocItem] = useState<LocationItem | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCurrency, setEditCurrency] = useState('');
  const [editIsCoastal, setEditIsCoastal] = useState(true);

  const [locName, setLocName] = useState('');
  const [locCountry, setLocCountry] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locLatitude, setLocLatitude] = useState<number | ''>(0);
  const [locLongitude, setLocLongitude] = useState<number | ''>(0);
  const [locCurrency, setLocCurrency] = useState('USD');
  const [locIsCoastal, setLocIsCoastal] = useState(true);
  const [locDescription, setLocDescription] = useState('');
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [geoSearchResults, setGeoSearchResults] = useState<Array<any>>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [deleteConfirmLoc, setDeleteConfirmLoc] = useState<LocationItem | null>(null);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);
  const [adminLocFilter, setAdminLocFilter] = useState('');

  const handleGeocodeSearch = async (query: string) => {
    setGeoSearchQuery(query);
    if (!query || query.length < 2) {
      setGeoSearchResults([]);
      return;
    }
    setIsGeocoding(true);
    try {
      const res = await api.geocodeLocations(query);
      setGeoSearchResults(res.results || []);
    } catch (err) {
      console.error('Geocoding search failed:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSelectGeocodeResult = (res: any) => {
    setLocName(res.name || '');
    setLocCountry(res.country || '');
    setLocCity(res.city || res.name || '');
    setLocLatitude(res.latitude);
    setLocLongitude(res.longitude);
    setGeoSearchResults([]);
    setGeoSearchQuery(res.displayName);
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocationErrorMsg(null);
    if (!locName || !locCountry || locLatitude === '' || locLongitude === '') return;
    try {
      const res = await api.createLocation({
        name: locName,
        country: locCountry,
        city: locCity || locName,
        latitude: Number(locLatitude),
        longitude: Number(locLongitude),
        currency: locCurrency,
        isCoastal: locIsCoastal,
        description: locDescription
      });
      if (res.success) {
        setAddLocationModalOpen(false);
        setLocName('');
        setLocCountry('');
        setLocCity('');
        setLocLatitude(0);
        setLocLongitude(0);
        setGeoSearchQuery('');
        setGeoSearchResults([]);
        setLocationErrorMsg(null);
        onRefreshAll();
        loadAdminData();
      }
    } catch (err: any) {
      setLocationErrorMsg(err?.message || 'duplicate fisher community for same community cannot be created.');
    }
  };

  const openEditLocationModal = (loc: LocationItem) => {
    setEditingLocItem(loc);
    setEditDescription(loc.description || `Marine location at ${loc.name}, ${loc.country}.`);
    setEditCity(loc.city || loc.name);
    setEditCurrency(loc.currency || 'USD');
    setEditIsCoastal(loc.isCoastal ?? true);
    setLocationErrorMsg(null);
    setEditLocationModalOpen(true);
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocItem) return;
    setLocationErrorMsg(null);
    try {
      await api.updateLocation(editingLocItem._id, {
        description: editDescription,
        city: editCity,
        currency: editCurrency,
        isCoastal: editIsCoastal
      });
      setEditLocationModalOpen(false);
      setEditingLocItem(null);
      onRefreshAll();
      loadAdminData();
    } catch (err: any) {
      setLocationErrorMsg(err?.message || 'Failed to update location details.');
    }
  };

  const handleConfirmDeleteLocation = async () => {
    if (!deleteConfirmLoc) return;
    const id = deleteConfirmLoc._id;
    setDeletingLocationId(id);
    setLocationErrorMsg(null);
    try {
      const res = await api.deleteLocation(id);
      if (res.success) {
        setDeleteConfirmLoc(null);
        onRefreshAll();
        loadAdminData();
      }
    } catch (err: any) {
      setLocationErrorMsg(err?.message || 'Failed to delete location.');
      setDeleteConfirmLoc(null);
    } finally {
      setDeletingLocationId(null);
    }
  };

  // Reject Reason Modal
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Add Market Price Modal
  const [addPriceModalOpen, setAddPriceModalOpen] = useState(false);
  const [priceSpeciesId, setPriceSpeciesId] = useState(speciesList[0]?._id || '');
  const [priceLocationId, setPriceLocationId] = useState(locations[0]?._id || '');
  const [marketName, setMarketName] = useState('Central Pier Fish Exchange');
  const [priceValue, setPriceValue] = useState(14.50);
  const [minPrice, setMinPrice] = useState(12.00);
  const [maxPrice, setMaxPrice] = useState(16.50);
  const [currency, setCurrency] = useState('USD');

  // Publish Alert Modal
  const [addAlertModalOpen, setAddAlertModalOpen] = useState(false);
  const [alertLocationId, setAlertLocationId] = useState(locations[0]?._id || '');
  const [alertTitle, setAlertTitle] = useState('High Wave & Swell Advisory');
  const [alertSeverity, setAlertSeverity] = useState<'advisory' | 'warning' | 'danger'>('warning');
  const [alertMessage, setAlertMessage] = useState('Wave heights expected to reach 3.2 meters due to offshore depression.');
  const [alertRecommendations, setAlertRecommendations] = useState('Artisanal craft under 10m should remain in port.');

  // Add Species Modal
  const [addSpeciesModalOpen, setAddSpeciesModalOpen] = useState(false);
  const [speciesScientific, setSpeciesScientific] = useState('');
  const [speciesCommon, setSpeciesCommon] = useState('');
  const [speciesCategory, setSpeciesCategory] = useState<'pelagic' | 'demersal' | 'crustacean' | 'mollusk' | 'reef_fish'>('pelagic');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [kpiRes, pendingRes, auditRes, listingsRes] = await Promise.all([
        api.getAdminKPIs(),
        api.getPendingUsers(),
        api.getAuditLogs(),
        api.getListings()
      ]);

      setKpis(kpiRes.kpis);
      setPendingUsers(pendingRes.users);
      setAuditLogs(auditRes.auditLogs);
      setAllListings(listingsRes.listings);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApproveUser = async (userId: string) => {
    try {
      const res = await api.approveUser(userId);
      if (res.success) {
        setPendingUsers(prev => prev.filter(u => u._id !== userId));
      }
      loadAdminData();
      onRefreshAll();
    } catch (err) {
      console.error('Failed to approve user:', err);
    }
  };

  const handleRejectUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingUser) return;
    try {
      const res = await api.rejectUser(rejectingUser._id, rejectReason);
      if (res.success) {
        setPendingUsers(prev => prev.filter(u => u._id !== rejectingUser._id));
      }
      setRejectingUser(null);
      setRejectReason('');
      loadAdminData();
      onRefreshAll();
    } catch (err) {
      console.error('Failed to reject user:', err);
    }
  };

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addMarketPrice({
        speciesId: priceSpeciesId,
        locationId: priceLocationId,
        marketName,
        avgPricePerKg: priceValue,
        minPricePerKg: minPrice,
        maxPricePerKg: maxPrice,
        currency,
        notes: 'Verified via Administrative Overseer Entry'
      });
      setAddPriceModalOpen(false);
      loadAdminData();
      onRefreshAll();
    } catch (err) {
      console.error('Failed to add market price:', err);
    }
  };

  const handlePublishAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.publishSafetyAlert({
        locationId: alertLocationId,
        title: alertTitle,
        severity: alertSeverity,
        message: alertMessage,
        recommendations: alertRecommendations
      });
      setAddAlertModalOpen(false);
      loadAdminData();
      onRefreshAll();
    } catch (err) {
      console.error('Failed to publish safety alert:', err);
    }
  };

  const handleAddSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addFishSpecies({
        scientificName: speciesScientific,
        commonName: speciesCommon,
        category: speciesCategory
      });
      setAddSpeciesModalOpen(false);
      loadAdminData();
      onRefreshAll();
    } catch (err) {
      console.error('Failed to add species:', err);
    }
  };

  const handleModerateListing = async (listingId: string, status: 'active' | 'flagged' | 'removed') => {
    try {
      await api.moderateListing(listingId, status);
      loadAdminData();
    } catch (err) {
      console.error('Failed to moderate listing:', err);
    }
  };

  return (
    <div id="admin-dashboard-page" className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Portal Administrative Control Panel</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Role permission management, pending registration approvals, market price benchmark administration, and maritime advisories.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition flex items-center space-x-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Admin State</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Pending Approvals</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{kpis?.pendingApprovalsCount ?? 0}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Fishers & Buyers</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Active Listings</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpis?.activeListingsCount ?? 0}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Landings published</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Registered</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{kpis?.totalRegisteredUsers ?? 0}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Platform accounts</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Active Advisories</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">{kpis?.activeAlertsCount ?? 0}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Safety alerts</span>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Pending Approvals ({pendingUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prices')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'prices'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Market Price Management</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Safety Alert Advisories</span>
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'listings'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catch Listing Moderation</span>
        </button>

        <button
          onClick={() => setActiveTab('species')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'species'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Species Management</span>
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'locations'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Marine Locations ({locations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Audit Log</span>
        </button>
      </div>

      {/* TAB 1: Pending Registration Approvals */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Pending Registration Queue ({pendingUsers.length})</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Review fisher licenses, vessel names, and buyer organizations before granting permissions.</p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading pending registrations...</div>
          ) : pendingUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">No registrations awaiting approval at this time.</div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(user => (
                <div key={user._id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{user.fullName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        user.role === 'fisher' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800'
                      }`}>
                        Role: {user.role}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-x-4">
                      <span>Phone: <strong className="text-slate-800 dark:text-slate-200">{user.phoneNumber}</strong></span>
                      {user.role === 'fisher' && (
                        <span>Vessel: <strong className="text-slate-800 dark:text-slate-200">{user.vesselName || 'N/A'}</strong> (License: {user.licenseNumber || 'N/A'})</span>
                      )}
                      {user.role === 'buyer' && (
                        <span>Org: <strong className="text-slate-800 dark:text-slate-200">{user.organizationName || 'N/A'}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApproveUser(user._id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Registration</span>
                    </button>
                    <button
                      onClick={() => setRejectingUser(user)}
                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Market Price Management */}
      {activeTab === 'prices' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Market Price Benchmark Administration</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Record officially verified fish price benchmarks by species and landing location.</p>
            </div>

            <button
              onClick={() => setAddPriceModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow transition flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Record Price Benchmark</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Safety Alert Advisories */}
      {activeTab === 'alerts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Maritime Safety Advisories</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Issue official warnings, weather advisories, or port closure notices to fishers.</p>
            </div>

            <button
              onClick={() => setAddAlertModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow transition flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Safety Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: Listing Moderation */}
      {activeTab === 'listings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Marketplace Catch Listing Moderation ({allListings.length})</h2>

          <div className="space-y-3">
            {allListings.map(item => (
              <div key={item._id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Fisher: <strong>{item.fisherName}</strong> • Price: <strong className="text-emerald-600 dark:text-emerald-400">{item.askingPricePerKg} {item.currency}/kg</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleModerateListing(item._id, 'active')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => handleModerateListing(item._id, 'flagged')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    Flag
                  </button>
                  <button
                    onClick={() => handleModerateListing(item._id, 'removed')}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Species Management */}
      {activeTab === 'species' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Fish Species Taxonomy Catalog ({speciesList.length})</h2>
            <button
              onClick={() => setAddSpeciesModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-xs text-white shadow"
            >
              Add Species
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {speciesList.map(s => (
              <div key={s._id} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-xs text-slate-900 dark:text-white">{s.commonName}</div>
                <div className="text-[10px] italic text-slate-500 dark:text-slate-400">{s.scientificName}</div>
                <div className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-mono mt-1">{s.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Marine Location Management */}
      {activeTab === 'locations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Global Coastal & Marine Locations ({locations.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add or remove active weather/market monitoring locations across global coastlines.</p>
            </div>
            <button
              onClick={() => {
                setLocName('');
                setLocCountry('');
                setLocCity('');
                setLocLatitude(0);
                setLocLongitude(0);
                setGeoSearchQuery('');
                setGeoSearchResults([]);
                setAddLocationModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Marine Location</span>
            </button>
          </div>

          {locationErrorMsg && (
            <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-xl p-3 text-red-800 dark:text-red-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="font-semibold">{locationErrorMsg}</span>
              </div>
              <button onClick={() => setLocationErrorMsg(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Quick Filter Search for Existing Managed Locations */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={adminLocFilter}
              onChange={e => setAdminLocFilter(e.target.value)}
              placeholder="Filter active locations by name, city, state, or country (e.g., Kanniyakumari, Cochin, Seattle)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {adminLocFilter && (
              <button
                onClick={() => setAdminLocFilter('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations
              .filter(loc => {
                if (!adminLocFilter) return true;
                const q = adminLocFilter.toLowerCase().trim();
                const qNorm = q.replace(/[^a-z0-9]/g, '');
                const name = loc.name.toLowerCase();
                const country = loc.country.toLowerCase();
                const city = (loc.city || '').toLowerCase();
                const state = (loc.stateProvince || '').toLowerCase();

                const nameNorm = name.replace(/[^a-z0-9]/g, '');
                const countryNorm = country.replace(/[^a-z0-9]/g, '');
                const cityNorm = city.replace(/[^a-z0-9]/g, '');
                const stateNorm = state.replace(/[^a-z0-9]/g, '');

                return (
                  name.includes(q) ||
                  country.includes(q) ||
                  city.includes(q) ||
                  state.includes(q) ||
                  (qNorm.length > 0 && (
                    nameNorm.includes(qNorm) ||
                    countryNorm.includes(qNorm) ||
                    cityNorm.includes(qNorm) ||
                    stateNorm.includes(qNorm)
                  ))
                );
              })
              .map(loc => (
              <div key={loc._id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>{loc.name}</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{loc.country} {loc.city ? `(${loc.city})` : ''}</p>
                    </div>
                    {loc.isCoastal && (
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded font-bold border border-teal-300 dark:border-teal-800">Coastal</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                    {loc.description || `Marine location at ${loc.name}, ${loc.country}.`}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Currency: <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{loc.currency}</span> • Type: <span className="capitalize">{loc.type || 'Port'}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="font-mono text-slate-500 dark:text-slate-400">
                    <span>Lat: {loc.coordinates?.coordinates?.[1]?.toFixed(4)}°</span>
                    <span className="ml-2">Lon: {loc.coordinates?.coordinates?.[0]?.toFixed(4)}°</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditLocationModal(loc)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                      title="Edit location description & settings"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmLoc(loc)}
                      disabled={deletingLocationId === loc._id}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                      title="Delete location"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: System Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">System Security & Administrative Audit Trail ({auditLogs.length})</h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {auditLogs.map(log => (
              <div key={log._id} className="py-3 flex items-start justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{log.action}</span>
                  <p className="text-slate-500 dark:text-slate-400">{log.details}</p>
                  <span className="text-[10px] text-slate-400 font-mono">By User: {log.performedByUserId}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Record Market Price */}
      {addPriceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Record Official Price Benchmark</h3>
              <button onClick={() => setAddPriceModalOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddPrice} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Species</label>
                <select value={priceSpeciesId} onChange={e => setPriceSpeciesId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100">
                  {speciesList.map(s => <option key={s._id} value={s._id}>{s.commonName}</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Location</label>
                <select value={priceLocationId} onChange={e => setPriceLocationId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100">
                  {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Min Price</label>
                  <input type="number" step="0.1" value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-slate-100 font-bold" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Avg Price</label>
                  <input type="number" step="0.1" value={priceValue} onChange={e => setPriceValue(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-slate-100 font-bold text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Max Price</label>
                  <input type="number" step="0.1" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-slate-100 font-bold" />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setAddPriceModalOpen(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold">Save Benchmark</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Publish Safety Alert */}
      {addAlertModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Issue Maritime Safety Advisory</h3>
              <button onClick={() => setAddAlertModalOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handlePublishAlert} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Target Coastal Location</label>
                <select value={alertLocationId} onChange={e => setAlertLocationId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100">
                  {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Alert Title</label>
                <input type="text" value={alertTitle} onChange={e => setAlertTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100" required />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Severity Level</label>
                <select value={alertSeverity} onChange={(e: any) => setAlertSeverity(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100">
                  <option value="advisory">Advisory (Low)</option>
                  <option value="warning">Warning (Medium)</option>
                  <option value="danger">Danger / Gale (Critical)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Advisory Message</label>
                <textarea rows={2} value={alertMessage} onChange={e => setAlertMessage(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100" required />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setAddAlertModalOpen(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-red-600 text-white font-bold">Publish Alert Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Marine Location */}
      {addLocationModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Create Global Marine Location</span>
              </h3>
              <button onClick={() => setAddLocationModalOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>

            {locationErrorMsg && (
              <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-xl p-3 text-red-800 dark:text-red-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="font-bold">{locationErrorMsg}</span>
              </div>
            )}

            {/* Global Geocoding Auto-fill Search Bar */}
            <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-2 relative">
              <label className="text-[11px] font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1">
                <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Search Global Location (Auto-fills Coordinates)</span>
              </label>
              <input
                type="text"
                value={geoSearchQuery}
                onChange={e => handleGeocodeSearch(e.target.value)}
                placeholder="Search any place, port, or city (e.g. Sydney Harbor, Mumbai, Tokyo, Marseille)..."
                className="w-full bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isGeocoding && (
                <div className="text-[10px] text-blue-600 dark:text-blue-400 animate-pulse">Searching global open map data...</div>
              )}
              {geoSearchResults.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto text-xs divide-y divide-slate-100 dark:divide-slate-700 z-10 relative">
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sticky top-0 z-20 flex justify-between items-center">
                    <span>Suggested Locations</span>
                    <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">{geoSearchResults.length} found</span>
                  </div>
                  {geoSearchResults.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectGeocodeResult(res)}
                      className="w-full text-left p-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 transition flex items-center justify-between"
                    >
                      <div className="truncate">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{res.displayName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{res.country}</div>
                      </div>
                      <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-semibold ml-2 whitespace-nowrap">
                        {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Location Name *</label>
                  <input
                    type="text"
                    value={locName}
                    onChange={e => setLocName(e.target.value)}
                    placeholder="e.g. Cape Town Harbor"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Country *</label>
                  <input
                    type="text"
                    value={locCountry}
                    onChange={e => setLocCountry(e.target.value)}
                    placeholder="e.g. South Africa"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">City / Coastal Zone</label>
                  <input
                    type="text"
                    value={locCity}
                    onChange={e => setLocCity(e.target.value)}
                    placeholder="e.g. Cape Town"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={locCurrency}
                    onChange={e => setLocCurrency(e.target.value.toUpperCase())}
                    placeholder="e.g. ZAR, USD, EUR"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Coordinates fields auto-filled by search */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Latitude (°N/S) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={locLatitude}
                    onChange={e => setLocLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-slate-100 font-mono font-bold text-teal-600 dark:text-teal-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Longitude (°E/W) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={locLongitude}
                    onChange={e => setLocLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-slate-100 font-mono font-bold text-teal-600 dark:text-teal-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Location Description</label>
                <textarea
                  rows={2}
                  value={locDescription}
                  onChange={e => setLocDescription(e.target.value)}
                  placeholder="Describe coastal waters, fishing port activity, or marine zone details..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-coastal"
                  checked={locIsCoastal}
                  onChange={e => setLocIsCoastal(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="chk-coastal" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Is coastal / maritime fishing port
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button type="button" onClick={() => setAddLocationModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow">Save Marine Location</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Marine Location */}
      {editLocationModalOpen && editingLocItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Edit Marine Location Description & Settings</span>
              </h3>
              <button onClick={() => setEditLocationModalOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>

            {locationErrorMsg && (
              <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-xl p-3 text-red-800 dark:text-red-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="font-bold">{locationErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateLocation} className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{editingLocItem.name}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Country: {editingLocItem.country} • Coordinates: [{editingLocItem.coordinates?.coordinates?.[1]?.toFixed(4)}°, {editingLocItem.coordinates?.coordinates?.[0]?.toFixed(4)}°]
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold">Location Description (Fisher Community Details)</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Update description, maritime notes, or community info for this location..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">City / District</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={e => setEditCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={editCurrency}
                    onChange={e => setEditCurrency(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="chk-edit-coastal"
                  checked={editIsCoastal}
                  onChange={e => setEditIsCoastal(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="chk-edit-coastal" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Is coastal / maritime fishing port
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setEditLocationModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Location */}
      {deleteConfirmLoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Marine Location</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteConfirmLoc.name}</strong> ({deleteConfirmLoc.country})? Weather and market context for this location will be removed.
            </p>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmLoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLocation}
                disabled={deletingLocationId === deleteConfirmLoc._id}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow flex items-center space-x-1.5"
              >
                {deletingLocationId === deleteConfirmLoc._id ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Species */}
      {addSpeciesModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Species Taxonomy</h3>
              <button onClick={() => setAddSpeciesModalOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddSpecies} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Common Name</label>
                <input type="text" value={speciesCommon} onChange={e => setSpeciesCommon(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100" required />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Scientific Taxonomy Name</label>
                <input type="text" value={speciesScientific} onChange={e => setSpeciesScientific(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100" required />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Category</label>
                <select value={speciesCategory} onChange={(e: any) => setSpeciesCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100">
                  <option value="pelagic">Pelagic Fish</option>
                  <option value="demersal">Demersal / Bottom Fish</option>
                  <option value="crustacean">Crustacean</option>
                  <option value="mollusk">Mollusk</option>
                  <option value="reef_fish">Reef Fish</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setAddSpeciesModalOpen(false)} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-teal-600 text-white font-bold">Save Species Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject User with Reason */}
      {rejectingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-red-600 dark:text-red-400">Reject Registration for {rejectingUser.fullName}</h3>
            <form onSubmit={handleRejectUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Rejection Reason</label>
                <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide explanation (e.g. Unverifiable license number)..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none" required />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setRejectingUser(null)} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-red-600 text-white font-bold">Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
