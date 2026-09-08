import React from 'react';
import { Waves, TrendingUp, ShoppingBag, ShieldAlert, Anchor, ArrowRight, MapPin, CheckCircle2, UserCheck } from 'lucide-react';
import { LocationItem, CatchListing, MarketPrice, SafetyAlert } from '../types';

interface LandingPageProps {
  locations: LocationItem[];
  selectedLocation: LocationItem;
  onSelectLocation: (loc: LocationItem) => void;
  onNavigateTab: (tab: string) => void;
  featuredListings: CatchListing[];
  marketPrices: MarketPrice[];
  activeAlerts: SafetyAlert[];
  onOpenAuth: (mode: 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onNavigateTab,
  featuredListings,
  marketPrices,
  activeAlerts,
  onOpenAuth
}) => {
  return (
    <div id="landing-page" className="space-y-10 pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 border border-maritime-beige dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-maritime-midnight dark:text-slate-100 shadow-lg dark:shadow-2xl transition-colors">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-maritime-teal/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-maritime-brass/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-maritime-seaglass/20 dark:bg-blue-950/80 border border-maritime-seaglass/40 dark:border-blue-800/80 text-maritime-teal dark:text-blue-300 text-xs font-bold">
            <Anchor className="w-3.5 h-3.5 text-maritime-teal dark:text-blue-400" />
            <span>GLOBAL FISHING COMMUNITY PLATFORM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-maritime-midnight dark:text-white tracking-tight leading-tight">
            Transparent Fish Prices & Live Marine Safety Portal
          </h1>

          <p className="text-sm sm:text-base text-maritime-atlantic dark:text-slate-300 leading-relaxed">
            Unifying real-time sea weather forecasts, location-aware fish market price benchmarks, public catch discovery, and direct buyer-fisher connection for coastal communities worldwide.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="btn-hero-explore"
              onClick={() => onNavigateTab('location-overview')}
              className="px-6 py-3 rounded-xl bg-maritime-teal hover:bg-maritime-atlantic font-bold text-sm text-white shadow-lg shadow-maritime-teal/30 transition flex items-center space-x-2"
            >
              <span>Explore Active Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="btn-hero-register"
              onClick={() => onOpenAuth('register')}
              className="px-6 py-3 rounded-xl bg-maritime-beige/40 dark:bg-slate-800 hover:bg-maritime-beige/70 dark:hover:bg-slate-700 font-bold text-sm text-maritime-midnight dark:text-slate-200 border border-maritime-beige dark:border-slate-700 transition flex items-center space-x-2"
            >
              <UserCheck className="w-4 h-4 text-maritime-forest dark:text-emerald-400" />
              <span>Register as Fisher or Buyer</span>
            </button>
          </div>
        </div>
      </section>

      {/* Global Location Quick Selector Bar */}
      <section className="bg-white dark:bg-slate-900 border border-maritime-beige dark:border-slate-800 rounded-2xl p-6 text-maritime-midnight dark:text-slate-100 transition-colors shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-base text-maritime-midnight dark:text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-maritime-teal dark:text-teal-400" />
              <span>Select Global Coastal Location Context</span>
            </h2>
            <p className="text-xs text-maritime-atlantic/70 dark:text-slate-400">All weather forecasts, marine wave data, market prices, and listings adjust to your chosen place.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
          {locations.map(loc => (
            <button
              key={loc._id}
              onClick={() => { onSelectLocation(loc); onNavigateTab('location-overview'); }}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                loc._id === selectedLocation._id
                  ? 'bg-maritime-seaglass/15 dark:bg-blue-950/80 border-maritime-teal dark:border-blue-500 text-maritime-midnight dark:text-white shadow-md'
                  : 'bg-maritime-ivory dark:bg-slate-950 border-maritime-beige dark:border-slate-800 text-maritime-midnight/80 dark:text-slate-300 hover:border-maritime-seaglass dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="font-bold text-xs truncate">{loc.name}</div>
              <div className="text-[10px] text-maritime-atlantic/70 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>{loc.country}</span>
                <span className="font-mono text-maritime-teal dark:text-teal-300 font-bold">{loc.currency}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Overview Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weather & Marine Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 flex flex-col justify-between space-y-4 shadow-sm transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center mb-4">
              <Waves className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Weather & Marine Conditions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live Open-Meteo forecasts for wave height, swell, sea-surface temperature, and wind speed with explicit observation source & timestamp details.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('weather')}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 transition flex items-center justify-center space-x-1"
          >
            <span>View Live Marine Conditions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Price Dashboard Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 flex flex-col justify-between space-y-4 shadow-sm transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Fish Price Benchmarks</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Transparent local market price benchmarks by fish species, min/max quotes, currency specifications, and historical trend charts.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('prices')}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-slate-300 dark:border-slate-700 transition flex items-center justify-center space-x-1"
          >
            <span>View Price Dashboards</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Catch Marketplace Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 flex flex-col justify-between space-y-4 shadow-sm transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center justify-center mb-4">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Catch Marketplace</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Approved fishers list freshly landed catch with species, quantity, asking price, catch date, and freshness; approved buyers submit direct purchase requests.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('marketplace')}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700 transition flex items-center justify-center space-x-1"
          >
            <span>Browse Catch Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Featured Catch Listings Preview */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Fresh Catch Available Now</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Discover public catch listings published by verified local fishers.</p>
          </div>
          <button
            onClick={() => onNavigateTab('marketplace')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <span>View All ({featuredListings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredListings.slice(0, 3).map(listing => (
            <div key={listing._id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div className="h-40 bg-slate-200 dark:bg-slate-800 relative">
                <img
                  src={listing.images?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 uppercase tracking-wide">
                  {listing.freshness.replace('_', ' ')}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{listing.speciesName}</div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{listing.title}</h3>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Available: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{listing.quantityAvailableKg} kg</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{listing.askingPricePerKg} {listing.currency}</span>
                    <span className="text-[10px] text-slate-400 block">/ kg</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works & Role Permissions Matrix */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-6 shadow-sm transition-colors">
        <div>
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Portal Governance & Workflow Model</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Strict adherence to role permissions and admin approval verification.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase">Role: Guest</span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Public Visitor</h4>
            <p className="text-slate-600 dark:text-slate-400">Can search any global location, view weather forecasts, wave height, fish prices, and browse public listings without an account.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-bold text-[10px] uppercase">Role: Fisher</span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Fisher (Seller)</h4>
            <p className="text-slate-600 dark:text-slate-400">Requires Admin Approval. Once approved, fishers can create catch listings, set asking prices, and accept/reject buyer purchase requests.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800 font-bold text-[10px] uppercase">Role: Buyer</span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Wholesaler / Buyer</h4>
            <p className="text-slate-600 dark:text-slate-400">Requires Admin Approval. Approved buyers can submit direct purchase requests for active catch listings with quantity and offer price.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-800 font-bold text-[10px] uppercase">Role: Admin</span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Portal Administrator</h4>
            <p className="text-slate-600 dark:text-slate-400">Approves/rejects registrations, manages fish price benchmarks, publishes safety advisories, moderates listings, and inspects audit logs.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
