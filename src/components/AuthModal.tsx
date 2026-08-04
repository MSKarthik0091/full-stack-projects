import React, { useState, useEffect } from "react";
import { Building2, UserPlus, LogIn, CheckCircle2, Shield, UserCheck, AlertCircle, Key, X, Check, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Property } from "../types";

interface AuthModalProps {
  onLoginSuccess: (token: string, user: any) => void;
  properties: Property[];
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess, properties }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register Form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"Tenant" | "Owner" | "Staff">("Tenant");
  const [regDob, setRegDob] = useState<string>("");
  const [regGender, setRegGender] = useState("Male");
  const [regPropertyId, setRegPropertyId] = useState("");
  const [regPropertiesCount, setRegPropertiesCount] = useState<number>(1);
  const [regLivesInside, setRegLivesInside] = useState(true);

  // Login Info / Credentials State
  const [showLoginInfo, setShowLoginInfo] = useState(false);
  const [credentials, setCredentials] = useState<Array<{ id: string; name: string; email: string; role: string; password?: string; status: string }>>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const fetchCredentials = async () => {
    setLoadingCredentials(true);
    try {
      const res = await fetch("/api/public/login-credentials");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setCredentials(data.users);
        }
      }
    } catch (e) {
      console.error("Failed to fetch user login info:", e);
    } finally {
      setLoadingCredentials(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  // Demo accounts helper
  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPass })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!regDob) {
        throw new Error("Date of Birth is mandatory.");
      }
      if (!regGender) {
        throw new Error("Gender is mandatory.");
      }

      const payload: any = {
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        dateOfBirth: regDob,
        gender: regGender
      };

      if (regRole === "Tenant") {
        if (!regPropertyId) {
          throw new Error("Desired property is required for tenant registration.");
        }
        payload.propertyId = regPropertyId;
      } else if (regRole === "Owner") {
        if (!regPropertyId) {
          throw new Error("Property to claim ownership is required for owner registration.");
        }
        payload.propertyId = regPropertyId;
        payload.propertyIds = [regPropertyId];
        payload.propertiesCount = regPropertiesCount;
        payload.livesInside = regLivesInside;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setSuccessMsg("Registration submitted! Pending Admin and Owner approval. You can login once approved.");
      setIsRegistering(false);
      setEmail(regEmail);
      setPassword("");
      fetchCredentials();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="max-w-lg w-full bg-surface rounded-md shadow-xl border border-main p-5 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white shadow-md mb-2">
            <Building2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-extrabold text-main">Astral Hills</h2>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">
            Property Rental, Maintenance & Amenity Management
          </p>
        </div>

        {/* Demo Quick Logins */}
        <div className="bg-base p-3.5 rounded-2xl border border-main/60 space-y-2">
          <p className="text-xs font-bold text-black text-center uppercase tracking-wide">
            Instant Demo Logins
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin("admin@complex.com", "admin123")}
              className="px-2.5 py-1.5 bg-surface text-main border border-main rounded-xl font-bold hover:bg-highlight/40 transition-colors shadow-2xs flex items-center justify-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" /> Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("robert@owner.com", "owner123")}
              className="px-2.5 py-1.5 bg-surface text-main border border-main rounded-xl font-bold hover:bg-highlight/40 transition-colors shadow-2xs flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-primary" /> Owner (Robert)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("elena@owner.com", "owner123")}
              className="px-2.5 py-1.5 bg-surface text-main border border-main rounded-xl font-bold hover:bg-highlight/40 transition-colors shadow-2xs flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-primary" /> Owner (Elena)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("jane@example.com", "jane123")}
              className="px-2.5 py-1.5 bg-surface text-main border border-main rounded-xl font-bold hover:bg-highlight/40 transition-colors shadow-2xs flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-primary" /> Owner (Jane)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("kyle.simmons@example.com", "tenant123")}
              className="px-2.5 py-1.5 bg-surface text-main border border-main rounded-xl font-bold hover:bg-highlight/40 transition-colors shadow-2xs flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" /> Tenant (Kyle)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("becca@example.com", "becca123")}
              className="px-2.5 py-1.5 bg-surface text-main border border-main rounded-xl font-bold hover:bg-highlight/40 transition-colors shadow-2xs flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" /> Tenant (Rebecca)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("david@staff.com", "staff123")}
              className="px-2.5 py-1.5 bg-surface text-main border border-main rounded-xl font-bold hover:bg-highlight/40 transition-colors shadow-2xs flex items-center justify-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5 text-[#1565C0]" /> Staff (David)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("bella@example.com", "bella123")}
              className="px-2.5 py-1.5 bg-surface text-main border border-main rounded-xl font-bold hover:bg-highlight/40 transition-colors shadow-2xs flex items-center justify-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5 text-[#1565C0]" /> Staff (Isabella)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {!isRegistering ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-main mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-main bg-base text-sm text-main focus:ring-2 focus:ring-[#A0522D] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-main bg-base text-sm text-main focus:ring-2 focus:ring-[#A0522D] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-90 transition-colors shadow-md flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? "Signing in..." : "Sign In"}</span>
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-black font-medium">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setError(null);
                  }}
                  className="font-bold text-primary hover:underline"
                >
                  Register Now
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-main mb-1">Full Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main focus:ring-2 focus:ring-[#A0522D] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-main mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main focus:ring-2 focus:ring-[#A0522D] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-main mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main focus:ring-2 focus:ring-[#A0522D] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-main mb-1">Role</label>
                <select
                  value={regRole}
                  onChange={(e: any) => setRegRole(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-main bg-base text-xs font-bold text-main"
                >
                  <option value="Tenant">Tenant</option>
                  <option value="Owner">Owner</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">Gender</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-main bg-base text-xs text-main"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {regRole === "Tenant" && (
              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Desired Property <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={regPropertyId}
                  onChange={(e) => setRegPropertyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                >
                  <option value="">Select a property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  * Select your desired residence unit. Approval requires an assigned owner.
                </p>
              </div>
            )}

            {regRole === "Owner" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-main mb-1">
                    Select Property/Properties Owned <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={regPropertyId}
                    onChange={(e) => setRegPropertyId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                  >
                    <option value="">Select property to claim ownership...</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="livesInside"
                    checked={regLivesInside}
                    onChange={(e) => setRegLivesInside(e.target.checked)}
                    className="rounded border-main text-primary"
                  />
                  <label htmlFor="livesInside" className="text-xs font-semibold text-main">
                    Currently residing inside the apartment complex
                  </label>
                </div>

                {regLivesInside && (
                  <div>
                    <label className="block text-xs font-bold text-main mb-1">Residence Unit</label>
                    <select
                      value={regPropertyId}
                      onChange={(e) => setRegPropertyId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                    >
                      <option value="">Select residence unit...</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-90 transition-colors shadow-md"
            >
              {loading ? "Submitting Request..." : "Submit Registration Request"}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-black font-medium">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError(null);
                  }}
                  className="font-bold text-primary hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Floating Bottom-Right Login Info Widget */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 max-w-[95vw] sm:max-w-md md:max-w-lg">
        {showLoginInfo && (
          <div className="bg-surface border border-main rounded-2xl shadow-2xl p-4 w-full text-xs text-main animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-main/40 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-main">Login Info for Users</h3>
                  <p className="text-[10px] text-gray-600 font-medium">All registered member emails & passwords for manual login testing</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={fetchCredentials}
                  disabled={loadingCredentials}
                  title="Refresh User List"
                  className="p-1 hover:bg-base rounded-lg text-main transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCredentials ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginInfo(false)}
                  className="p-1 hover:bg-base rounded-lg text-main transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto pr-1 space-y-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-main/30 text-[10px] uppercase font-extrabold text-gray-500 bg-base/50">
                    <th className="py-1.5 px-2">Member</th>
                    <th className="py-1.5 px-2">Role</th>
                    <th className="py-1.5 px-2">Email</th>
                    <th className="py-1.5 px-2">Password</th>
                    <th className="py-1.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-main/20">
                  {credentials.map((user, idx) => (
                    <tr key={user.id || idx} className="hover:bg-base/40 transition-colors">
                      <td className="py-1.5 px-2 font-semibold text-main whitespace-nowrap">{user.name}</td>
                      <td className="py-1.5 px-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'Owner' ? 'bg-amber-100 text-amber-800' :
                          user.role === 'Staff' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 font-mono text-[11px] text-gray-700 select-all">{user.email}</td>
                      <td className="py-1.5 px-2 font-mono text-[11px] text-gray-800">
                        <div className="flex items-center gap-1">
                          <span>{showPasswords[user.id] ? user.password : "••••••••"}</span>
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                            className="text-gray-400 hover:text-gray-700 p-0.5"
                          >
                            {showPasswords[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(user.email);
                            setPassword(user.password || "");
                            setIsRegistering(false);
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 1800);
                          }}
                          className="px-2 py-0.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-md font-bold text-[10px] transition-colors inline-flex items-center gap-1"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3" /> Filled!
                            </>
                          ) : (
                            "Fill Login"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-gray-500 mt-2.5 pt-2 border-t border-main/20 text-center font-medium">
              💡 Click <span className="font-bold text-primary">"Fill Login"</span> to auto-fill the login form for manual testing.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (!showLoginInfo) fetchCredentials();
            setShowLoginInfo(!showLoginInfo);
          }}
          className="bg-main text-white px-3.5 py-2 rounded-full shadow-xl border border-main font-bold text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <Key className="w-3.5 h-3.5 text-amber-300" />
          <span>Login Info for Users</span>
          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
            {credentials.length || "8"}
          </span>
        </button>
      </div>
    </div>
  );
};
