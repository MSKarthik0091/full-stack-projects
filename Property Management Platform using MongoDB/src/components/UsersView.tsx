import React, { useState } from "react";
import { Users, Search, Filter, CheckCircle2, XCircle, AlertCircle, Shield, Lock } from "lucide-react";
import { User, Property } from "../types";

interface UsersViewProps {
  users: User[];
  properties?: Property[];
  token: string;
  onRefresh: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ users, properties = [], token, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getApprovalStatus = (u: User) => {
    if (u.status !== "Pending") return { canApprove: false, reason: "" };

    if (u.role === "Tenant") {
      if (u.adminApproved) {
        return {
          canApprove: false,
          reason: "Approved by Admin. Awaiting Owner approval."
        };
      }
      const propId = u.requestedPropertyId || u.currentPropertyId;
      if (propId) {
        const prop = properties.find((p) => p.id === propId);
        if (prop && !prop.ownerId) {
          return {
            canApprove: false,
            reason: `Selected property (${prop.displayName}) is currently unowned. Tenants can only be approved if the property has an assigned owner.`
          };
        }
      }
    }

    if (u.role === "Owner") {
      const reqPropIds = u.requestedPropertyIds && u.requestedPropertyIds.length > 0
        ? u.requestedPropertyIds
        : (u.requestedPropertyId ? [u.requestedPropertyId] : []);

      if (reqPropIds.length > 0) {
        const occupied = properties.filter((p) => reqPropIds.includes(p.id) && p.ownerId !== null && p.ownerId !== u.id);
        if (occupied.length > 0) {
          const names = occupied.map((p) => p.displayName).join(", ");
          return {
            canApprove: false,
            reason: `Selected property/properties (${names}) already have an owner assigned. Owners can only register for unowned properties.`
          };
        }
      }
    }

    return { canApprove: true, reason: "" };
  };

  const handleApprove = async (id: string, name: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setSuccess(`Approved registration for ${name}!`);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async (id: string, name: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setSuccess(`Rejected registration for ${name}.`);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-main">User Approvals & Directory</h1>
          <p className="text-xs text-gray-600">Review pending registrations and manage user access roles</p>
        </div>
      </div>

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

      {/* Filter Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-main shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-main bg-base text-xs text-main"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-main">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-main bg-base text-xs font-semibold text-main"
            >
              <option value="All">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Tenant">Tenant</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-main">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-main bg-base text-xs font-semibold text-main"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Moved Out">Moved Out</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-surface rounded-3xl border border-main shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-main">
            <thead className="bg-base border-b border-main uppercase text-[10px] font-extrabold text-muted tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Requested Property & Occupancy</th>
                <th className="p-4">Status</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-main/30">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-base/50 transition-colors">
                    <td className="p-4 font-bold text-main">
                      {u.name}
                      {u.dateOfBirth && (
                        <div className="text-gray-700 font-semibold text-xs mt-1">
                          DOB: {`${String(new Date(u.dateOfBirth).getDate()).padStart(2, '0')}/${String(new Date(u.dateOfBirth).getMonth() + 1).padStart(2, '0')}/${new Date(u.dateOfBirth).getFullYear()}`}
                          <span className="ml-1 font-semibold text-gray-700">
                            ({Math.floor((new Date().getTime() - new Date(u.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} yrs)
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-gray-600 font-medium">{u.email}</td>
                    <td className="p-4 font-bold text-muted">{u.role}</td>
                    <td className="p-4">
                      {(() => {
                        if (u.role === "Tenant") {
                          const propId = u.requestedPropertyId || u.currentPropertyId;
                          const prop = properties.find((p) => p.id === propId);
                          const propName = prop ? prop.displayName : "No Property Selected";
                          const ownerName = prop && prop.ownerName && prop.ownerName !== "Unowned" ? prop.ownerName : "No Assigned Owner";

                          return (
                            <div className="space-y-1">
                              <div className="font-bold text-main text-xs flex items-center gap-1">
                                <span>🏠 {propName}</span>
                              </div>
                              <div className="text-[11px] font-semibold text-gray-600">
                                Occupancy: <span className="font-bold">Tenant Residing</span>
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Owner: <span className="font-semibold text-gray-700">{ownerName}</span>
                              </div>
                              {u.status === "Pending" && (
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${u.ownerApproved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    Owner: {u.ownerApproved ? "Approved" : "Pending"}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${u.adminApproved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    Admin: {u.adminApproved ? "Approved" : "Pending"}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }

                        if (u.role === "Owner") {
                          const reqPropIds = u.requestedPropertyIds && u.requestedPropertyIds.length > 0
                            ? u.requestedPropertyIds
                            : (u.requestedPropertyId ? [u.requestedPropertyId] : u.propertiesOwned || []);

                          const propNames = reqPropIds
                            .map((pid) => properties.find((p) => p.id === pid)?.displayName)
                            .filter(Boolean);

                          const propertyText = propNames.length > 0 ? propNames.join(", ") : "None Assigned";
                          const isResiding = u.status === "Approved" ? !!u.currentPropertyId : u.livesInside;
                          const resPropId = u.status === "Approved" ? u.currentPropertyId : u.residencePropertyId;
                          
                          const residencyText = isResiding
                            ? `Owner Residing in ${properties.find((p) => p.id === resPropId)?.displayName || propNames[0] || "Property"}`
                            : "Non-Resident Owner";

                          return (
                            <div className="space-y-1">
                              <div className="font-bold text-main text-xs">
                                🔑 {propertyText}
                              </div>
                              <div className="text-[11px] font-semibold text-gray-600">
                                Type: <span className="text-muted font-bold">{residencyText}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="text-gray-400 text-xs italic">
                            {u.role === "Staff" ? "Staff Member" : u.role === "Admin" ? "System Admin" : "N/A"}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === "Approved"
                            ? "status-approved"
                            : u.status === "Pending"
                            ? "status-pending"
                            : u.status === "Moved Out"
                            ? "status-movedout"
                            : "status-rejected"
                        }`}
                      >
                        {u.status === "Moved Out" && u.role === "Owner" && (!u.propertiesOwned || u.propertiesOwned.length === 0)
                          ? "Owner Moved Out"
                          : u.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      {u.status === "Pending" ? (() => {
                        const statusCheck = getApprovalStatus(u);
                        return (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center justify-end gap-2">
                              {!(u.role === "Tenant" && u.adminApproved) && (
                                <button
                                  onClick={() => handleReject(u.id, u.name)}
                                  className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold border border-red-200 transition-colors"
                                >
                                  Disapprove
                                </button>
                              )}
                              {statusCheck.canApprove ? (
                                <button
                                  onClick={() => handleApprove(u.id, u.name)}
                                  className="px-2.5 py-1 bg-[#2E7D32] text-white hover:bg-[#1B5E20] rounded-lg font-bold shadow-2xs transition-colors"
                                >
                                  Approve
                                </button>
                              ) : (
                                <button
                                  disabled
                                  title={statusCheck.reason}
                                  className="px-2.5 py-1 bg-gray-200 text-gray-500 rounded-lg font-bold cursor-not-allowed flex items-center gap-1 opacity-70"
                                >
                                  <Lock className="w-3 h-3" /> Locked
                                </button>
                              )}
                            </div>
                            {!statusCheck.canApprove && (
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md max-w-xs text-right">
                                {statusCheck.reason}
                              </span>
                            )}
                          </div>
                        );
                      })() : (
                        <span className="text-gray-400 text-[11px]">Verified</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
