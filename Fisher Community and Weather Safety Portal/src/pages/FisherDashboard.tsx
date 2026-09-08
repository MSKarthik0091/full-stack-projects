import React, { useEffect, useState } from 'react';
import { User, LocationItem, FishSpecies, CatchListing, PurchaseRequest, WeatherData, SafetyAlert } from '../types';
import { api, setCurrentUserHeader } from '../services/api';
import { UserCheck, ShieldAlert, Plus, CheckCircle2, XCircle, Anchor, ShoppingBag, Waves, AlertTriangle, MapPin, X } from 'lucide-react';

interface FisherDashboardProps {
  currentUser: User;
  locations: LocationItem[];
  speciesList: FishSpecies[];
}

export const FisherDashboard: React.FC<FisherDashboardProps> = ({
  currentUser,
  locations,
  speciesList
}) => {
  const [myListings, setMyListings] = useState<CatchListing[]>([]);
  const [myRequests, setMyRequests] = useState<PurchaseRequest[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Fisher assigned working location
  const userLocationId = currentUser.assignedLocationId || locations[0]?._id;
  const assignedLocation = locations.find(l => l._id === userLocationId) || locations[0];

  // Listing Form Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [speciesId, setSpeciesId] = useState(speciesList[0]?._id || '');
  const [customSpeciesName, setCustomSpeciesName] = useState('');
  const [quantityKg, setQuantityKg] = useState(250);
  const [askingPrice, setAskingPrice] = useState(12.50);
  const [catchDate, setCatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [freshness, setFreshness] = useState<'very_fresh' | 'fresh' | 'chilled' | 'frozen'>('very_fresh');
  const [storageMethod, setStorageMethod] = useState('ice');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  const isApproved = currentUser.accountStatus === 'approved';

  const loadFisherData = async () => {
    setLoading(true);
    try {
      setCurrentUserHeader(currentUser._id);
      const [listingsRes, requestsRes] = await Promise.all([
        api.getListings(),
        api.getMyPurchaseRequests()
      ]);

      const fisherListings = listingsRes.listings.filter(l => l.fisherId === currentUser._id);
      setMyListings(fisherListings);

      const myListingIds = new Set(fisherListings.map(l => l._id));
      // Only show purchase requests intended for this specific fisher's listings
      const fisherRequests = (requestsRes.requests || []).filter(
        r => r.fisherId === currentUser._id || myListingIds.has(r.listingId)
      );
      setMyRequests(fisherRequests);

      if (userLocationId) {
        const wxRes = await api.getWeather(userLocationId);
        const alertRes = await api.getSafetyAlerts(userLocationId);
        setWeather(wxRes.data);
        setAlerts(alertRes.alerts);
      }
    } catch (err) {
      console.error('Failed to load fisher dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFisherData();
  }, [currentUser._id, userLocationId]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApproved) {
      setFormError('Account not approved. You cannot create catch listings until approved by Admin.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (catchDate > todayStr) {
      setFormError('Catch date cannot be in the future. Please select today or a past date.');
      return;
    }

    if (speciesId === 'others' && !customSpeciesName.trim()) {
      setFormError('Please specify the custom fish species name.');
      return;
    }

    setSubmittingForm(true);
    setFormError('');

    try {
      const isOthers = speciesId === 'others';
      const selectedSpec = speciesList.find(s => s._id === speciesId);
      const speciesNameResolved = isOthers
        ? customSpeciesName.trim()
        : (selectedSpec?.commonName || 'Unknown Species');

      await api.createListing({
        fishSpeciesId: speciesId,
        speciesId,
        speciesName: speciesNameResolved,
        landingLocationId: userLocationId,
        landingLocationName: assignedLocation?.name || 'Assigned Location',
        catchLocationId: userLocationId,
        catchLocationName: assignedLocation?.name || 'Assigned Location',
        title: title || `Fresh ${speciesNameResolved} Landing`,
        description,
        quantityAvailableKg: Number(quantityKg),
        minimumOrderQuantityKg: 1,
        askingPricePerKg: Number(askingPrice),
        currency: assignedLocation?.currency || 'USD',
        catchDate,
        freshness,
        storageMethod,
        images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80']
      });

      setCreateModalOpen(false);
      loadFisherData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to publish catch listing.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.updatePurchaseRequestStatus(requestId, status);
      loadFisherData();
    } catch (err) {
      console.error('Failed to update request status:', err);
    }
  };

  return (
    <div id="fisher-dashboard-page" className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-colors">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Anchor className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Fisher Operations Dashboard</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              isApproved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            }`}>
              {currentUser.accountStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Welcome, {currentUser.fullName} ({currentUser.vesselName || 'Fisherman'}) • License: {currentUser.licenseNumber || 'Verified'}
          </p>
        </div>

        {isApproved ? (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Publish New Catch Listing</span>
          </button>
        ) : (
          <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 font-medium">
            Account pending admin approval to list catch.
          </div>
        )}
      </div>

      {/* Account Status Alert if Pending */}
      {!isApproved && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900/80 p-5 rounded-2xl text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">Fisher Verification Pending</span>
            <p>
              Your fisher registration is under review by the portal administration. While pending, you can monitor live weather forecasts and price benchmarks, but publishing new catch listings or accepting buyer purchase requests requires official approval.
            </p>
          </div>
        </div>
      )}

      {/* Live Safety Summary for Fisher */}
      {alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-2xl p-5 text-red-900 dark:text-red-200 space-y-2 shadow-sm">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>Maritime Warning Notice for Your Sector</span>
          </div>
          <p className="text-xs">{alerts[0]?.title}: {alerts[0]?.message}</p>
        </div>
      )}

      {/* Two Column Layout: My Listings & Incoming Purchase Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: My Catch Listings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>My Published Landings ({myListings.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading listings...</div>
          ) : myListings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p>You have not published any catch listings yet.</p>
              {isApproved && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Create your first listing now →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map(item => (
                <div key={item._id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.speciesName} • {item.landingLocationName}</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                      {item.askingPricePerKg} {item.currency}/kg
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <span>Available: <strong className="text-slate-800 dark:text-slate-200">{item.quantityAvailableKg} kg</strong></span>
                    <span className="capitalize">Status: <strong className="text-emerald-600 dark:text-emerald-400">{item.status}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Incoming Purchase Requests */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Incoming Buyer Purchase Requests ({myRequests.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading buyer requests...</div>
          ) : myRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">No purchase requests submitted for your listings yet.</div>
          ) : (
            <div className="space-y-3">
              {myRequests.map(req => {
                const statusStr = req.requestStatus || (req as any).status || 'pending';
                const qty = req.requestedQuantityKg || (req as any).quantityKg || 0;
                const price = req.offeredPricePerKg || (req as any).askingPricePerKg || (req as any).proposedPricePerKg || 0;
                const noteText = req.message || (req as any).notes || '';
                const titleText = req.listingTitle || 'Catch Listing Proposal';
                const buyerDisplayName = req.buyerName || req.buyerBusinessName || 'Interested Buyer';
                const currencyStr = req.currency || 'USD';

                return (
                  <div key={req._id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                          Buyer Request from: {buyerDisplayName}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{titleText}</h4>
                        {noteText && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                            "{noteText}"
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 border ${
                        statusStr === 'accepted' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' :
                        statusStr === 'rejected' || statusStr === 'declined' ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800' :
                        'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}>
                        {statusStr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Order Qty: </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{qty} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Offer Price: </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{price} {currencyStr}/kg</span>
                      </div>
                    </div>

                    {statusStr === 'pending' && (
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleUpdateRequestStatus(req._id, 'accepted')}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Offer</span>
                        </button>
                        <button
                          onClick={() => handleUpdateRequestStatus(req._id, 'rejected')}
                          className="flex-1 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center space-x-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline Offer</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Listing Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Publish Landed Catch Listing</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 p-3 rounded-xl text-red-900 dark:text-red-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Catch Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Freshly Landed Yellowfin Tuna (Ice Slurry Stored)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Fish Species</label>
                  <select
                    value={speciesId}
                    onChange={(e) => setSpeciesId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                  >
                    {speciesList.map(s => (
                      <option key={s._id} value={s._id}>{s.commonName} ({s.category})</option>
                    ))}
                    <option value="others">Others (Custom Fish Species)</option>
                  </select>

                  {speciesId === 'others' && (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <label className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1 text-[11px]">
                        Specify Fish Species Name:
                      </label>
                      <input
                        type="text"
                        value={customSpeciesName}
                        onChange={(e) => setCustomSpeciesName(e.target.value)}
                        placeholder="e.g. Red Snapper, Mahi Mahi, Kingfish..."
                        className="w-full bg-emerald-50/50 dark:bg-slate-800/90 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 outline-none font-medium text-xs"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Landing Location <span className="text-emerald-600 dark:text-emerald-400 font-normal text-[10px]">(Fixed to Working Location)</span>
                  </label>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 flex items-center justify-between font-semibold">
                    <span className="flex items-center space-x-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{assignedLocation?.name} ({assignedLocation?.country})</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold uppercase border border-emerald-300 dark:border-emerald-800 flex-shrink-0">
                      Assigned
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Total Quantity Available (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Asking Price per kg</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none font-bold text-emerald-600 dark:text-emerald-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Freshness Quality</label>
                  <select
                    value={freshness}
                    onChange={(e: any) => setFreshness(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="very_fresh">Very Fresh (Grade A)</option>
                    <option value="fresh">Fresh (Chilled)</option>
                    <option value="frozen">Frozen at Sea</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Catch Date</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={catchDate}
                    onChange={(e) => setCatchDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Description & Storage Details</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe vessel catch method, ice preservation quality, or target pickup time..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow"
                >
                  {submittingForm ? 'Publishing...' : 'Publish Catch Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
