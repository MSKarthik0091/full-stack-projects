import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertCircle, Anchor, UserCheck, Lock } from 'lucide-react';
import { LocationItem, UserRole } from '../types';
import { api, setCurrentUserHeader } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  locations: LocationItem[];
  onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  locations,
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('fisher');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Fisher role fields
  const [fishingType, setFishingType] = useState<'small_scale' | 'commercial' | 'traditional'>('small_scale');
  const [fishingExperienceYears, setFishingExperienceYears] = useState(5);
  const [boatName, setBoatName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [boatCapacityKg, setBoatCapacityKg] = useState(1000);
  const [primaryLocationId, setPrimaryLocationId] = useState(locations[0]?._id || '');

  // Buyer role fields
  const [buyerType, setBuyerType] = useState<'wholesaler' | 'retailer' | 'restaurant' | 'seafood_market' | 'processor' | 'other'>('wholesaler');
  const [businessName, setBusinessName] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; user?: any } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfo(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        const payload = {
          fullName,
          email,
          phone,
          password,
          role,
          primaryLocationId: primaryLocationId || locations[0]?._id,
          vesselName: role === 'fisher' ? boatName : undefined,
          licenseNumber: role === 'fisher' ? registrationNumber : undefined,
          organizationName: role === 'buyer' ? businessName : undefined
        };

        const res = await api.register(payload);

        if (res.user.accountStatus === 'pending') {
          setSuccessInfo({
            title: 'Registration Received (Pending Approval)',
            message: `Your ${role} account has been registered successfully! To protect fishery integrity, your account requires administrative approval before creating catch listings or purchase requests. You can monitor prices and weather immediately.`,
            user: res.user
          });
        } else {
          setSuccessInfo({
            title: 'Registration Complete',
            message: `Your account has been activated! Welcome to the portal.`,
            user: res.user
          });
        }

        setCurrentUserHeader(res.user._id);
        setTimeout(() => {
          onSuccess(res.user);
          onClose();
        }, 2200);
      } else {
        const res = await api.login({ email, password });
        setCurrentUserHeader(res.user._id);
        setSuccessInfo({
          title: 'Login Successful',
          message: `Welcome back, ${res.user.fullName}!`,
          user: res.user
        });
        setTimeout(() => {
          onSuccess(res.user);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Anchor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              {mode === 'register' ? 'Portal Account Registration' : 'Account Sign In'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessInfo(null); }}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'register' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Register Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessInfo(null); }}
            className={`flex-1 py-2 rounded-lg transition ${
              mode === 'login' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Existing Sign In
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 p-3.5 rounded-xl text-red-900 dark:text-red-200 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Error: </span>
              {errorMsg}
            </div>
          </div>
        )}

        {successInfo && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 p-4 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
            <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{successInfo.title}</span>
            </div>
            <p className="text-emerald-700 dark:text-emerald-200">{successInfo.message}</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div className="space-y-3">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Select Account Governance Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('fisher')}
                    className={`p-3 rounded-xl border text-left transition ${
                      role === 'fisher'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-slate-900 dark:text-white font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs">Fisher (Seller)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal">Lists landed catch, sets price per kg</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`p-3 rounded-xl border text-left transition ${
                      role === 'buyer'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-slate-900 dark:text-white font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs">Wholesaler / Buyer</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal">Requests catch purchases directly</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Capt. Carlos Mendoza"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@fishermen.org"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0192"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Assigned Working Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={primaryLocationId}
                    onChange={(e) => setPrimaryLocationId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                  >
                    {locations.map(l => (
                      <option key={l._id} value={l._id}>{l.name} ({l.country})</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Users operate strictly within their single assigned working location.
                  </span>
                </div>
              </div>

              {role === 'fisher' && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase">Fisher License & Vessel Verification</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 block mb-1">Vessel Name</label>
                      <input
                        type="text"
                        value={boatName}
                        onChange={(e) => setBoatName(e.target.value)}
                        placeholder="e.g. Sea Voyager"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 block mb-1">Registration / License #</label>
                      <input
                        type="text"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="FL-94021"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {role === 'buyer' && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase">Wholesale Buyer Verification</div>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block mb-1">Company / Organization Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Pacific Coast Seafoods Wholesale"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-3">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fisher@sea.org"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow"
            >
              {isSubmitting ? 'Processing...' : mode === 'register' ? 'Submit Registration' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
