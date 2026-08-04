import React from "react";
import {
  Users,
  Building2,
  Wrench,
  Calendar,
  Bell,
  Home,
  ArrowUpRight,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Key
} from "lucide-react";
import { User, Property, MaintenanceRequest, AmenityBooking, NotificationItem } from "../types";

interface DashboardProps {
  user: User;
  properties: Property[];
  maintenance: MaintenanceRequest[];
  bookings: AmenityBooking[];
  notifications: NotificationItem[];
  allUsers: User[];
  setActiveTab: (tab: string) => void;
  onRequestOwnershipClick: () => void;
  onRequestRentalClick: () => void;
  token?: string;
  onRefresh?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  properties,
  maintenance,
  bookings,
  notifications,
  allUsers,
  setActiveTab,
  onRequestOwnershipClick,
  onRequestRentalClick,
  token,
  onRefresh
}) => {
  // Stats Calculations
  const pendingRegistrations = allUsers.filter((u) => u.status === "Pending").length;
  const totalProperties = properties.length;
  const activeMaintenance = maintenance.filter((m) => m.status !== "Completed").length;
  const activeBookings = bookings.filter((b) => b.status === "Booked").length;

  // Owned properties for owner
  const myOwnedProperties = properties.filter((p) => p.ownerId === user.id);
  const myOwnedPropertyIds = myOwnedProperties.map((p) => p.id);

  // Pending tenant registrations for properties owned by this user
  const pendingTenantsForMyProperties = allUsers.filter(
    (u) =>
      u.role === "Tenant" &&
      u.status === "Pending" &&
      !u.ownerApproved &&
      u.requestedPropertyId &&
      myOwnedPropertyIds.includes(u.requestedPropertyId)
  );

  const handleOwnerApproveTenant = async (tenantId: string) => {
    try {
      const authToken = token || localStorage.getItem("auth_token");
      const res = await fetch(`/api/users/${tenantId}/owner-approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) alert(data.error || "Approval failed");
      else {
        alert(data.message);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOwnerRejectTenant = async (tenantId: string) => {
    try {
      const authToken = token || localStorage.getItem("auth_token");
      const res = await fetch(`/api/users/${tenantId}/owner-reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) alert(data.error || "Rejection failed");
      else {
        alert(data.message);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Current property for tenant / resident owner
  const myCurrentProperty = properties.find((p) => p.id === user.currentPropertyId);

  // My maintenance tickets
  const myMaintenance = maintenance.filter(
    (m) => m.createdBy === user.id || (myCurrentProperty && m.propertyId === myCurrentProperty.id)
  );

  // Staff tickets
  const availableStaffTickets = maintenance.filter((m) => m.status === "Pending");
  const myAssignedStaffTickets = maintenance.filter((m) => m.assignedStaffId === user.id);

  return (
    <div className="space-y-6">
      {/* Apartment Banner & Greeting */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg bg-primary text-white p-6 sm:p-10 transition-colors duration-750">
        <div className="absolute inset-0 opacity-20 bg-[url('/assets/properties/apartment%201.avif')] bg-cover bg-center mix-blend-overlay" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Astral Hills</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Welcome, {user.name}!</h1>
          <p className="text-xs sm:text-sm !text-white max-w-xl font-medium">
            {user.role === "Admin" && "You hold full system administration and operational oversight."}
            {user.role === "Owner" && "Manage your property investments, approve residents, and access amenities."}
            {user.role === "Tenant" && "Track your tenancy, submit maintenance requests, and reserve amenities."}
            {user.role === "Staff" && "Resolve maintenance issues promptly to maintain high community standards."}
            {user.status === "Moved Out" && "You are currently not residing in a property. Choose an action below."}
          </p>
        </div>
      </div>

      {/* SPECIAL MOVED-OUT DASHBOARD OVERRIDE */}
      {user.status === "Moved Out" && (
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-main shadow-sm space-y-6">
          <div className="bg-[#FFF3E0] border border-[#FFCC80] p-4 rounded-2xl flex items-start gap-3 text-[#E65100]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Residency Status: Moved Out</h3>
              <p className="text-xs mt-0.5">
                You are currently preserved as an active system account but have no assigned property. Your complete history and notifications remain intact.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-main mb-4">Available Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={onRequestRentalClick}
                className="p-5 rounded-2xl bg-base border border-main hover:border-primary hover:bg-highlight/30 text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                    <Home className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <h4 className="font-bold text-main text-sm">Request Property Rental</h4>
                <p className="text-xs text-gray-600 mt-1">Submit a move-in request for an available apartment unit.</p>
              </button>

              <button
                onClick={onRequestOwnershipClick}
                className="p-5 rounded-2xl bg-base border border-main hover:border-primary hover:bg-highlight/30 text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-dark text-white flex items-center justify-center font-bold">
                    <Key className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <h4 className="font-bold text-main text-sm">Request Property Ownership</h4>
                <p className="text-xs text-gray-600 mt-1">Submit an ownership transfer request for a property.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD METRICS */}
      {user.role === "Admin" && user.status !== "Moved Out" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab("users")}
            className="p-5 rounded-2xl bg-surface border border-main shadow-2xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wide">Total Users</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-extrabold text-main">{allUsers.length}</div>
            <p className="text-[11px] font-semibold text-[#E65100] mt-1">
              {pendingRegistrations} Pending Approvals
            </p>
          </div>

          <div
            onClick={() => setActiveTab("properties")}
            className="p-5 rounded-2xl bg-surface border border-main shadow-2xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wide">Properties</span>
              <Building2 className="w-5 h-5 text-muted" />
            </div>
            <div className="text-2xl font-extrabold text-main">{totalProperties}</div>
            <p className="text-[11px] font-semibold text-gray-500 mt-1">Across all blocks & towers</p>
          </div>

          <div
            onClick={() => setActiveTab("maintenance")}
            className="p-5 rounded-2xl bg-surface border border-main shadow-2xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wide">Maintenance</span>
              <Wrench className="w-5 h-5 text-[#1565C0]" />
            </div>
            <div className="text-2xl font-extrabold text-main">{activeMaintenance}</div>
            <p className="text-[11px] font-semibold text-[#1565C0] mt-1">Active requests</p>
          </div>

          <div
            onClick={() => setActiveTab("amenities")}
            className="p-5 rounded-2xl bg-surface border border-main shadow-2xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wide">Active Bookings</span>
              <Calendar className="w-5 h-5 text-[#8E6BBE]" />
            </div>
            <div className="text-2xl font-extrabold text-main">{activeBookings}</div>
            <p className="text-[11px] font-semibold text-[#8E6BBE] mt-1">Amenity reservations</p>
          </div>
        </div>
      )}

      {/* OWNER DASHBOARD CONTENT */}
      {user.role === "Owner" && user.status !== "Moved Out" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {pendingTenantsForMyProperties.length > 0 && (
              <div className="bg-surface border-2 border-amber-300 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <h4 className="font-extrabold text-main text-sm flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-600" />
                    Pending Tenant Move-In Requests ({pendingTenantsForMyProperties.length})
                  </h4>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Owner Approval Required
                  </span>
                </div>
                <div className="divide-y divide-amber-100">
                  {pendingTenantsForMyProperties.map((tenant) => {
                    const reqProp = properties.find((p) => p.id === tenant.requestedPropertyId);
                    return (
                      <div key={tenant.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-main text-sm">{tenant.name}</div>
                          <div className="text-gray-500 font-medium">{tenant.email}</div>
                          <div className="text-[11px] text-muted font-semibold mt-0.5">
                            Requesting to move into: <strong>{reqProp ? reqProp.displayName : "Property"}</strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOwnerRejectTenant(tenant.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg font-bold text-xs transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleOwnerApproveTenant(tenant.id)}
                            className="px-3 py-1.5 bg-[#2E7D32] text-white hover:bg-[#1B5E20] rounded-lg font-bold text-xs shadow-2xs transition-colors"
                          >
                            Approve Move-In
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-main flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> My Owned Properties ({myOwnedProperties.length})
              </h3>
              <button
                onClick={onRequestOwnershipClick}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" /> Request Another Property
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myOwnedProperties.map((p) => (
                <div key={p.id} className="bg-surface rounded-2xl p-4 border border-main shadow-2xs space-y-3">
                  <div className="h-32 rounded-xl overflow-hidden relative">
                    <img src={p.image} alt={p.displayName} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {p.bedrooms} BHK
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-main text-base">{p.displayName}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Residents: {p.residentDetails && p.residentDetails.length > 0 ? p.residentDetails.map((r) => r.name).join(", ") : "Vacant"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-main">Quick Operations</h3>
            <div className="bg-surface rounded-2xl p-4 border border-main space-y-3">
              <button
                onClick={() => setActiveTab("maintenance")}
                className="w-full text-left p-3 rounded-xl bg-base hover:bg-highlight/30 font-bold text-xs text-main flex items-center justify-between transition-colors"
              >
                <span>Submit Maintenance Issue</span>
                <Wrench className="w-4 h-4 text-primary" />
              </button>
              <button
                onClick={() => setActiveTab("amenities")}
                className="w-full text-left p-3 rounded-xl bg-base hover:bg-highlight/30 font-bold text-xs text-main flex items-center justify-between transition-colors"
              >
                <span>Book Community Amenity</span>
                <Calendar className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TENANT DASHBOARD CONTENT */}
      {user.role === "Tenant" && user.status !== "Moved Out" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-extrabold text-main">Current Residing Property</h3>
            {myCurrentProperty ? (
              <div className="bg-surface rounded-3xl p-6 border border-main shadow-2xs flex flex-col sm:flex-row gap-6 items-center">
                <img
                  src={myCurrentProperty.image}
                  alt={myCurrentProperty.displayName}
                  className="w-full sm:w-48 h-36 rounded-2xl object-cover shrink-0"
                />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                      Active Tenancy
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">{myCurrentProperty.block}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-main">{myCurrentProperty.displayName}</h2>
                  <p className="text-xs text-gray-600 line-clamp-2">{myCurrentProperty.details}</p>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setActiveTab("maintenance")}
                      className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-90 transition-colors"
                    >
                      Report Maintenance Issue
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No active property assigned.</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-main">My Active Maintenance</h3>
            <div className="bg-surface rounded-2xl p-4 border border-main space-y-3">
              {myMaintenance.length === 0 ? (
                <p className="text-xs text-center py-4 text-gray-500">No maintenance tickets found.</p>
              ) : (
                myMaintenance.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-base border border-main/50 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-main">
                      <span>{m.propertyDisplayName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          m.status === "Completed" ? "status-approved" : "status-pending"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{m.issueDescription}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STAFF DASHBOARD CONTENT */}
      {user.role === "Staff" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-main flex items-center justify-between">
              <span>Available Tickets to Pick ({availableStaffTickets.length})</span>
            </h3>
            <div className="space-y-3">
              {availableStaffTickets.length === 0 ? (
                <div className="bg-surface p-6 rounded-2xl text-center text-xs text-gray-500 border border-main">
                  No pending maintenance tickets available.
                </div>
              ) : (
                availableStaffTickets.map((m) => (
                  <div key={m.id} className="bg-surface p-4 rounded-2xl border border-main shadow-2xs space-y-2">
                    <div className="flex justify-between items-center font-bold text-sm text-main">
                      <span>{m.propertyDisplayName}</span>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#FFF3E0] text-[#E65100]">
                        {m.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{m.issueDescription}</p>
                    <button
                      onClick={() => setActiveTab("maintenance")}
                      className="w-full py-2 bg-primary text-white font-bold text-xs rounded-xl hover:brightness-90 transition-colors"
                    >
                      Claim Ticket
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-main">My Assigned Tickets ({myAssignedStaffTickets.length})</h3>
            <div className="space-y-3">
              {myAssignedStaffTickets.length === 0 ? (
                <div className="bg-surface p-6 rounded-2xl text-center text-xs text-gray-500 border border-main">
                  You have not claimed any maintenance tickets yet.
                </div>
              ) : (
                myAssignedStaffTickets.map((m) => (
                  <div key={m.id} className="bg-surface p-4 rounded-2xl border border-main shadow-2xs space-y-2">
                    <div className="flex justify-between items-center font-bold text-sm text-main">
                      <span>{m.propertyDisplayName}</span>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#E3F2FD] text-[#1565C0]">
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{m.issueDescription}</p>
                    <button
                      onClick={() => setActiveTab("maintenance")}
                      className="w-full py-2 bg-[#1565C0] text-white font-bold text-xs rounded-xl hover:bg-[#0D47A1] transition-colors"
                    >
                      Manage Ticket
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
