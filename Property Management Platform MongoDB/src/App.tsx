/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { AuthModal } from "./components/AuthModal";
import { Dashboard } from "./components/Dashboard";
import { PropertiesView } from "./components/PropertiesView";
import { MaintenanceView } from "./components/MaintenanceView";
import { AmenitiesView } from "./components/AmenitiesView";
import { UsersView } from "./components/UsersView";
import { NotificationsView } from "./components/NotificationsView";
import { ProfileModal } from "./components/ProfileModal";
import {
  User,
  Property,
  MaintenanceRequest,
  Amenity,
  AmenityBooking,
  NotificationItem,
  OwnershipRequest,
  MoveRequest,
  MoveOutRequest,
  UnclaimRequest
} from "./types";
import { Key, Home, X, AlertCircle, CheckCircle2, ShieldAlert, Lock, LogOut } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Data Stores
  const [properties, setProperties] = useState<Property[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [ownershipRequests, setOwnershipRequests] = useState<OwnershipRequest[]>([]);
  const [moveRequests, setMoveRequests] = useState<MoveRequest[]>([]);
  const [moveOutRequests, setMoveOutRequests] = useState<MoveOutRequest[]>([]);
  const [unclaimRequests, setUnclaimRequests] = useState<UnclaimRequest[]>([]);

  // Modals & Banners
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [showMoveInModal, setShowMoveInModal] = useState(false);
  const [selectedPropertyIdForModal, setSelectedPropertyIdForModal] = useState("");
  const [modalMsg, setModalMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Initial Fetching
  const fetchAllData = async () => {
    try {
      if (!token) {
        const [propRes, amenRes] = await Promise.all([
          fetch("/api/properties"),
          fetch("/api/amenities")
        ]);
        if (propRes.ok) setProperties(await propRes.json());
        if (amenRes.ok) setAmenities(await amenRes.json());
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch user profile first to know role for conditional requests
      const meRes = await fetch("/api/auth/me", { headers });
      const currentUser = meRes.ok ? await meRes.json() : null;
      if (currentUser) setUser(currentUser);

      const fetchPromises: Promise<Response>[] = [
        fetch("/api/properties", { headers }),
        fetch("/api/amenities", { headers }),
        fetch("/api/maintenance", { headers }),
        fetch("/api/bookings", { headers }),
        fetch("/api/notifications", { headers }),
        fetch("/api/ownership-requests", { headers }),
        fetch("/api/move-requests", { headers }),
        fetch("/api/move-out-requests", { headers }),
        fetch("/api/unclaim-requests", { headers }),
      ];

      if (currentUser?.role === "Admin" || currentUser?.role === "Owner") {
        fetchPromises.push(fetch("/api/users", { headers }));
      }

      const results = await Promise.all(fetchPromises);
      const [propRes, amenRes, maintRes, bookRes, notifRes, ownRes, moveRes, moveOutRes, unclaimRes, usersRes] = results;

      if (propRes?.ok) setProperties(await propRes.json());
      if (amenRes?.ok) setAmenities(await amenRes.json());
      if (maintRes?.ok) setMaintenance(await maintRes.json());
      if (bookRes?.ok) setBookings(await bookRes.json());
      if (notifRes?.ok) setNotifications(await notifRes.json());
      if (ownRes?.ok) setOwnershipRequests(await ownRes.json());
      if (moveRes?.ok) setMoveRequests(await moveRes.json());
      if (moveOutRes?.ok) setMoveOutRequests(await moveOutRes.json());
      if (unclaimRes?.ok) setUnclaimRequests(await unclaimRes.json());
      if (usersRes?.ok) setAllUsers(await usersRes.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const handleLoginSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  const handleMarkNotificationsRead = async () => {
    if (!token) return;
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Ownership Request
  const handleSubmitOwnershipRequest = async (propertyId: string) => {
    if (!token) return;
    setModalMsg(null);
    try {
      const res = await fetch("/api/ownership-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Ownership request failed");

      setModalMsg({ type: "success", text: "Ownership request submitted! Pending approval." });
      setShowOwnershipModal(false);
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Approve Ownership Request (Admin / Current Owner)
  const handleApproveOwnershipRequest = async (requestId: string, forceOverride = false) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/ownership-requests/${requestId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ forceOverride })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setModalMsg({ type: "success", text: "Ownership request update processed!" });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Reject / Disapprove Ownership Request
  const handleRejectOwnershipRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/ownership-requests/${requestId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setModalMsg({ type: "success", text: "Ownership request rejected." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Cancel Ownership Request
  const handleCancelOwnershipRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/ownership-requests/${requestId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Cancellation failed");

      setModalMsg({ type: "success", text: "Ownership request cancelled." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Submit Move-In Request
  const handleSubmitMoveInRequest = async (toPropertyId: string) => {
    if (!token) return;
    setModalMsg(null);
    try {
      const res = await fetch("/api/move-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ toPropertyId })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Move-in request failed");

      setModalMsg({ type: "success", text: "Move-in request submitted! Pending Admin and New Owner approval." });
      setShowMoveInModal(false);
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Approve Move-In Request
  const handleApproveMoveRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/move-requests/${requestId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setModalMsg({ type: "success", text: "Move request approved!" });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Reject / Disapprove Move-In Request
  const handleRejectMoveRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/move-requests/${requestId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setModalMsg({ type: "success", text: "Move request rejected." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Cancel Move-In Request
  const handleCancelMoveRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/move-requests/${requestId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Cancellation failed");

      setModalMsg({ type: "success", text: "Move request cancelled." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Submit Standalone Move-Out Request
  const handleCreateMoveOutRequest = async (propertyId: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/move-out-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Move-out request failed");

      setModalMsg({ type: "success", text: "Move-out request submitted! Pending Admin and Owner approval." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Approve Move-Out Request
  const handleApproveMoveOutRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/move-out-requests/${requestId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setModalMsg({ type: "success", text: "Move-out request approved!" });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Reject Move-Out Request
  const handleRejectMoveOutRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/move-out-requests/${requestId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setModalMsg({ type: "success", text: "Move-out request rejected." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Cancel Move-Out Request
  const handleCancelMoveOutRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/move-out-requests/${requestId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Cancellation failed");

      setModalMsg({ type: "success", text: "Move-out request cancelled." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Finalize Standalone Move-Out
  const handleFinalizeMoveOutRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/move-out-requests/${requestId}/finalize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Finalize failed");

      setModalMsg({ type: "success", text: "Move-out finalized successfully! Residency cleared." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Approve Unclaim Request (Admin)
  const handleApproveUnclaimRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/unclaim-requests/${requestId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setModalMsg({ type: "success", text: "Unclaim request approved! Property surrendered." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Reject Unclaim Request
  const handleRejectUnclaimRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/unclaim-requests/${requestId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setModalMsg({ type: "success", text: "Unclaim request rejected." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Cancel Unclaim Request
  const handleCancelUnclaimRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/unclaim-requests/${requestId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Cancellation failed");

      setModalMsg({ type: "success", text: "Unclaim request cancelled." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Execute Legacy Move Out (for 2-step move transition)
  const handleExecuteMoveOut = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/residency/move-out", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Move out failed");

      setModalMsg({ type: "success", text: "Move-out executed! You can now finalize Move-In to your new property." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  // Finalize Legacy Move In
  const handleFinalizeMoveIn = async (moveRequestId: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/residency/move-in-finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ moveRequestId })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Move-in finalize failed");

      setModalMsg({ type: "success", text: "Move-in complete! Welcome to your new unit." });
      fetchAllData();
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    }
  };

  if (!token || !user) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} properties={properties} />;
  }

  // Pending Move Request for current user
  const myMoveRequest = moveRequests.find((m) => m.userId === user.id && m.status !== "Completed" && m.status !== "Rejected" && m.status !== "Cancelled");

  // Pending Approvals for Admin / Owner
  const pendingOwnershipApprovals = ownershipRequests.filter((r) => {
    if (r.status === "Approved" || r.status === "Rejected" || r.status === "Cancelled") return false;
    const targetProp = properties.find((p) => p.id === r.propertyId);
    if (r.currentOwnerId === null && targetProp && targetProp.ownerId !== null) return false;
    if (user.role === "Admin" && !r.adminApproved) return true;
    if (r.currentOwnerId === user.id && !r.ownerApproved) return true;
    return false;
  });

  const pendingMoveApprovals = moveRequests.filter((m) => {
    if (m.status === "Completed" || m.status === "Rejected" || m.status === "Cancelled") return false;
    const targetProp = properties.find((p) => p.id === m.toPropertyId);
    if (user.role === "Admin" && !m.adminApproved) return true;
    if (targetProp && targetProp.ownerId === user.id && !m.newOwnerApproved) return true;
    return false;
  });

  const pendingMoveOutApprovals = moveOutRequests.filter((m) => {
    if (m.status === "Completed" || m.status === "Rejected" || m.status === "Cancelled") return false;
    const prop = properties.find((p) => p.id === m.propertyId);
    if (user.role === "Admin" && !m.adminApproved) return true;
    if (prop && prop.ownerId === user.id && !m.ownerApproved) return true;
    return false;
  });

  const pendingUnclaimApprovals = unclaimRequests.filter((u) => {
    if (u.status === "Approved" || u.status === "Rejected" || u.status === "Cancelled") return false;
    if (user.role === "Admin" && u.status === "Pending Admin Approval") return true;
    return false;
  });

  const totalPendingApprovals =
    pendingOwnershipApprovals.length +
    pendingMoveApprovals.length +
    pendingMoveOutApprovals.length +
    pendingUnclaimApprovals.length;

  return (
    <div className="min-h-screen bg-base text-main font-sans pb-12">
      {/* Navigation Bar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onChangePasswordClick={() => setShowPasswordModal(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {modalMsg && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-2xs ${
              modalMsg.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {modalMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{modalMsg.text}</span>
            </div>
            <button onClick={() => setModalMsg(null)} className="font-bold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* WORKFLOW BANNER: Two-Step Move-In / Move-Out Transition Banner */}
        {myMoveRequest && (
          <div className="bg-surface border-2 border-primary rounded-3xl p-5 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-primary text-white rounded-full">
                Two-Step Residency Transition
              </span>
              <h4 className="font-extrabold text-main text-base">
                Move Request to {myMoveRequest.toPropertyName}
              </h4>
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                Status: <span className="font-bold text-primary">{myMoveRequest.status}</span>
                {myMoveRequest.status === "Pending Approvals" && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    Awaiting Owner & Admin Approval
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {user.currentPropertyId && user.currentPropertyId !== myMoveRequest.toPropertyId && (
                myMoveRequest.status === "Pending Approvals" ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-200 text-gray-500 font-bold text-xs rounded-xl border border-gray-300 cursor-not-allowed flex items-center gap-1.5 shadow-2xs"
                    title="Move-out is locked until your move-in request to the new property is approved by both the owner and admin."
                  >
                    <Lock className="w-3.5 h-3.5 text-gray-400" /> Step 3: Move-Out Locked (Awaiting Approval)
                  </button>
                ) : (
                  <button
                    onClick={handleExecuteMoveOut}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 animate-pulse"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Step 3: Execute Move-Out
                  </button>
                )
              )}

              {myMoveRequest.status === "Approved - Waiting for Move-Out" && !user.currentPropertyId && (
                <button
                  onClick={() => handleFinalizeMoveIn(myMoveRequest.id)}
                  className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl shadow-xs transition-colors animate-bounce flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Step 4: Complete Final Move-In
                </button>
              )}
            </div>
          </div>
        )}

        {/* PENDING APPROVALS ALERT BAR FOR ADMIN & OWNERS */}
        {totalPendingApprovals > 0 && (
          <div className="bg-surface border border-main rounded-3xl p-5 shadow-2xs space-y-3">
            <h4 className="font-extrabold text-main text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Pending System Approvals Required ({totalPendingApprovals})
            </h4>

            <div className="divide-y divide-main/30 text-xs">
              {pendingOwnershipApprovals.map((req) => (
                <div key={req.id} className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="font-bold text-main">{req.requesterName}</span> ({req.requesterRole}) requested ownership of{" "}
                    <span className="font-bold text-primary">{req.propertyDisplayName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveOwnershipRequest(req.id)}
                      className="px-3 py-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold rounded-lg transition-colors"
                    >
                      Approve Transfer
                    </button>
                    {user.role === "Admin" && (
                      <button
                        onClick={() => handleApproveOwnershipRequest(req.id, true)}
                        className="px-3 py-1 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold rounded-lg transition-colors"
                        title="Force Admin Override"
                      >
                        Admin Override
                      </button>
                    )}
                    <button
                      onClick={() => handleRejectOwnershipRequest(req.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Disapprove / Reject
                    </button>
                  </div>
                </div>
              ))}

              {pendingMoveApprovals.map((m) => (
                <div key={m.id} className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="font-bold text-main">{m.userName}</span> requested move-in to{" "}
                    <span className="font-bold text-primary">{m.toPropertyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveMoveRequest(m.id)}
                      className="px-3 py-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold rounded-lg transition-colors"
                    >
                      Approve Move-In
                    </button>
                    <button
                      onClick={() => handleRejectMoveRequest(m.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Disapprove / Reject
                    </button>
                  </div>
                </div>
              ))}

              {pendingMoveOutApprovals.map((m) => (
                <div key={m.id} className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="font-bold text-main">{m.userName}</span> ({m.userRole}) requested move-out from{" "}
                    <span className="font-bold text-primary">{m.propertyDisplayName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveMoveOutRequest(m.id)}
                      className="px-3 py-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold rounded-lg transition-colors"
                    >
                      Approve Move-Out
                    </button>
                    <button
                      onClick={() => handleRejectMoveOutRequest(m.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Disapprove / Reject
                    </button>
                  </div>
                </div>
              ))}

              {pendingUnclaimApprovals.map((u) => (
                <div key={u.id} className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="font-bold text-main">{u.ownerName}</span> requested to surrender/unclaim ownership of{" "}
                    <span className="font-bold text-primary">{u.propertyDisplayName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveUnclaimRequest(u.id)}
                      className="px-3 py-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold rounded-lg transition-colors"
                    >
                      Approve Unclaim
                    </button>
                    <button
                      onClick={() => handleRejectUnclaimRequest(u.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Disapprove / Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab View Routing */}
        {activeTab === "dashboard" && (
          <Dashboard
            user={user}
            properties={properties}
            maintenance={maintenance}
            bookings={bookings}
            notifications={notifications}
            allUsers={allUsers}
            setActiveTab={setActiveTab}
            onRequestOwnershipClick={() => setShowOwnershipModal(true)}
            onRequestRentalClick={() => setShowMoveInModal(true)}
            token={token || undefined}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === "properties" && (
          <PropertiesView
            user={user}
            properties={properties}
            token={token}
            onRefresh={fetchAllData}
            onRequestOwnership={(pid) => {
              setSelectedPropertyIdForModal(pid);
              setShowOwnershipModal(true);
            }}
            onRequestMoveIn={(pid) => {
              setSelectedPropertyIdForModal(pid);
              setShowMoveInModal(true);
            }}
            ownershipRequests={ownershipRequests}
            moveRequests={moveRequests}
            moveOutRequests={moveOutRequests}
            unclaimRequests={unclaimRequests}
            onCancelMoveIn={handleCancelMoveRequest}
            onCancelOwnership={handleCancelOwnershipRequest}
            onRequestMoveOut={handleCreateMoveOutRequest}
            onCancelMoveOut={handleCancelMoveOutRequest}
            onFinalizeMoveOut={handleFinalizeMoveOutRequest}
            onCancelUnclaim={handleCancelUnclaimRequest}
          />
        )}

        {activeTab === "maintenance" && (
          <MaintenanceView
            user={user}
            maintenance={maintenance}
            properties={properties}
            token={token}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === "amenities" && (
          <AmenitiesView
            user={user}
            amenities={amenities}
            bookings={bookings}
            token={token}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === "users" && user.role === "Admin" && (
          <UsersView users={allUsers} properties={properties} token={token} onRefresh={fetchAllData} />
        )}

        {activeTab === "notifications" && (
          <NotificationsView notifications={notifications} onMarkAllRead={handleMarkNotificationsRead} />
        )}
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && user && (
        <ProfileModal user={user} token={token} onClose={() => setShowPasswordModal(false)} />
      )}

      {/* Request Ownership Modal */}
      {showOwnershipModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setShowOwnershipModal(false)}
        >
          <div 
            className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full border border-main shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-main">
              <h3 className="font-extrabold text-main text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" /> Request Property Ownership
              </h3>
              <button onClick={() => setShowOwnershipModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Select an ownerless property record to submit an official ownership request.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedPropertyIdForModal) handleSubmitOwnershipRequest(selectedPropertyIdForModal);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-main mb-1">Select Property</label>
                <select
                  required
                  value={selectedPropertyIdForModal}
                  onChange={(e) => setSelectedPropertyIdForModal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                >
                  <option value="">Choose an ownerless property...</option>
                  {properties
                    .filter((p) => p.ownerId === null)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName} (Unowned)
                      </option>
                    ))}
                </select>
                {properties.filter((p) => p.ownerId === null).length === 0 && (
                  <p className="text-xs text-amber-700 font-semibold mt-1">
                    There are currently no ownerless properties available.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={properties.filter((p) => p.ownerId === null).length === 0}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors shadow-md ${
                  properties.filter((p) => p.ownerId === null).length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary text-white hover:brightness-90"
                }`}
              >
                Submit Ownership Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Move-In Modal */}
      {showMoveInModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setShowMoveInModal(false)}
        >
          <div 
            className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full border border-main shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-main">
              <h3 className="font-extrabold text-main text-lg flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" /> Request Property Move-In
              </h3>
              <button onClick={() => setShowMoveInModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Select a property to move into. Both Admin and the property owner must approve.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedPropertyIdForModal) handleSubmitMoveInRequest(selectedPropertyIdForModal);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-main mb-1">Select Destination Property</label>
                <select
                  required
                  value={selectedPropertyIdForModal}
                  onChange={(e) => setSelectedPropertyIdForModal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                >
                  <option value="">Choose an owned property...</option>
                  {properties
                    .filter((p) => p.ownerId !== null)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName} (Owner: {p.ownerName})
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-90 transition-colors shadow-md"
              >
                Submit Move-In Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
