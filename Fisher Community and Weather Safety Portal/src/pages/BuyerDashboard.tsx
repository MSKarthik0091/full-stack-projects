import React, { useEffect, useState } from 'react';
import { User, LocationItem, PurchaseRequest } from '../types';
import { api, setCurrentUserHeader } from '../services/api';
import { ShoppingBag, ShieldAlert, CheckCircle2, Clock, Building, ArrowRight, MapPin } from 'lucide-react';

interface BuyerDashboardProps {
  currentUser: User;
  locations?: LocationItem[];
  onNavigateTab: (tab: string) => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  currentUser,
  locations = [],
  onNavigateTab
}) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const isApproved = currentUser.accountStatus === 'approved';
  const assignedLoc = locations.find(l => l._id === currentUser.assignedLocationId);

  const loadRequests = async () => {
    setLoading(true);
    try {
      setCurrentUserHeader(currentUser._id);
      const res = await api.getMyPurchaseRequests();
      setRequests(res.requests || []);
    } catch (err) {
      console.error('Failed to load buyer requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser._id]);

  return (
    <div id="buyer-dashboard-page" className="space-y-8 pb-16">
      {/* Account Status Banner */}
      {!isApproved ? (
        <div className="bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 rounded-2xl p-6 text-amber-900 dark:text-slate-100 shadow-sm dark:shadow-xl space-y-3 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900 rounded-xl text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-amber-900 dark:text-amber-300">Buyer Account Pending Admin Approval</h2>
              <p className="text-xs text-amber-800 dark:text-slate-300">
                Your buyer registration is awaiting verification by platform administrators. You can browse market prices and public catch listings, but submitting direct purchase requests requires an approved account.
              </p>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-950 p-3 rounded-xl border border-amber-200 dark:border-slate-800 text-xs text-amber-900 dark:text-amber-200">
            💡 <strong>Evaluation Shortcut:</strong> Switch to the <strong>Admin Overseer</strong> role from the top toolbar to approve this buyer account instantly!
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-indigo-950/60 border border-slate-200 dark:border-indigo-600/60 rounded-2xl p-6 text-slate-900 dark:text-slate-100 shadow-sm dark:shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/80 rounded-xl text-indigo-700 dark:text-indigo-300">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Wholesaler / Buyer Portal</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-[10px] uppercase">
                  Verified Buyer
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-2 flex-wrap">
                <span>Organization: {currentUser.organizationName || 'Independent Wholesale Buyer'} • User: {currentUser.fullName}</span>
                {assignedLoc && (
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>Working Location: {assignedLoc.name} ({assignedLoc.country})</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('marketplace')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center space-x-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Catch Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Submitted Purchase Requests List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>My Submitted Purchase Requests ({requests.length})</span>
          </h2>

          <button
            onClick={loadRequests}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Refresh Statuses
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading purchase requests...</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3">
            <p>You have not submitted any purchase requests for landed catch yet.</p>
            <button
              onClick={() => onNavigateTab('marketplace')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow"
            >
              Browse Active Marketplace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map(req => {
              const qty = req.requestedQuantityKg ?? (req as any).quantityKg ?? 0;
              const price = req.offeredPricePerKg ?? (req as any).askingPricePerKg ?? (req as any).proposedPricePerKg ?? 0;
              const statusStr = req.requestStatus || (req as any).status || 'pending';
              const sellerName = req.fisherName || (req as any).sellerName || 'Artisanal Fisher';
              const messageText = req.message || (req as any).notes || '';
              const currencyStr = req.currency || 'INR';
              const totalValuation = qty * price;

              return (
                <div key={req._id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Listing: {req.listingTitle || 'Landed Catch'}</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">Seller: {sellerName}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      statusStr === 'accepted' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                      statusStr === 'rejected' || statusStr === 'declined' ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800' :
                      'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}>
                      {statusStr}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Order Quantity:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{qty} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Offered Price:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{price} {currencyStr}/kg</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1 mt-1">
                      <span className="text-slate-500 dark:text-slate-400">Total Valuation:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{isNaN(totalValuation) ? '0' : totalValuation.toLocaleString()} {currencyStr}</span>
                    </div>
                  </div>

                  {messageText && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      "{messageText}"
                    </p>
                  )}

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
                    <span>Submitted: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent'}</span>
                    <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">Fisher Action: {statusStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
