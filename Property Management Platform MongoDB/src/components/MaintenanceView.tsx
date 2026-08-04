import React, { useState } from "react";
import { Wrench, Plus, Search, Filter, AlertCircle, CheckCircle2, User, Clock, ShieldAlert, X } from "lucide-react";
import { MaintenanceRequest, Property, User as UserType } from "../types";

interface MaintenanceViewProps {
  user: UserType;
  maintenance: MaintenanceRequest[];
  properties: Property[];
  token: string;
  onRefresh: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  user,
  maintenance,
  properties,
  token,
  onRefresh
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Request Form
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");

  // User's allowed properties (where user is owner or resident)
  const allowedProperties = properties.filter(
    (p) => p.ownerId === user.id || p.residentList.includes(user.id) || user.role === "Admin"
  );

  const filteredTickets = maintenance
    .filter((m) => {
      const matchesSearch =
        m.propertyDisplayName.toLowerCase().includes(search.toLowerCase()) ||
        m.issueDescription.toLowerCase().includes(search.toLowerCase()) ||
        m.creatorName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || m.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || m.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId: selectedPropertyId, issueDescription, priority })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Failed to create ticket");

      setSuccess("Maintenance request submitted successfully!");
      setShowCreateModal(false);
      setIssueDescription("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClaimTicket = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/maintenance/${id}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Claim failed");
      setSuccess("Ticket claimed successfully!");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUnclaimTicket = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/maintenance/${id}/unclaim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Unclaim failed");
      setSuccess("Ticket unclaimed and returned to pending queue.");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResolveTicket = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/maintenance/${id}/resolve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Resolve failed");
      setSuccess("Ticket marked resolved! Submitted to Admin for final sign-off.");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFinalizeTicket = async (id: string, approved: boolean) => {
    setError(null);
    try {
      const res = await fetch(`/api/maintenance/${id}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approved })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Action failed");
      setSuccess(approved ? "Ticket finalized & completed!" : "Ticket rejected back to pending queue.");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-main">Maintenance Requests</h1>
          <p className="text-xs text-gray-600">Report and track apartment repair & maintenance issues</p>
        </div>

        {(user.role === "Tenant" || user.role === "Owner" || user.role === "Admin") && (
          <button
            onClick={() => {
              if (allowedProperties.length > 0) {
                setSelectedPropertyId(allowedProperties[0].id);
              }
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:brightness-90 transition-colors shadow-md flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Maintenance Request</span>
          </button>
        )}
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

      {/* Filters & Search */}
      <div className="bg-surface p-4 rounded-2xl border border-main shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, properties..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-main bg-base text-xs text-main"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-main">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-main bg-base text-xs font-semibold text-main"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Admin Approval">Waiting Admin Approval</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-main">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-main bg-base text-xs font-semibold text-main"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="bg-surface p-8 rounded-3xl border border-main text-center text-xs text-gray-500">
            No maintenance requests match the current filters.
          </div>
        ) : (
          filteredTickets.map((m) => (
            <div
              key={m.id}
              className="bg-surface rounded-3xl p-5 border border-main shadow-2xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-main/30">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                    <Wrench className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-main text-base">{m.propertyDisplayName}</h3>
                    <p className="text-[11px] text-gray-500">
                      Reported by {m.creatorName} ({m.creatorRole}) on {new Date(m.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Priority Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      m.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : m.priority === "Medium"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {m.priority} Priority
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === "Completed"
                        ? "status-approved"
                        : m.status === "Waiting for Admin Approval"
                        ? "status-waiting"
                        : m.status === "In Progress"
                        ? "bg-blue-50 text-blue-700"
                        : "status-pending"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-main leading-relaxed font-medium">{m.issueDescription}</p>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-xs">
                <div className="text-gray-500 text-[11px]">
                  Assigned Staff: <span className="font-bold text-main">{m.assignedStaffName || "Unassigned"}</span>
                  {m.completedDate && (
                    <span className="ml-3 text-green-700 font-semibold">
                      Completed: {new Date(m.completedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Role Specific Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {user.role === "Staff" && m.status === "Pending" && (
                    <button
                      onClick={() => handleClaimTicket(m.id)}
                      className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold hover:brightness-90 transition-colors"
                    >
                      Claim Ticket
                    </button>
                  )}

                  {user.role === "Staff" && m.assignedStaffId === user.id && m.status === "In Progress" && (
                    <>
                      <button
                        onClick={() => handleUnclaimTicket(m.id)}
                        className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                      >
                        Un-claim
                      </button>
                      <button
                        onClick={() => handleResolveTicket(m.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#1565C0] text-white font-bold hover:bg-[#0D47A1] transition-colors"
                      >
                        Mark Resolved
                      </button>
                    </>
                  )}

                  {user.role === "Admin" && m.status === "Waiting for Admin Approval" && (
                    <>
                      <button
                        onClick={() => handleFinalizeTicket(m.id, false)}
                        className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors"
                      >
                        Reject Back to Queue
                      </button>
                      <button
                        onClick={() => handleFinalizeTicket(m.id, true)}
                        className="px-3 py-1.5 rounded-xl bg-[#2E7D32] text-white font-bold hover:bg-[#1B5E20] transition-colors"
                      >
                        Approve & Finalize
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-surface rounded-md p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto border border-main shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-main">
              <h3 className="font-extrabold text-main text-lg">Create Maintenance Request</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-main mb-1">Select Property</label>
                <select
                  required
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                >
                  {allowedProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">Issue Description</label>
                <textarea
                  required
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue clearly (e.g. water pipe leak in master bathroom)..."
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main h-28"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-90 transition-colors"
              >
                Submit Maintenance Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
