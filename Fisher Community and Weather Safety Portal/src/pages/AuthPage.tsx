import React, { useState } from 'react';
import { LocationItem, User, UserRole } from '../types';
import { api, setCurrentUserHeader, setAuthToken } from '../services/api';
import { Anchor, ShieldAlert, CheckCircle2, AlertCircle, UserCheck, Lock, Building, Fish, ArrowRight, ArrowLeft, Key, Copy, Sparkles, Check } from 'lucide-react';

interface AuthPageProps {
  locations: LocationItem[];
  initialMode?: 'login' | 'register';
  onSuccess: (user: User) => void;
  onNavigateTab: (tab: string) => void;
  onSwitchUser: (userId: string | null) => void;
}

const DEMO_PRESET_ACCOUNTS = [
  {
    id: 'usr-fisher-1',
    role: 'Approved Fisher',
    name: 'Capt. Mateo Silva',
    email: 'mateo.silva@coastalnet.com',
    password: 'password123',
    location: 'Seattle Harbor',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300',
    cardBg: 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80',
    btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    desc: 'Commercial Fisher with verified vessel Mariner III. Active catch listings and purchase requests.',
    icon: Fish
  },
  {
    id: 'usr-buyer-1',
    role: 'Approved Wholesaler',
    name: 'Elena Rostova (Pacific Coast Seafood)',
    email: 'elena@pacificseafood.com',
    password: 'password123',
    location: 'Seattle Harbor',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300',
    cardBg: 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80',
    btnColor: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    desc: 'Verified wholesale seafood buyer. Browse fish catches, send purchase offers, track history.',
    icon: Building
  },
  {
    id: 'usr-admin',
    role: 'Portal Overseer',
    name: 'System Overseer (Admin)',
    email: 'admin@fisherportal.org',
    password: 'password123',
    location: 'Global Authority',
    badgeBg: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300',
    cardBg: 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/80',
    btnColor: 'bg-purple-600 hover:bg-purple-500 text-white',
    desc: 'Full administrative control. Approve fishers & buyers, market benchmarks, safety advisories.',
    icon: ShieldAlert
  },
  {
    id: 'usr-fisher-pending',
    role: 'Pending Fisher',
    name: 'Devon Vance',
    email: 'devon.vance@soundfisheries.io',
    password: 'password123',
    location: 'Seattle Harbor',
    badgeBg: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300',
    cardBg: 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80',
    btnColor: 'bg-amber-600 hover:bg-amber-500 text-white',
    desc: 'Newly registered fisher waiting for Admin approval. Restricted listing controls testing.',
    icon: Fish
  },
  {
    id: 'usr-buyer-pending',
    role: 'Pending Buyer',
    name: 'Klaus Webber (Harbor Imports)',
    email: 'klaus@harborimports.eu',
    password: 'password123',
    location: 'Lisbon Doca',
    badgeBg: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300',
    cardBg: 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800',
    btnColor: 'bg-slate-700 hover:bg-slate-600 text-white',
    desc: 'Pending wholesale buyer profile. Restricted purchase offer submission prior to approval.',
    icon: Building
  }
];

