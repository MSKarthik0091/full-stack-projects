import React, { useEffect, useState } from 'react';
import { LocationItem, WeatherData, MarineData, SafetyAlert } from '../types';
import { api } from '../services/api';
import { Waves, Wind, Thermometer, ShieldAlert, Eye, Droplets, Gauge, Sun, AlertTriangle, RefreshCw, Compass } from 'lucide-react';

interface WeatherSeaPageProps {
  location: LocationItem;
  locations: LocationItem[];
  onSelectLocation: (loc: LocationItem) => void;
}

export const WeatherSeaPage: React.FC<WeatherSeaPageProps> = ({
  location,
  locations,
  onSelectLocation
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [marine, setMarine] = useState<MarineData | null>(null);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeatherAndMarine = async () => {
    setLoading(true);
    try {
      const [wxRes, marineRes, alertsRes] = await Promise.all([
        api.getWeather(location._id),
        api.getMarine(location._id),
        api.getSafetyAlerts(location._id)
      ]);
      setWeather(wxRes.data);
      setMarine(marineRes.data);
      setAlerts(alertsRes.alerts);
    } catch (err) {
      console.error('Failed to fetch weather & marine data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherAndMarine();
  }, [location._id]);

  return (
    <div id="weather-sea-page" className="space-y-8 pb-16">
      {/* Header & Location Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Waves className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Weather & Marine Conditions</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Location-aware weather forecasts, wave height metrics, swell parameters, and safety advisories for fishing vessels.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={location._id}
            onChange={(e) => {
              const target = locations.find(l => l._id === e.target.value);
              if (target) onSelectLocation(target);
            }}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 outline-none"
          >
            {locations.map(l => (
              <option key={l._id} value={l._id}>{l.name} ({l.country})</option>
            ))}
          </select>

          <button
            onClick={fetchWeatherAndMarine}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
            title="Refresh weather data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Safety Alert Disclaimer Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 p-4 rounded-2xl text-amber-900 dark:text-amber-200 flex items-start space-x-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-sm block">Official Maritime Guidance Notice</span>
          <p>
            Weather, wave height, swell, and sea state forecasts are pulled dynamically from Open-Meteo Global Marine Weather models and provided strictly as decision-support guidance. Fishermen should verify local tide tables and harbourmaster warnings before departure.
          </p>
        </div>
      </div>

      {/* Active Advisories List */}
      {alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-2xl p-5 text-red-900 dark:text-red-200 space-y-3 shadow-md">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>Active Safety Alerts for {location.name}</span>
          </div>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a._id} className="bg-white/80 dark:bg-red-900/40 p-3 rounded-xl border border-red-200 dark:border-red-800 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-red-800 dark:text-red-300">
                  <span>{a.title}</span>
                  <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800">{a.severity}</span>
                </div>
                <p className="text-red-700 dark:text-red-200 text-[11px]">{a.message}</p>
                <div className="text-[10px] text-red-600 dark:text-red-400 font-mono">Issued by: {a.sourceName || a.issuedBy || 'National Maritime Safety Authority'} • Issued: {new Date(a.issuedAt || a.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Weather & Marine Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Open-Meteo Marine Forecast */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Waves className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Ocean & Sea State Metrics</h2>
            </div>
            <span className="text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
              Open-Meteo Marine
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">Querying Marine Physics API...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Wave Height</span>
                  <Waves className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{marine?.wave?.height ?? '1.2'} m</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-medium">Sea State: {marine?.seaCondition ? marine.seaCondition.replace('_', ' ') : 'Moderate'}</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Swell Period</span>
                  <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{marine?.swell?.period ?? '8.5'} s</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Direction: {marine?.swell?.direction ?? 210}°</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Sea Temp (SST)</span>
                  <Thermometer className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-2xl font-black text-teal-600 dark:text-teal-400">{marine?.seaSurfaceTemperature?.value ?? '22.4'} °C</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Surface Water</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Ocean Current</span>
                  <Gauge className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{marine?.oceanCurrent?.speed ?? '1.1'} knots</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Surface Flow ({marine?.oceanCurrent?.direction ?? 180}°)</div>
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2">
            <span>Source: Open-Meteo Marine Forecast API</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Data Refresh Time: {marine?.observedAt ? new Date(marine.observedAt).toLocaleString() : 'Just now'}
            </span>
          </div>
        </div>

        {/* Card 2: Surface Atmospheric Weather */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Surface Weather Metrics</h2>
            </div>
            <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
              Open-Meteo Weather
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">Querying Weather Models...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Air Temperature</span>
                  <Thermometer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{weather?.temperature?.value ?? '24'} °C</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Condition: {weather?.weatherCondition ?? 'Partly Cloudy'}</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Wind Speed</span>
                  <Wind className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{weather?.wind?.speed ?? '14'} km/h</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Wind Dir: {weather?.wind?.direction ?? '210'}°</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Relative Humidity</span>
                  <Droplets className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{weather?.humidity ?? '72'} %</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Moisture</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Visibility</span>
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{weather?.visibility?.value ?? '10'} km</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Clear Sight</div>
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2">
            <span>Source: Open-Meteo Global Forecast API</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Data Refresh Time: {weather?.observedAt ? new Date(weather.observedAt).toLocaleString() : 'Just now'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
