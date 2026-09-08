import React, { useEffect, useState } from 'react';
import { LocationItem, FishSpecies, CatchListing, User } from '../types';
import { api } from '../services/api';
import { ShoppingBag, Search, Filter, ShieldAlert, CheckCircle2, Clock, MapPin, UserCheck, X, AlertCircle, Plus } from 'lucide-react';

interface MarketplacePageProps {
  locations: LocationItem[];
  speciesList: FishSpecies[];
  currentUser: User | null;
  onOpenAuth: (mode: 'register') => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  locations,
  speciesList,
  currentUser,
  onOpenAuth
}) => {
  const [listings, setListings] = useState<CatchListing[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedFreshness, setSelectedFreshness] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Listing for Modal & Purchase Request
  const [activeListing, setActiveListing] = useState<CatchListing | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestedQty, setRequestedQty] = useState<number>(50);
  const [offeredPrice, setOfferedPrice] = useState<number>(0);
  const [requestMsg, setRequestMsg] = useState('');

  const [submittingReq, setSubmittingReq] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  // Publish Catch Modal State (Strictly for Fishers)
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [pubTitle, setPubTitle] = useState('');
  const [pubSpeciesId, setPubSpeciesId] = useState('');
  const [pubCustomSpeciesName, setPubCustomSpeciesName] = useState('');
  const [pubQuantityKg, setPubQuantityKg] = useState<number>(250);
  const [pubAskingPrice, setPubAskingPrice] = useState<number>(12.5);
  const [pubCatchDate, setPubCatchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pubFreshness, setPubFreshness] = useState<'very_fresh' | 'fresh' | 'chilled' | 'frozen'>('very_fresh');
  const [pubStorageMethod, setPubStorageMethod] = useState('ice_slurry');
  const [pubDescription, setPubDescription] = useState('');
  const [pubMinOrderQty, setPubMinOrderQty] = useState<number>(25);

  const [submittingPublish, setSubmittingPublish] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.getListings({
        search,
        speciesId: selectedSpeciesId || undefined,
        locationId: selectedLocationId || undefined,
        freshness: selectedFreshness || undefined
      });
      setListings(res.listings);
    } catch (err) {
      console.error('Failed to load marketplace listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const userAssignedLocId = currentUser?.assignedLocationId;
  const userAssignedLoc = locations.find(l => l._id === userAssignedLocId);

  useEffect(() => {
    if (userAssignedLocId && !selectedLocationId) {
      setSelectedLocationId(userAssignedLocId);
    }
  }, [userAssignedLocId]);

  useEffect(() => {
    fetchListings();
  }, [search, selectedSpeciesId, selectedLocationId, selectedFreshness]);

  const handleOpenRequest = (listing: CatchListing) => {
    setActiveListing(listing);
    const defaultQty = Math.min(10, listing.quantityAvailableKg || 1);
    setRequestedQty(defaultQty);
    setOfferedPrice(listing.askingPricePerKg);
    setRequestMsg(`Hi, I would like to request ${defaultQty} kg of ${listing.title}. Please confirm availability.`);
    setRequestError('');
    setRequestSuccess('');
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListing) return;

    if (!currentUser) {
      setRequestError('You must be logged in as an Approved Buyer to submit purchase requests.');
      return;
    }

    if (currentUser.role !== 'buyer') {
      setRequestError('Only Buyer account holders can submit purchase requests. Currently logged in as ' + currentUser.role);
      return;
    }

    if (currentUser.accountStatus !== 'approved') {
      setRequestError('Your Buyer account is pending admin approval. You cannot submit purchase requests until approved.');
      return;
    }

    if (userAssignedLocId && activeListing.landingLocationId !== userAssignedLocId && activeListing.catchLocationId !== userAssignedLocId) {
      setRequestError(`Buyers can only submit purchase requests for catch landed at their assigned working location (${userAssignedLoc?.name || 'Assigned Location'}). This catch is landed at ${activeListing.landingLocationName}.`);
      return;
    }

    if (requestedQty > activeListing.quantityAvailableKg) {
      setRequestError(`Only ${activeListing.quantityAvailableKg} kg is available for this catch.`);
      return;
    }

    if (requestedQty <= 0) {
      setRequestError('Requested quantity must be greater than 0 kg.');
      return;
    }

    setSubmittingReq(true);
    setRequestError('');
    setRequestSuccess('');

    try {
      await api.submitPurchaseRequest({
        listingId: activeListing._id,
        requestedQuantityKg: requestedQty,
        offeredPricePerKg: offeredPrice,
        message: requestMsg
      });
      setRequestSuccess('Purchase request submitted successfully! The fisher will receive a notification to accept or reject.');
      setTimeout(() => {
        setRequestModalOpen(false);
        fetchListings();
      }, 2000);
    } catch (err: any) {
      setRequestError(err.message || 'Failed to submit purchase request.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleOpenPublishModal = () => {
    setPubTitle('');
    setPubSpeciesId(speciesList[0]?._id || '');
    setPubCustomSpeciesName('');
    setPubQuantityKg(250);
    setPubAskingPrice(12.5);
    setPubCatchDate(new Date().toISOString().split('T')[0]);
    setPubFreshness('very_fresh');
    setPubStorageMethod('ice_slurry');
    setPubDescription('');
    setPubMinOrderQty(25);
    setPublishError('');
    setPublishSuccess('');
    setPublishModalOpen(true);
  };

  const handleSubmitPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'fisher') {
      setPublishError('Only logged-in fishers can publish catch listings.');
      return;
    }

    if (currentUser.accountStatus !== 'approved') {
      setPublishError('Your Fisher account is pending admin approval. You cannot publish catch listings until approved by Admin.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (pubCatchDate > todayStr) {
      setPublishError('Catch date cannot be in the future. Please select today or a past date.');
      return;
    }

    if (pubSpeciesId === 'others' && !pubCustomSpeciesName.trim()) {
      setPublishError('Please specify the custom fish species name.');
      return;
    }

    setSubmittingPublish(true);
    setPublishError('');
    setPublishSuccess('');

    try {
      const isOthers = pubSpeciesId === 'others';
      const selectedSpec = speciesList.find(s => s._id === pubSpeciesId);
      const speciesNameResolved = isOthers
        ? pubCustomSpeciesName.trim()
        : (selectedSpec?.commonName || 'Unknown Species');

      const targetLocId = userAssignedLocId || locations[0]?._id;
      const targetLocObj = userAssignedLoc || locations[0];

      await api.createListing({
        fishSpeciesId: pubSpeciesId,
        speciesId: pubSpeciesId,
        speciesName: speciesNameResolved,
        landingLocationId: targetLocId,
        landingLocationName: targetLocObj?.name || 'Assigned Location',
        catchLocationId: targetLocId,
        catchLocationName: targetLocObj?.name || 'Assigned Location',
        title: pubTitle || `Fresh ${speciesNameResolved} Landing`,
        description: pubDescription,
        quantityAvailableKg: Number(pubQuantityKg),
        minimumOrderQuantityKg: Number(pubMinOrderQty),
        askingPricePerKg: Number(pubAskingPrice),
        currency: targetLocObj?.currency || 'USD',
        catchDate: pubCatchDate,
        freshness: pubFreshness,
        storageMethod: pubStorageMethod,
        images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80']
      });

      setPublishSuccess('Catch listing published successfully to the marketplace!');
      setTimeout(() => {
        setPublishModalOpen(false);
        fetchListings();
      }, 1500);
    } catch (err: any) {
      setPublishError(err.message || 'Failed to publish catch listing.');
    } finally {
      setSubmittingPublish(false);
    }
  };

  const isApprovedBuyer = currentUser?.role === 'buyer' && currentUser?.accountStatus === 'approved';

  return (
    <div id="marketplace-page" className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span>Public Catch Marketplace</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Freshly landed catch published by verified fishers. Approved buyers submit purchase requests directly.
          </p>
        </div>

        {!currentUser ? (
          <button
            onClick={() => onOpenAuth('register')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md transition flex items-center space-x-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Register as Buyer or Fisher</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 dark:text-slate-400">Logged in as:</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentUser.fullName}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isApprovedBuyer ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {currentUser.role} ({currentUser.accountStatus})
              </span>
            </div>

            {/* ONLY for Fishers Alone */}
            {currentUser.role === 'fisher' && (
              <button
                id="btn-publish-new-catch-header"
                onClick={handleOpenPublishModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Catch</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Working Location Info Banner for Logged-In Users */}
      {currentUser && userAssignedLoc && (
        <div className="bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 p-4 rounded-xl text-indigo-900 dark:text-indigo-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>
              Assigned Working Location: <strong className="font-bold">{userAssignedLoc.name} ({userAssignedLoc.country})</strong>
              {currentUser.role === 'buyer' ? ' — Purchase requests are strictly limited to catch landed at your assigned working location.' : ' — You publish listings for your location.'}
            </span>
          </div>
          {selectedLocationId !== userAssignedLocId && (
            <button
              onClick={() => setSelectedLocationId(userAssignedLocId!)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg shadow transition flex-shrink-0"
            >
              Filter to My Location
            </button>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title, species, fisher, landing port..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedSpeciesId}
              onChange={(e) => setSelectedSpeciesId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none"
            >
              <option value="">All Species</option>
              {speciesList.map(s => (
                <option key={s._id} value={s._id}>{s.commonName}</option>
              ))}
            </select>

            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none"
            >
              <option value="">All Locations</option>
              {locations.map(l => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>

            <select
              value={selectedFreshness}
              onChange={(e) => setSelectedFreshness(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none"
            >
              <option value="">All Freshness</option>
              <option value="fresh_chilled">Fresh Chilled</option>
              <option value="frozen_at_sea">Frozen at Sea</option>
              <option value="live">Live Catch</option>
            </select>

            {/* ONLY for Fishers Alone */}
            {currentUser?.role === 'fisher' && (
              <button
                id="btn-publish-new-catch-toolbar"
                onClick={handleOpenPublishModal}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Catch</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Catch Listings */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 animate-pulse">Searching Catch Marketplace...</div>
      ) : listings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
          No catch listings match your active filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(item => {
            const isLocationMatch = !userAssignedLocId || item.landingLocationId === userAssignedLocId || item.catchLocationId === userAssignedLocId;
            return (
              <div key={item._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm dark:shadow-lg flex flex-col justify-between">
                <div>
                  <div className="h-48 bg-slate-200 dark:bg-slate-800 relative">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      <span className="bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 uppercase tracking-wide">
                        {item.freshness.replace('_', ' ')}
                      </span>
                      <span className="bg-slate-900/90 text-slate-100 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700">
                        Available: {item.quantityAvailableKg} kg
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>{item.speciesName}</span>
                      <span className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>{item.landingLocationName}</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{item.description}</p>

                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Landed By:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{item.fisherName}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Available Quantity:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.quantityAvailableKg} kg</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Catch Date:</span>
                        <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">{new Date(item.catchDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                  <div>
                    <div className="font-black text-emerald-600 dark:text-emerald-400 text-lg font-mono">
                      {item.askingPricePerKg} {item.currency}
                    </div>
                    <span className="text-[10px] text-slate-400">per kg</span>
                  </div>

                  {currentUser?.role === 'fisher' ? (
                    item.fisherId === currentUser._id ? (
                      <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>My Listed Catch</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl font-medium text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed">
                        For Buyers Only
                      </span>
                    )
                  ) : currentUser?.role === 'buyer' ? (
                    <button
                      id={`btn-request-catch-${item._id}`}
                      onClick={() => handleOpenRequest(item)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center space-x-1 ${
                        !isLocationMatch
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{!isLocationMatch ? 'Location Restricted' : 'Request Purchase'}</span>
                    </button>
                  ) : (
                    <button
                      id={`btn-request-catch-${item._id}`}
                      onClick={() => handleOpenRequest(item)}
                      className="px-4 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow transition flex items-center space-x-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Request Purchase</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Purchase Request Modal */}
      {requestModalOpen && activeListing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Submit Purchase Request</span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{activeListing.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Fisher: {activeListing.fisherName} • Location: {activeListing.landingLocationName}</p>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {requestError && (
              <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 p-3.5 rounded-xl text-red-900 dark:text-red-200 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Role Permission Warning: </span>
                  {requestError}
                </div>
              </div>
            )}

            {requestSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Submitted: </span>
                  {requestSuccess}
                </div>
              </div>
            )}

            {!isApprovedBuyer ? (
              <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900 p-4 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-center space-x-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Approved Buyer Account Required</span>
                </div>
                <p>
                  To maintain marketplace trust, purchase requests can only be dispatched by registered buyers whose accounts have been verified by the Portal Administrator.
                </p>
                {!currentUser && (
                  <button
                    onClick={() => { setRequestModalOpen(false); onOpenAuth('register'); }}
                    className="mt-2 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs"
                  >
                    Register as Buyer Now
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Requested Quantity (kg)</label>
                    <input
                      type="number"
                      min={1}
                      max={activeListing.quantityAvailableKg}
                      value={requestedQty}
                      onChange={(e) => setRequestedQty(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none font-bold"
                      required
                    />
                    <span className="text-[10px] text-slate-400">Available: {activeListing.quantityAvailableKg} kg</span>
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Offered Price per kg ({activeListing.currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={offeredPrice}
                      onChange={(e) => setOfferedPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none font-bold text-emerald-600 dark:text-emerald-400"
                      required
                    />
                    <span className="text-[10px] text-slate-400">Asking price: {activeListing.askingPricePerKg} {activeListing.currency}</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Total Estimated Value</label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center font-bold">
                    <span className="text-slate-500 dark:text-slate-400">Est. Total:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-black">
                      {(requestedQty * offeredPrice).toFixed(2)} {activeListing.currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Message / Pickup Notes for Fisher</label>
                  <textarea
                    rows={3}
                    value={requestMsg}
                    onChange={(e) => setRequestMsg(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none"
                    placeholder="Specify target delivery or port pickup preferences..."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReq}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow"
                  >
                    {submittingReq ? 'Submitting...' : 'Send Purchase Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Publish New Catch Modal (Strictly for Fishers) */}
      {publishModalOpen && currentUser?.role === 'fisher' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Publish Landed Catch Listing</span>
              </h3>
              <button
                onClick={() => setPublishModalOpen(false)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {publishError && (
              <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 p-3.5 rounded-xl text-red-900 dark:text-red-200 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error: </span>
                  {publishError}
                </div>
              </div>
            )}

            {publishSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Published: </span>
                  {publishSuccess}
                </div>
              </div>
            )}

            {currentUser.accountStatus !== 'approved' ? (
              <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900 p-4 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-center space-x-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Fisher Account Approval Pending</span>
                </div>
                <p>
                  Your Fisher account is currently pending verification by the Portal Administrator. Once approved, you will be able to publish live catch listings to the marketplace.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPublish} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Catch Title</label>
                  <input
                    type="text"
                    value={pubTitle}
                    onChange={(e) => setPubTitle(e.target.value)}
                    placeholder="e.g. Freshly Landed Yellowfin Tuna (Ice Slurry Stored)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Fish Species</label>
                    <select
                      value={pubSpeciesId}
                      onChange={(e) => setPubSpeciesId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                    >
                      {speciesList.map(s => (
                        <option key={s._id} value={s._id}>{s.commonName} ({s.category})</option>
                      ))}
                      <option value="others">Others (Custom Fish Species)</option>
                    </select>

                    {pubSpeciesId === 'others' && (
                      <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <label className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1 text-[11px]">
                          Specify Fish Species Name:
                        </label>
                        <input
                          type="text"
                          value={pubCustomSpeciesName}
                          onChange={(e) => setPubCustomSpeciesName(e.target.value)}
                          placeholder="e.g. Red Snapper, Mahi Mahi, Kingfish..."
                          className="w-full bg-emerald-50/50 dark:bg-slate-800/90 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 outline-none font-medium text-xs"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                      Landing Location <span className="text-emerald-600 dark:text-emerald-400 font-normal text-[10px]">(Assigned)</span>
                    </label>
                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 flex items-center justify-between font-semibold">
                      <span className="flex items-center space-x-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{userAssignedLoc?.name || locations[0]?.name}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Total Quantity (kg)</label>
                    <input
                      type="number"
                      min="1"
                      value={pubQuantityKg}
                      onChange={(e) => setPubQuantityKg(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Min Order Qty (kg)</label>
                    <input
                      type="number"
                      min="1"
                      max={pubQuantityKg}
                      value={pubMinOrderQty}
                      onChange={(e) => setPubMinOrderQty(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Asking Price / kg ({userAssignedLoc?.currency || locations[0]?.currency || 'USD'})</label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={pubAskingPrice}
                      onChange={(e) => setPubAskingPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none font-bold text-emerald-600 dark:text-emerald-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Freshness Quality</label>
                    <select
                      value={pubFreshness}
                      onChange={(e: any) => setPubFreshness(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                    >
                      <option value="very_fresh">Very Fresh (Grade A)</option>
                      <option value="fresh">Fresh (Chilled)</option>
                      <option value="frozen">Frozen at Sea</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Catch Date</label>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={pubCatchDate}
                      onChange={(e) => setPubCatchDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Storage Method</label>
                    <select
                      value={pubStorageMethod}
                      onChange={(e) => setPubStorageMethod(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                    >
                      <option value="ice_slurry">Ice Slurry / Chilled</option>
                      <option value="dry_ice">Dry Ice / Blast Frozen</option>
                      <option value="live_tank">Live Tank Aerated</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Description & Notes</label>
                  <textarea
                    rows={2}
                    value={pubDescription}
                    onChange={(e) => setPubDescription(e.target.value)}
                    placeholder="Describe vessel catch method, quality details, or port pickup time..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPublish}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow transition flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{submittingPublish ? 'Publishing...' : 'Publish Catch Listing'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