export const AuthPage: React.FC<AuthPageProps> = ({
  locations,
  initialMode = 'login',
  onSuccess,
  onNavigateTab,
  onSwitchUser
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'demo'>(initialMode);
  const [role, setRole] = useState<UserRole>('fisher');

  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Fisher role fields
  const [boatName, setBoatName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [primaryLocationId, setPrimaryLocationId] = useState(locations[0]?._id || '');

  // Buyer role fields
  const [businessName, setBusinessName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; user?: User } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInstantDemoLogin = (userId: string | null) => {
    setErrorMsg('');
    setSuccessInfo({
      title: 'Instant Demo Session Activated',
      message: userId ? 'Loading demo account profile...' : 'Switched to Guest Visitor.'
    });
    onSwitchUser(userId);
  };

  const handleFillCredentials = (emailToFill: string, passToFill: string) => {
    setLoginEmail(emailToFill);
    setLoginPassword(passToFill);
    setMode('login');
    setErrorMsg('');
    setSuccessInfo({
      title: 'Credentials Filled into Login Form',
      message: `Populated ${emailToFill} into the email & password fields below. Click "Sign In" to proceed.`
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfo(null);
    setIsSubmitting(true);

    try {
      const res = await api.login({ email: loginEmail, password: loginPassword });
      setCurrentUserHeader(res.user._id);
      if (res.token) {
        setAuthToken(res.token);
      }
      setSuccessInfo({
        title: 'Authentication Successful',
        message: `Welcome back, ${res.user.fullName}! Redirecting to your dashboard...`,
        user: res.user
      });
      setTimeout(() => {
        onSuccess(res.user);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessInfo(null);
    setIsSubmitting(true);

    try {
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
      setCurrentUserHeader(res.user._id);
      if (res.token) {
        setAuthToken(res.token);
      }

      if (res.user.accountStatus === 'pending') {
        setSuccessInfo({
          title: 'Account Registered (Pending Verification)',
          message: `Your ${role} account has been created successfully! In compliance with fishery governance standards, your account requires administrator verification before creating listings or submitting purchase requests. You have immediate access to public market prices and marine safety alerts.`,
          user: res.user
        });
      } else {
        setSuccessInfo({
          title: 'Registration Complete',
          message: `Welcome to the Fisher Portal, ${res.user.fullName}!`,
          user: res.user
        });
      }

      setTimeout(() => {
        onSuccess(res.user);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please review your input details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="dedicated-auth-page" className="max-w-4xl mx-auto py-8 px-4 space-y-8 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigateTab('landing')}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center space-x-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Overview</span>
        </button>

        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
          Dedicated Account Access Portal
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-maritime-midnight via-maritime-atlantic to-maritime-teal p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-maritime-midnight">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-maritime-ivory border border-white/20 text-xs font-bold">
            <Anchor className="w-3.5 h-3.5" />
            <span>Fisher Community & Wholesale Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {mode === 'login' ? 'Sign In to Fisher Portal' : 'Register New Account'}
          </h1>
          <p className="text-xs sm:text-sm text-maritime-ivory/80 leading-relaxed">
            Access real-time coastal weather advisories, record landed fish catches, compare regional price benchmarks, and connect directly with verified buyers.
          </p>
        </div>

        <div className="absolute right-6 bottom-4 opacity-15 hidden md:block">
          <Anchor className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-slate-900 border border-maritime-beige dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-colors">
        {/* Tab Headers */}
        <div className="flex border-b border-maritime-beige dark:border-slate-800 bg-maritime-ivory dark:bg-slate-950 font-bold text-xs sm:text-sm overflow-x-auto">
          <button
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessInfo(null); }}
            className={`flex-1 py-4 px-4 text-center transition flex items-center justify-center space-x-2 border-b-2 whitespace-nowrap ${
              mode === 'login'
                ? 'border-maritime-teal dark:border-blue-400 text-maritime-teal dark:text-blue-400 bg-white dark:bg-slate-900 font-bold'
                : 'border-transparent text-maritime-midnight/70 dark:text-slate-400 hover:text-maritime-midnight dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessInfo(null); }}
            className={`flex-1 py-4 px-4 text-center transition flex items-center justify-center space-x-2 border-b-2 whitespace-nowrap ${
              mode === 'register'
                ? 'border-maritime-teal dark:border-blue-400 text-maritime-teal dark:text-blue-400 bg-white dark:bg-slate-900 font-bold'
                : 'border-transparent text-maritime-midnight/70 dark:text-slate-400 hover:text-maritime-midnight dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Create Account</span>
          </button>
          <button
            onClick={() => { setMode('demo'); setErrorMsg(''); setSuccessInfo(null); }}
            className={`flex-1 py-4 px-4 text-center transition flex items-center justify-center space-x-2 border-b-2 whitespace-nowrap ${
              mode === 'demo'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 font-bold'
                : 'border-transparent text-amber-700/80 dark:text-amber-400/80 hover:text-amber-800 dark:hover:text-amber-300'
            }`}
          >
            <Key className="w-4 h-4 text-amber-500" />
            <span>Instant Demo Logins</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Notifications / Alerts */}
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 p-4 rounded-2xl text-red-900 dark:text-red-200 text-xs flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Notice: </span>
                {errorMsg}
              </div>
            </div>
          )}

          {successInfo && (
            <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 p-5 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{successInfo.title}</span>
              </div>
              <p className="text-emerald-700 dark:text-emerald-200 leading-relaxed">{successInfo.message}</p>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. carlos@fishermen.org"
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Quick Fill Preset Credentials Buttons */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Auto-Fill Credentials into Form:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Click to insert email & password</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_PRESET_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleFillCredentials(acc.email, acc.password)}
                      className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 text-slate-700 dark:text-slate-200 shadow-sm transition flex items-center space-x-1"
                    >
                      <span className="font-bold text-blue-600 dark:text-blue-400">{acc.role.split(' ')[0]}</span>
                      <span>({acc.name.split(' ')[0]})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Don't have an account? Register here
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition flex items-center space-x-2"
                >
                  <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Demo Quick Logins Footer */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Quick Demo One-Click Sign In:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode('demo')}
                    className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    View All Demo Credentials →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInstantDemoLogin('usr-fisher-1')}
                    className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-left transition"
                  >
                    <div className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">Capt. Mateo</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">mateo.silva@coastalnet.com</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstantDemoLogin('usr-buyer-1')}
                    className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-left transition"
                  >
                    <div className="font-bold text-indigo-800 dark:text-indigo-300 text-xs">Pacific Seafoods</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">elena@pacificseafood.com</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstantDemoLogin('usr-admin')}
                    className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-left transition"
                  >
                    <div className="font-bold text-purple-800 dark:text-purple-300 text-xs">Admin Overseer</div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">admin@fisherportal.org</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MODE 2: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-6 text-xs">
              {/* Role Selection */}
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-2 text-xs">
                  1. Select Account Governance Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setRole('fisher')}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      role === 'fisher'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Fish className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-slate-900 dark:text-white text-sm">Fisher (Seller)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      List landed catches, set asking price per kg, log catch records, and review buyer purchase requests.
                    </p>
                  </div>

                  <div
                    onClick={() => setRole('buyer')}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      role === 'buyer'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-slate-900 dark:text-white text-sm">Wholesaler / Buyer</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      Browse fresh landed catches, submit direct purchase requests, and monitor fish market price benchmarks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs">
                  2. Personal & Contact Information
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Capt. Carlos Mendoza"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 outline-none"
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
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555-0192"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                      Assigned Working Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={primaryLocationId}
                      onChange={(e) => setPrimaryLocationId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 outline-none"
                    >
                      {locations.map(l => (
                        <option key={l._id} value={l._id}>{l.name} ({l.country})</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Each user can only have one working location and perform actions in their location only.
                    </span>
                  </div>
                </div>
              </div>

              {/* Role Specific Details */}
              {role === 'fisher' && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase block">
                    3. Fisher Vessel & License Verification
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 block mb-1">Vessel Name</label>
                      <input
                        type="text"
                        value={boatName}
                        onChange={(e) => setBoatName(e.target.value)}
                        placeholder="e.g. Sea Voyager II"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-slate-400 block mb-1">Registration / License #</label>
                      <input
                        type="text"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="FL-94021-US"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {role === 'buyer' && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase block">
                    3. Wholesale Buyer Business Verification
                  </span>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block mb-1">Company / Organization Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Pacific Coast Wholesale Seafood Ltd."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Already have an account? Sign in
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition flex items-center space-x-2"
                >
                  <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: INSTANT DEMO LOGINS */}
          {mode === 'demo' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  <span>Preset Demo User Accounts & Credentials</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Here is the full list of preset user emails and passwords. Click <strong>"Fill Form Credentials"</strong> to insert them into the sign-in inputs, or click <strong>"Instant 1-Click Sign In"</strong> to jump straight in.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_PRESET_ACCOUNTS.map((acc) => {
                  const IconComp = acc.icon;
                  return (
                    <div
                      key={acc.id}
                      className={`${acc.cardBg} border rounded-2xl p-5 transition shadow-sm hover:shadow-md flex flex-col justify-between space-y-4`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full ${acc.badgeBg} font-bold text-[10px] uppercase`}>
                            <IconComp className="w-3 h-3" />
                            <span>{acc.role}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-semibold">{acc.location}</span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {acc.name}
                          </h4>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 leading-relaxed">
                            {acc.desc}
                          </p>
                        </div>

                        {/* Credentials Block */}
                        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1.5 text-[11px] font-mono">
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                            <span className="font-sans font-semibold text-[10px]">Email:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 select-all">{acc.email}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-1">
                            <span className="font-sans font-semibold text-[10px]">Password:</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 select-all">{acc.password}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleFillCredentials(acc.email, acc.password)}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span>Fill Form</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInstantDemoLogin(acc.id)}
                          className={`px-3 py-2 rounded-xl ${acc.btnColor} font-bold text-[11px] transition flex items-center justify-center space-x-1.5 shadow-sm`}
                        >
                          <span>1-Click Login</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Guest Visitor */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition shadow-sm hover:shadow-md flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold text-[10px] uppercase">
                        <Anchor className="w-3 h-3" />
                        <span>Public Visitor</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-semibold">Unauthenticated</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Guest Visitor (Sign Out)
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                        Evaluate portal public features without an active session: weather forecasts, marine waves, market prices, and public catch listings.
                      </p>
                    </div>

                    <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span>No authentication credentials required.</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleInstantDemoLogin(null)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <span>Continue as Guest</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
