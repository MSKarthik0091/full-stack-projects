import React, { useEffect, useState } from 'react';
import { LocationItem, FishSpecies, MarketPrice } from '../types';
import { api } from '../services/api';
import { TrendingUp, Filter, CheckCircle2, AlertCircle, RefreshCw, Calendar, DollarSign } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface PriceDashboardPageProps {
  locations: LocationItem[];
  speciesList: FishSpecies[];
  selectedLocation: LocationItem;
}

export const PriceDashboardPage: React.FC<PriceDashboardPageProps> = ({
  locations,
  speciesList,
  selectedLocation
}) => {
  const { resolvedTheme } = useTheme();
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>(speciesList[0]?._id || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(selectedLocation?._id || '');
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sync selectedLocationId when global selectedLocation changes
  useEffect(() => {
    if (selectedLocation?._id && !selectedLocationId) {
      setSelectedLocationId(selectedLocation._id);
    }
  }, [selectedLocation?._id]);

  const fetchPricesAndTrends = async () => {
    setLoading(true);
    try {
      const [pricesRes, trendsRes] = await Promise.all([
        api.getMarketPrices(selectedSpeciesId || undefined, selectedLocationId || undefined),
        api.getPriceTrends(selectedSpeciesId || speciesList[0]?._id, selectedLocationId || undefined)
      ]);
      setPrices(pricesRes.prices);
      setTrendData(trendsRes);
    } catch (err) {
      console.error('Failed to load market prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricesAndTrends();
  }, [selectedSpeciesId, selectedLocationId]);

  const activeSpecies = speciesList.find(s => s._id === (selectedSpeciesId || speciesList[0]?._id));
  const activeLocation = locations.find(l => l._id === selectedLocationId);
  const isDark = resolvedTheme === 'dark';

  return (
    <div id="price-dashboard-page" className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Location-Aware Fish Price Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Transparent market price benchmarks, currency specifications, minimum/maximum range quotes, and historical trend series.
          </p>
        </div>

        <button
          onClick={fetchPricesAndTrends}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition flex items-center space-x-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Benchmarks</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-slate-900 dark:text-slate-100 flex flex-wrap items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Filter Price Benchmarks:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold mb-1">Fish Species</label>
            <select
              value={selectedSpeciesId}
              onChange={(e) => setSelectedSpeciesId(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 outline-none font-medium"
            >
              <option value="">All Fish Species</option>
              {speciesList.map(s => (
                <option key={s._id} value={s._id}>{s.commonName} ({s.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold mb-1">Landing Location</label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 outline-none font-medium"
            >
              <option value="">All Global Locations</option>
              {locations.map(l => (
                <option key={l._id} value={l._id}>{l.name} ({l.country})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recharts Price Trend Chart */}
      {trendData && trendData.history && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Historical Price Trend: {activeSpecies?.commonName || 'Selected Species'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Recorded average price per kg over past observation dates across landing hubs.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-800">
              Avg: {trendData.avgPrice} {trendData.currency}/kg
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData.history}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} />
                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} unit={` ${trendData.currency}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '0.75rem',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgPrice"
                  name="Average Price/kg"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Benchmarks Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Active Market Price Records ({prices.length})</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Currency-Explicit Quotes</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading Price Records...</div>
        ) : prices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">No price records found for the selected filter combination.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-950">
                  <th className="p-3">Species</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Avg Price / kg</th>
                  <th className="p-3">Min - Max Range</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Source & Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {prices.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{p.speciesName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Market Class</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{p.locationName}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        {p.avgPricePerKg} {p.currency}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-slate-600 dark:text-slate-300">
                        {p.minPricePerKg} - {p.maxPricePerKg} {p.currency}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.verificationStatus === 'verified'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {p.verificationStatus === 'verified' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        )}
                        <span>{p.verificationStatus}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.reportedBy}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{new Date(p.dateRecorded).toLocaleDateString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
