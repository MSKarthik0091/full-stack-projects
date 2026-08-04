import React, { useState } from "react";
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, X } from "lucide-react";
import { User } from "../types";

interface ProfileModalProps {
  user: User;
  token: string;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, token, onClose }) => {
  const [activeTab, setActiveTab] = useState<"account" | "management">("account");

  // Account Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Management Security Key state
  const [adminPassword, setAdminPassword] = useState("");
  const [currentSecurityKey, setCurrentSecurityKey] = useState("");
  const [newSecurityKey, setNewSecurityKey] = useState("");
  const [confirmSecurityKey, setConfirmSecurityKey] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Password change failed");

      setSuccess("Account password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeManagementKey = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (newSecurityKey !== confirmSecurityKey) {
      setError("New key and confirm key do not match.");
      return;
    }

    if (newSecurityKey.length < 6) {
      setError("New security key must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/change-management-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminPassword, currentSecurityKey, newSecurityKey })
      });

      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Failed to update Management Security Key");

      setSuccess("Management Security Key updated successfully!");
      setAdminPassword("");
      setCurrentSecurityKey("");
      setNewSecurityKey("");
      setConfirmSecurityKey("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full border border-main shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-main">
          <h3 className="font-extrabold text-main text-lg flex items-center gap-2">
            {activeTab === "account" ? (
              <KeyRound className="w-5 h-5 text-primary" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-primary" />
            )}
            {activeTab === "account" ? "Security Settings" : "Management Security Key"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {user.role === "Admin" && (
          <div className="flex gap-2 p-1 bg-[#F4EBE1] rounded-2xl border border-main">
            <button
              type="button"
              onClick={() => {
                setActiveTab("account");
                resetMessages();
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "account"
                  ? "bg-surface text-main shadow-xs border border-main"
                  : "text-[#8B5A2B] hover:text-main"
              }`}
            >
              Account Password
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("management");
                resetMessages();
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === "management"
                  ? "bg-surface text-main shadow-xs border border-main"
                  : "text-[#8B5A2B] hover:text-main"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Management Key
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {activeTab === "account" ? (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-main mb-1">Current Account Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-90 transition-colors shadow-md"
            >
              {loading ? "Updating Password..." : "Update Account Password"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangeManagementKey} className="space-y-3">
            <p className="text-xs text-[#8B5A2B] bg-[#F4EBE1] p-2.5 rounded-xl border border-main">
              The Management Security Key protects sensitive admin actions (such as property deletions). Changing it requires both your Admin login password and current key.
            </p>

            <div>
              <label className="block text-xs font-bold text-main mb-1">Your Admin Login Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Verify Admin Password"
                className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main mb-1">Current Management Security Key</label>
              <input
                type="password"
                required
                value={currentSecurityKey}
                onChange={(e) => setCurrentSecurityKey(e.target.value)}
                placeholder="Enter current Management Security Key"
                className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main mb-1">New Management Security Key</label>
              <input
                type="password"
                required
                value={newSecurityKey}
                onChange={(e) => setNewSecurityKey(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main mb-1">Confirm New Key</label>
              <input
                type="password"
                required
                value={confirmSecurityKey}
                onChange={(e) => setConfirmSecurityKey(e.target.value)}
                placeholder="Re-enter new key"
                className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-90 transition-colors shadow-md flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? "Updating Security Key..." : "Update Management Key"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
