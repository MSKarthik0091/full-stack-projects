import React, { useState, useEffect } from 'react';
import { User, Persona } from '../types.ts';
import { api } from '../api.ts';
import { ProfilePhotoSelector } from './ProfilePhotoSelector.tsx';
import { 
  TreePine, 
  Lock, 
  User as UserIcon, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  LogIn,
  UserPlus
} from 'lucide-react';

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'user-arun-admin',
    name: 'Arun Kumar',
    username: 'arunkumar',
    easyPassword: 'arun123',
    password: 'arun123',
    roleBadge: 'Co-Admin',
    roleDescription: 'Besant Nagar Co-Admin'
  },
  {
    id: 'user-platform-admin',
    name: 'Platform Admin',
    username: 'admin',
    easyPassword: 'admin123',
    password: 'admin123',
    roleBadge: 'Platform Admin',
    roleDescription: 'Global Administrator'
  },
  {
    id: 'user-priya-admin',
    name: 'Priya Sundaram',
    username: 'priya_s',
    easyPassword: 'priya123',
    password: 'priya123',
    roleBadge: 'Co-Admin',
    roleDescription: 'Besant Nagar Co-Admin'
  },
  {
    id: 'user-karthik-mod',
    name: 'Karthik Raman',
    username: 'karthik_r',
    easyPassword: 'karthik123',
    password: 'karthik123',
    roleBadge: 'Moderator',
    roleDescription: 'Community Moderator'
  },
  {
    id: 'user-deepa-resident',
    name: 'Deepa Venkat',
    username: 'deepa_v',
    easyPassword: 'deepa123',
    password: 'deepa123',
    roleBadge: 'Resident',
    roleDescription: 'Verified Resident'
  },
  {
    id: 'user-suresh-resident',
    name: 'Suresh Raina',
    username: 'suresh_r',
    easyPassword: 'suresh123',
    password: 'suresh123',
    roleBadge: 'Member',
    roleDescription: 'New Community Member'
  },
  {
    id: 'user-vikram-resident',
    name: 'Vikram Seth',
    username: 'vikram_s',
    easyPassword: 'vikram123',
    password: 'vikram123',
    roleBadge: 'Volunteer',
    roleDescription: 'Civic Volunteer'
  }
];

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'personas' | 'register'>('login');
  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [filledFeedback, setFilledFeedback] = useState<string | null>(null);

  // Login form state
  const [identifier, setIdentifier] = useState('arunkumar');
  const [password, setPassword] = useState('arun123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regHometown, setRegHometown] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regProfilePhoto, setRegProfilePhoto] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Load available personas for demo selection
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoadingPersonas(true);
      const res = await api.getPersonas();
      if (res && res.personas) {
        setPersonas(res.personas);
      }
    } catch (err) {
      console.error('Failed to load personas', err);
    } finally {
      setLoadingPersonas(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setLoginError('Please enter your username or email address.');
      return;
    }

    try {
      setLoginLoading(true);
      setLoginError('');
      const res = await api.login({
        identifier: identifier.trim(),
        password: password.trim()
      });
      if (res && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickPersonaSelect = async (persona: Persona) => {
    try {
      setLoginLoading(true);
      setLoginError('');
      const res = await api.login({
        identifier: persona.username || persona.id,
        password: persona.password || persona.easyPassword || 'password123'
      });
      if (res && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      // Fallback to switchUser if direct password match encounters custom state
      try {
        const switchRes = await api.switchUser(persona.id);
        if (switchRes && switchRes.user) {
          onLoginSuccess(switchRes.user);
        }
      } catch (switchErr: any) {
        setLoginError(switchErr.message || 'Failed to sign in as ' + persona.name);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFillCredentials = (username: string, pass: string, name?: string) => {
    setIdentifier(username);
    setPassword(pass);
    setActiveTab('login');
    setLoginError('');
    setFilledFeedback(`✓ Auto-filled credentials for ${name || username}`);
    setTimeout(() => {
      setFilledFeedback(null);
    }, 4000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName.trim() || !regLastName.trim() || !regUsername.trim() || !regEmail.trim()) {
      setRegError('First name, last name, username, and email are required.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setRegError('Please provide a password with at least 4 characters.');
      return;
    }

    try {
      setRegLoading(true);
      setRegError('');
      const res = await api.register({
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword.trim(),
        hometown: regHometown.trim(),
        phoneNumber: regPhone.trim(),
        bio: regBio.trim(),
        profilePhoto: regProfilePhoto.trim()
      });
      if (res && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1F2D24] flex flex-col font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* Top Banner & Brand Header */}
      <header className="bg-[#183120] text-[#FAF8F3] border-b border-[#2A7B5F]/40 py-4 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A7B5F] flex items-center justify-center text-[#E8A227] shadow-inner border border-[#E8A227]/30">
              <TreePine className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5 text-white">
                HOMETOWN <span className="text-[#E8A227] font-normal">HUB</span>
              </h1>
              <p className="text-[11px] text-[#FAF8F3]/80 font-medium">
                Locality-Verified Hyperlocal Community Network
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#FAF8F3] bg-[#2A7B5F]/40 px-3.5 py-1.5 rounded-full border border-[#2A7B5F] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#E8A227]" />
            <span>Dual-Admin Governance & Verified Neighborhoods</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Welcome & Persona Quick Selector */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#EAF2ED] text-[#1D2A24] p-6 sm:p-8 rounded-3xl shadow-md border-2 border-[#2A7B5F]/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8A227]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#C85A32]/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#183120] text-[#E8A227] shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#E8A227]" />
                  <span>Welcome to Hometown Hub</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-[#183120]">
                  Rediscover your neighborhood.
                </h2>
                <p className="text-sm text-[#1D2A24]/80 leading-relaxed font-medium">
                  Join verified locality communities, participate in civic initiatives, propose local events, and collaborate directly with neighbors.
                </p>

                <div className="pt-4 border-t border-[#2A7B5F]/20 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-[#1D2A24]/90 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" />
                    <span><strong>100% Boundary-Verified</strong>: Local communities protected by resident admins.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[#1D2A24]/90 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#2A7B5F] shrink-0 mt-0.5" />
                    <span><strong>Dual-Admin Safeguards</strong>: Robust democracy with orphan recovery protocols.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[#1D2A24]/90 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#E8A227] shrink-0 mt-0.5" />
                    <span><strong>Full MongoDB Persistence</strong>: All events, posts, and roles sync securely.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo Credentials Cheat Sheet Card for ALL Existing Users */}
            <div className="bg-[#FAF8F3] p-5 rounded-2xl border border-[#2A7B5F]/20 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#C85A32] flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#E8A227]" />
                  <span>Demo Easy Passwords</span>
                </h3>
                <span className="text-[11px] bg-[#E8A227] text-[#183120] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs border border-[#183120]/20">
                  {personas.length} Available Users
                </span>
              </div>
              
              <p className="text-[11px] text-[#1D2A24]/70 font-medium">
                Click any user below to auto-fill their username & password into the login form:
              </p>

              {filledFeedback && (
                <div className="p-2.5 bg-[#EAF2ED] border border-[#2A7B5F]/40 rounded-xl text-[11px] font-bold text-[#2A7B5F] flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7B5F]" />
                  <span>{filledFeedback}</span>
                </div>
              )}

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {personas.map((persona) => {
                  const easyPass = persona.password || persona.easyPassword || `${persona.username}123`;
                  const isSelected = identifier === persona.username;
                  return (
                    <div
                      key={persona.id}
                      onClick={() => handleFillCredentials(persona.username, easyPass, persona.name)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer text-left flex items-center justify-between gap-2.5 group ${
                        isSelected 
                          ? 'bg-[#EAF2ED] border-[#C85A32] shadow-sm' 
                          : 'bg-white hover:bg-[#EAF2ED] border-[#2A7B5F]/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#183120] group-hover:text-[#C85A32] transition">
                            {persona.name}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider shadow-2xs ${
                            persona.roleBadge?.includes('Platform')
                              ? 'bg-[#E8A227] text-[#183120] border border-[#183120]/30'
                              : persona.roleBadge?.includes('Admin')
                              ? 'bg-[#183120] text-white'
                              : persona.roleBadge?.includes('Moderator')
                              ? 'bg-[#C85A32] text-white'
                              : 'bg-[#2A7B5F] text-white'
                          }`}>
                            {persona.roleBadge}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#1D2A24]/60 font-mono mt-0.5">
                          <span>user: <strong className="text-[#183120]">{persona.username}</strong></span>
                          <span>•</span>
                          <span>pass: <strong className="text-[#C85A32] font-bold">{easyPass}</strong></span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFillCredentials(persona.username, easyPass, persona.name);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[#C85A32]/10 hover:bg-[#C85A32] text-[#C85A32] hover:text-white transition shrink-0 border border-[#C85A32]/20"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Auth Tabs (Login, Persona Switcher, Register) */}
          <div className="lg:col-span-7 bg-[#FAF8F3] rounded-3xl border border-[#2A7B5F]/25 shadow-xl overflow-hidden">
            
            {/* Top Navigation Tabs */}
            <div className="flex border-b border-[#2A7B5F]/20 bg-[#EAF2ED]">
              <button
                id="auth-tab-login"
                type="button"
                onClick={() => { setActiveTab('login'); setLoginError(''); }}
                className={`flex-1 py-4 px-4 text-center font-bold text-sm flex items-center justify-center gap-2 transition border-b-2 ${
                  activeTab === 'login'
                    ? 'border-[#C85A32] text-[#C85A32] bg-[#FAF8F3]'
                    : 'border-transparent text-[#1D2A24]/60 hover:text-[#183120] hover:bg-[#FAF8F3]/60'
                }`}
              >
                <LogIn className="w-4 h-4 text-[#C85A32]" />
                <span>Log In</span>
              </button>

              <button
                id="auth-tab-personas"
                type="button"
                onClick={() => { setActiveTab('personas'); setLoginError(''); }}
                className={`flex-1 py-4 px-4 text-center font-bold text-sm flex items-center justify-center gap-2 transition border-b-2 ${
                  activeTab === 'personas'
                    ? 'border-[#E8A227] text-[#183120] bg-[#FAF8F3]'
                    : 'border-transparent text-[#1D2A24]/60 hover:text-[#183120] hover:bg-[#FAF8F3]/60'
                }`}
              >
                <Users className="w-4 h-4 text-[#E8A227]" />
                <span>Demo Personas</span>
                <span className="hidden sm:inline-block bg-[#E8A227] text-[#183120] text-[10px] px-2 py-0.5 rounded-full font-extrabold shadow-2xs">
                  7 Roles
                </span>
              </button>

              <button
                id="auth-tab-register"
                type="button"
                onClick={() => { setActiveTab('register'); setRegError(''); }}
                className={`flex-1 py-4 px-4 text-center font-bold text-sm flex items-center justify-center gap-2 transition border-b-2 ${
                  activeTab === 'register'
                    ? 'border-[#2A7B5F] text-[#2A7B5F] bg-[#FAF8F3]'
                    : 'border-transparent text-[#1D2A24]/60 hover:text-[#183120] hover:bg-[#FAF8F3]/60'
                }`}
              >
                <UserPlus className="w-4 h-4 text-[#2A7B5F]" />
                <span>Register</span>
              </button>
            </div>

            {/* Tab 1: Standard Login Form */}
            {activeTab === 'login' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-[#183120]">Sign In to Your Account</h3>
                  <p className="text-xs text-[#1D2A24]/70 font-medium">
                    Enter your username or email address and password to access your community.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#183120] mb-1.5">
                      Username or Email
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1D2A24]/40" />
                      <input
                        id="login-identifier-input"
                        type="text"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        placeholder="e.g. arunkumar or admin@hometownhub.local"
                        required
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#2A7B5F]/30 rounded-xl focus:outline-none focus:border-[#C85A32] text-[#1D2A24] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#183120]">
                        Password
                      </label>
                      <span className="text-[11px] text-[#2A7B5F] font-semibold">
                        Default pass: <code className="bg-[#EAF2ED] px-1.5 py-0.5 rounded font-mono text-[#C85A32] font-bold">arun123</code>
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1D2A24]/40" />
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#2A7B5F]/30 rounded-xl focus:outline-none focus:border-[#C85A32] text-[#1D2A24] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1D2A24]/40 hover:text-[#183120]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit-login-btn"
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 px-4 bg-[#C85A32] hover:bg-[#b34c28] disabled:opacity-60 text-white font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-2 cursor-pointer border border-[#E8A227]/40"
                  >
                    {loginLoading ? (
                      <span>Verifying & Signing In...</span>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-4 border-t border-[#2A7B5F]/15 flex items-center justify-between text-xs text-[#1D2A24]/70 font-medium">
                  <span>Want to test without typing?</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('personas')}
                    className="text-[#C85A32] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Use 1-Click Persona Switcher</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Persona Quick Switcher */}
            {activeTab === 'personas' && (
              <div className="p-6 sm:p-8 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-[#183120] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#E8A227]" />
                    <span>Select a Demo Persona</span>
                  </h3>
                  <p className="text-xs text-[#1D2A24]/70 font-medium">
                    Switch between roles outside the app to test Platform Admin, Community Co-Admin, Moderator, and Member workflows.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {loadingPersonas ? (
                  <div className="py-12 text-center text-xs text-[#1D2A24]/60">
                    Loading demo personas...
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {personas.map(persona => {
                      const easyPass = persona.password || persona.easyPassword || `${persona.username}123`;
                      return (
                        <div
                          key={persona.id}
                          className="p-3.5 rounded-2xl border border-[#2A7B5F]/20 bg-white hover:bg-[#EAF2ED] transition flex items-center justify-between gap-3 group shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {persona.user?.profilePhoto ? (
                              <img
                                src={persona.user.profilePhoto}
                                alt={persona.name}
                                className="w-11 h-11 rounded-full object-cover border-2 border-[#2A7B5F]/30 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-[#183120] text-[#E8A227] flex items-center justify-center font-extrabold text-sm shrink-0 border border-[#E8A227]/30">
                                {persona.name[0]}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-sm text-[#183120] truncate">
                                  {persona.name}
                                </h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider shadow-2xs ${
                                  persona.roleBadge?.includes('Platform')
                                    ? 'bg-[#E8A227] text-[#183120] border border-[#183120]/30'
                                    : persona.roleBadge?.includes('Admin')
                                    ? 'bg-[#183120] text-white'
                                    : persona.roleBadge?.includes('Moderator')
                                    ? 'bg-[#C85A32] text-white'
                                    : 'bg-[#2A7B5F] text-white'
                                }`}>
                                  {persona.roleBadge}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#1D2A24]/70 font-medium line-clamp-1 mt-0.5">
                                {persona.roleDescription}
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-[#1D2A24]/60 font-mono mt-1">
                                <span>user: <strong className="text-[#183120]">{persona.username}</strong></span>
                                <span>pass: <strong className="text-[#C85A32] font-bold">{easyPass}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleQuickPersonaSelect(persona)}
                              disabled={loginLoading}
                              className="px-3.5 py-2 rounded-xl bg-[#2A7B5F] text-white hover:bg-[#183120] font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer border border-[#E8A227]/30"
                            >
                              <span>Enter as {persona.name.split(' ')[0]}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Registration Form */}
            {activeTab === 'register' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-[#183120]">Create a New Resident Account</h3>
                  <p className="text-xs text-[#1D2A24]/70 font-medium">
                    Register with your name, local neighborhood, and easy password to join discussions.
                  </p>
                </div>

                {regError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#183120] mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={regFirstName}
                        onChange={e => setRegFirstName(e.target.value)}
                        placeholder="e.g. Ramesh"
                        required
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#2A7B5F]/30 rounded-xl focus:outline-none focus:border-[#2A7B5F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#183120] mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={regLastName}
                        onChange={e => setRegLastName(e.target.value)}
                        placeholder="e.g. Nathan"
                        required
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#2A7B5F]/30 rounded-xl focus:outline-none focus:border-[#2A7B5F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#183120] mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={e => setRegUsername(e.target.value)}
                        placeholder="e.g. ramesh_n"
                        required
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#2A7B5F]/30 rounded-xl focus:outline-none focus:border-[#2A7B5F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#183120] mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="ramesh@example.com"
                        required
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#2A7B5F]/30 rounded-xl focus:outline-none focus:border-[#2A7B5F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#183120] mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#2A7B5F]/30 rounded-xl focus:outline-none focus:border-[#2A7B5F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#183120] mb-1">
                        Home Locality / City
                      </label>
                      <input
                        type="text"
                        value={regHometown}
                        onChange={e => setRegHometown(e.target.value)}
                        placeholder="e.g. Besant Nagar, Chennai"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#2A7B5F]/30 rounded-xl focus:outline-none focus:border-[#2A7B5F]"
                      />
                    </div>
                  </div>

                  <ProfilePhotoSelector
                    value={regProfilePhoto}
                    onChange={setRegProfilePhoto}
                    label="Profile Picture (File Upload or Image URL)"
                  />

                  <div>
                    <label className="block text-xs font-bold text-[#183120] mb-1">
                      Short Bio
                    </label>
                    <textarea
                      value={regBio}
                      onChange={e => setRegBio(e.target.value)}
                      placeholder="Tell neighbors a little about your local interests..."
                      rows={2}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#2A7B5F]/30 rounded-xl focus:outline-none focus:border-[#2A7B5F] resize-none"
                    />
                  </div>

                  <button
                    id="submit-register-btn"
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 px-4 bg-[#2A7B5F] hover:bg-[#183120] disabled:opacity-60 text-white font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer border border-[#E8A227]/30"
                  >
                    {regLoading ? 'Creating Your Account...' : 'Complete Registration & Enter'}
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#1D2A24]/60 border-t border-[#2A7B5F]/15 font-medium">
        Hometown Hub © 2026 • Real Locality Democracy • Full MongoDB Architecture
      </footer>
    </div>
  );
}
