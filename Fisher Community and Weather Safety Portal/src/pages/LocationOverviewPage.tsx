import React, { useEffect, useState } from 'react';
import { LocationItem, WeatherData, MarineData, SafetyAlert, MarketPrice, CatchListing } from '../types';
import { api } from '../services/api';
import { MapPin, Waves, Wind, Thermometer, ShieldAlert, TrendingUp, ShoppingBag, Clock, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';

interface LocationOverviewPageProps {
  location: LocationItem;
  locations: LocationItem[];
  onSelectLocation: (loc: LocationItem) => void;
  onNavigateTab: (tab: string) => void;
}

export const LocationOverviewPage: React.FC<LocationOverviewPageProps> = ({
  location,
  locations,
  onSelectLocation,
  onNavigateTab
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [marine, setMarine] = useState<MarineData | null>(null);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [listings, setListings] = useState<CatchListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [wxRes, marineRes, alertsRes, pricesRes, listingsRes] = await Promise.all([
        api.getWeather(location._id),
        api.getMarine(location._id),
        api.getSafetyAlerts(location._id),
        api.getMarketPrices(undefined, location._id),
        api.getListings({ locationId: location._id })
      ]);

      setWeather(wxRes.data);
      setMarine(marineRes.data);
      setAlerts(alertsRes.alerts);
      setPrices(pricesRes.prices);
      setListings(listingsRes.listings);
    } catch (err) {
      console.error('Failed to load location overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [location._id]);

  const [lon, lat] = location.coordinates.coordinates;

  return (
    <div id="location-overview-page" className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 shadow-sm dark:shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{location.name} Overview</h1>
            {location.isCoastal && (
              <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 text-[10px] font-bold uppercase tracking-wider">
                Coastal Waters
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {location.country} • Coordinates: [{lat.toFixed(3)}°N, {lon.toFixed(3)}°E] • Currency: <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold">{location.currency}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchOverviewData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh All Data</span>
          </button>
        </div>
      </div>

      {/* Safety Alert Disclaimer Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-2xl p-5 text-red-900 dark:text-red-200 space-y-3 shadow-md">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>Active Safety Advisories for {location.name} ({alerts.length})</span>
          </div>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a._id} className="bg-white/80 dark:bg-red-900/40 p-3 rounded-xl border border-red-200 dark:border-red-800 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-red-800 dark:text-red-300">
                  <span>{a.title}</span>
                  <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800">{a.severity}</span>
                </div>
                <p className="text-red-700 dark:text-red-200 text-[11px]">{a.message}</p>
                <div className="text-[10px] text-red-600 dark:text-red-400 font-mono">Issued by: {a.issuedBy} • {new Date(a.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Marine & Weather */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weather & Marine Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Waves className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Live Marine & Weather Forecast</h2>
              </div>
              <button
                onClick={() => onNavigateTab('weather')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
              >
                <span>Full Forecast</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Fetching Open-Meteo Marine Data...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Wave Height</span>
                  <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">{marine?.wave?.height ?? 'N/A'} m</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block capitalize">{marine?.seaCondition ? marine.seaCondition.replace('_', ' ') : 'Moderate'}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Swell Period</span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">{marine?.swell?.period ?? 'N/A'} s</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{marine?.swell?.direction ?? 0}° Dir</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Sea Temp (SST)</span>
                  <span className="text-xl font-black text-teal-600 dark:text-teal-400">{marine?.seaSurfaceTemperature?.value ?? 'N/A'} °C</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Ocean Surface</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Wind & Air</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-200">{weather?.wind?.speed ?? 'N/A'} km/h</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{weather?.temperature?.value ?? 'N/A'} °C Air</span>
                </div>
              </div>
            )}

            {/* Official Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Official Guidance Notice: </span>
                Weather and marine conditions are retrieved from Open-Meteo Marine API and provided strictly for informational guidance. Fishers must double-check official local port authorities before setting off to sea.
              </div>
            </div>
          </div>

          {/* Landed Catch Listings at Location */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Recent Landed Catch ({listings.length})</h2>
              </div>
              <button
                onClick={() => onNavigateTab('marketplace')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
              >
                <span>View Marketplace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {listings.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No active landed catch listings at {location.name}.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listings.slice(0, 4).map(item => (
                  <div key={item._id} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.speciesName}</span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-800">
                        {item.askingPricePerKg} {item.currency}/kg
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span>Available: {item.quantityAvailableKg} kg</span>
                      <span className="capitalize">{item.freshness.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Fish Market Prices */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-bold text-base text-slate-900 dark:text-white">Price Benchmarks</h2>
              </div>
              <button
                onClick={() => onNavigateTab('prices')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Dashboard
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">Recorded market prices for common fish landed at {location.name}.</p>

            <div className="space-y-3">
              {prices.map(p => (
                <div key={p._id} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="text-slate-900 dark:text-slate-100">{p.speciesName}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">{p.avgPricePerKg} {p.currency}/kg</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Range: {p.minPricePerKg} - {p.maxPricePerKg}</span>
                    <span>Verified: {p.verificationStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
