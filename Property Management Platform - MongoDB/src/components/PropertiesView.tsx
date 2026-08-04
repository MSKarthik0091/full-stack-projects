import React, { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  User,
  Users as UsersIcon,
  Trash2,
  Key,
  Home,
  CheckCircle2,
  AlertCircle,
  X,
  Bed,
  LogOut,
  Ban,
  Image as ImageIcon
} from "lucide-react";
import { Property, User as UserType, OwnershipRequest, MoveRequest, MoveOutRequest, UnclaimRequest } from "../types";

const DEFAULT_PROPERTY_ASSETS = [
  "/assets/properties/apartment 1.avif",
  "/assets/properties/apartment 2.avif",
  "/assets/properties/apartment 3.avif",
  "/assets/properties/apartment 4.avif",
  "/assets/properties/apartment 5.jpg",
  "/assets/properties/apartment 6.jpg"
];

interface PropertiesViewProps {
  user: UserType;
  properties: Property[];
  token: string;
  onRefresh: () => void;
  onRequestOwnership: (propertyId: string) => void;
  onRequestMoveIn: (propertyId: string) => void;
  ownershipRequests?: OwnershipRequest[];
  moveRequests?: MoveRequest[];
  moveOutRequests?: MoveOutRequest[];
  unclaimRequests?: UnclaimRequest[];
  onCancelMoveIn?: (requestId: string) => void;
  onCancelOwnership?: (requestId: string) => void;
  onRequestMoveOut?: (propertyId: string) => void;
  onCancelMoveOut?: (requestId: string) => void;
  onFinalizeMoveOut?: (requestId: string) => void;
  onCancelUnclaim?: (requestId: string) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  user,
  properties,
  token,
  onRefresh,
  onRequestOwnership,
  onRequestMoveIn,
  ownershipRequests = [],
  moveRequests = [],
  moveOutRequests = [],
  unclaimRequests = [],
  onCancelMoveIn,
  onCancelOwnership,
  onRequestMoveOut,
  onCancelMoveOut,
  onFinalizeMoveOut,
  onCancelUnclaim
}) => {
  const [search, setSearch] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Property Form State (Admin Only)
  const [block, setBlock] = useState("Hill Tower");
  const [unit, setUnit] = useState("");
  const [bedrooms, setBedrooms] = useState(2);
  const [balconies, setBalconies] = useState(1);
  const [details, setDetails] = useState("");
  const [image, setImage] = useState("");
  const [adminSpecialPassword, setAdminSpecialPassword] = useState("");

  // Asset Images & Image Edit Modal State (Admin)
  const [propertyAssets, setPropertyAssets] = useState<string[]>(DEFAULT_PROPERTY_ASSETS);
  const [editingImageProp, setEditingImageProp] = useState<{ id: string; name: string; image: string } | null>(null);
  const [selectedImageForProp, setSelectedImageForProp] = useState("");
  const [imageSaveError, setImageSaveError] = useState<string | null>(null);

  // Tower Management State
  const [towers, setTowers] = useState<{ name: string; propertyCount: number; canDelete: boolean }[]>([]);
  const [showTowerManagement, setShowTowerManagement] = useState(false);
  const [newTowerName, setNewTowerName] = useState("");
  const [towerError, setTowerError] = useState<string | null>(null);

  // Delete Modal State
  const [deletingProperty, setDeletingProperty] = useState<{ id: string; name: string } | null>(null);
  const [deleteSecurityKey, setDeleteSecurityKey] = useState("");

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
        if (data.properties && data.properties.length > 0) {
          setPropertyAssets(data.properties);
        }
      }
    } catch (err) {
      console.error("Error fetching property assets:", err);
    }
  };

  const fetchTowers = async () => {
    try {
      const res = await fetch("/api/towers");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
        setTowers(data);
        if (data.length > 0 && !data.some((t: any) => t.name === block)) {
          setBlock(data[0].name);
        }
      }
    } catch (err) {
      console.error("Error fetching towers:", err);
    }
  };

  React.useEffect(() => {
    fetchTowers();
    fetchAssets();
  }, [properties]);

  const handleOpenChangeImage = (p: Property) => {
    const defaultImg = p.image || propertyAssets[0] || DEFAULT_PROPERTY_ASSETS[0];
    setEditingImageProp({ id: p.id, name: p.displayName, image: defaultImg });
    setSelectedImageForProp(defaultImg);
    setImageSaveError(null);
  };

  const handleSavePropertyImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImageProp) return;
    setImageSaveError(null);

    try {
      const res = await fetch(`/api/properties/${editingImageProp.id}/image`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image: selectedImageForProp })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Failed to update property image");

      setSuccess(`Image updated successfully for ${editingImageProp.name}!`);
      setEditingImageProp(null);
      onRefresh();
    } catch (err: any) {
      setImageSaveError(err.message);
    }
  };

  const handleAddTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTowerName.trim()) return;
    setTowerError(null);

    try {
      const res = await fetch("/api/towers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTowerName })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Failed to add tower");

      setBlock(data.name || newTowerName.trim());
      setNewTowerName("");
      setSuccess(`Tower "${data.name || newTowerName.trim()}" added to list!`);
      fetchTowers();
    } catch (err: any) {
      setTowerError(err.message);
    }
  };

  const handleDeleteTower = async (towerName: string) => {
    setTowerError(null);
    try {
      const res = await fetch(`/api/towers/${encodeURIComponent(towerName)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Failed to delete tower");

      setSuccess(`Tower "${towerName}" deleted successfully.`);
      fetchTowers();
    } catch (err: any) {
      setTowerError(err.message);
    }
  };

  const allTowerNames = Array.from(
    new Set([...towers.map((t) => t.name), ...properties.map((p) => p.block)])
  ).sort();
  const blocks = ["All", ...allTowerNames];

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (p.ownerName && p.ownerName.toLowerCase().includes(search.toLowerCase()));
    const matchesBlock = selectedBlock === "All" || p.block === selectedBlock;
    return matchesSearch && matchesBlock;
  });

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          block,
          unit,
          bedrooms,
          balconies,
          details,
          image,
          specialPassword: adminSpecialPassword
        })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Failed to create property");

      setSuccess(`Property ${data.displayName} created successfully!`);
      setShowCreateModal(false);
      setUnit("");
      setDetails("");
      setAdminSpecialPassword("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProperty = (id: string, name: string) => {
    setError(null);
    setDeleteSecurityKey("");
    setDeletingProperty({ id, name });
  };

  const handleConfirmDeleteProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingProperty) return;
    setError(null);

    try {
      const res = await fetch(`/api/properties/${deletingProperty.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-admin-password": deleteSecurityKey
        }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setSuccess(`Property ${deletingProperty.name} deleted.`);
      setDeletingProperty(null);
      setDeleteSecurityKey("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUnclaimProperty = async (id: string, name: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/properties/${id}/unclaim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Unclaim failed");

      setSuccess(`Unclaim request submitted for ${name}. Pending Admin approval.`);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const userHasAnyActiveMoveIn = moveRequests.some(
    (m) => m.userId === user.id && (m.status === "Pending Approvals" || m.status === "Approved - Waiting for Move-Out")
  );

  const canParticipate = user.role === "Owner" || user.role === "Tenant";

  return (
    <div className="space-y-6">
      {/* Top Action & Search Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-main">Properties Directory</h1>
          <p className="text-xs text-gray-600">Centralized apartment units, ownership records, and residency management</p>
        </div>

        {user.role === "Admin" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:brightness-90 transition-colors shadow-md flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Property</span>
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

      {/* Filter & Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-main shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search block, unit, or owner..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-main bg-base text-xs text-main focus:ring-2 focus:ring-[#A0522D] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-main">Block Filter:</span>
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="px-3 py-2 rounded-xl border border-main bg-base text-xs font-semibold text-main"
          >
            {blocks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Properties Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((p) => {
          const isOwnerOfProp = p.ownerId === user.id;
          const isResidentOfProp = p.residentList.includes(user.id);

          const pendingOwnership = ownershipRequests.find(
            (r) => r.propertyId === p.id && r.requesterId === user.id && r.status.startsWith("Pending")
          );

          const activeMoveIn = moveRequests.find(
            (m) =>
              m.toPropertyId === p.id &&
              m.userId === user.id &&
              m.status !== "Completed" &&
              m.status !== "Rejected" &&
              m.status !== "Cancelled"
          );

          const activeMoveOut = moveOutRequests.find(
            (m) =>
              m.propertyId === p.id &&
              m.userId === user.id &&
              m.status !== "Completed" &&
              m.status !== "Rejected" &&
              m.status !== "Cancelled"
          );

          const activeUnclaim = unclaimRequests.find(
            (u) => u.propertyId === p.id && u.ownerId === user.id && u.status === "Pending Admin Approval"
          );

          // User's move-in status for transition logic
          const userPendingMoveIn = moveRequests.find(
            (m) => m.userId === user.id && m.status === "Pending Approvals"
          );
          const userApprovedMoveIn = moveRequests.find(
            (m) => m.userId === user.id && m.status === "Approved - Waiting for Move-Out"
          );

          return (
            <div
              key={p.id}
              className="bg-surface rounded-3xl border border-main shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="h-44 relative overflow-hidden">
                  <img
                    src={p.image || propertyAssets[0] || DEFAULT_PROPERTY_ASSETS[0]}
                    alt={p.displayName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-primary text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                    {p.block}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5" /> {p.bedrooms} BHK
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-extrabold text-main">{p.displayName}</h3>
                      <p className="text-xs text-gray-500 font-medium">Unit: {p.unit}</p>
                    </div>
                    {p.ownerId ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                        Owned
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3E0] text-[#E65100]">
                        Unowned
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{p.details || "Luxury residential unit."}</p>

                  <div className="space-y-1.5 pt-2 border-t border-main/40 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1 font-semibold text-muted">
                        <User className="w-3.5 h-3.5 text-primary" /> Owner:
                      </span>
                      <span className="font-bold text-main">{p.ownerName}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1 font-semibold text-muted">
                        <UsersIcon className="w-3.5 h-3.5 text-primary" /> Residents:
                      </span>
                      <span className="font-bold text-main">
                        {p.residentDetails && p.residentDetails.length > 0
                          ? p.residentDetails.map((r) => r.name).join(", ")
                          : "None (Vacant)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-base border-t border-main/50 space-y-2">
                {user.role === "Admin" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenChangeImage(p)}
                      className="flex-1 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Change Image
                    </button>
                    <button
                      onClick={() => handleDeleteProperty(p.id, p.displayName)}
                      disabled={p.ownerId !== null || p.residentList.length > 0}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                        p.ownerId === null && p.residentList.length === 0
                          ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        p.ownerId !== null || p.residentList.length > 0
                          ? "Cannot delete: Must have no owner and zero active residents"
                          : "Delete Property"
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}

                {/* OWNER UNCLAIM / RELINQUISH */}
                {isOwnerOfProp && (
                  <>
                    {activeUnclaim ? (
                      <div className="space-y-1">
                        <div className="p-2 bg-orange-50 border border-orange-200 rounded-xl text-[11px] font-bold text-[#E65100] text-center">
                          Unclaim Pending Admin Approval
                        </div>
                        {onCancelUnclaim && (
                          <button
                            onClick={() => onCancelUnclaim(activeUnclaim.id)}
                            className="w-full py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold transition-colors"
                          >
                            Cancel Unclaim Request
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUnclaimProperty(p.id, p.displayName)}
                        className="w-full py-2 rounded-xl bg-orange-50 text-[#E65100] border border-orange-200 hover:bg-orange-100 text-xs font-bold transition-colors"
                      >
                        Surrender / Unclaim Property
                      </button>
                    )}
                  </>
                )}

                {/* OWNERSHIP REQUEST (Owner / Tenant - Ownerless Properties Only) */}
                {canParticipate && !isOwnerOfProp && p.ownerId === null && (
                  <>
                    {pendingOwnership ? (
                      <div className="space-y-1">
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 text-center">
                          Ownership Request Pending ({pendingOwnership.status})
                        </div>
                        {onCancelOwnership && (
                          <button
                            onClick={() => onCancelOwnership(pendingOwnership.id)}
                            className="w-full py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" /> Cancel Ownership Request
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => onRequestOwnership(p.id)}
                        className="w-full py-2 rounded-xl bg-surface text-muted border border-main hover:bg-highlight/40 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Key className="w-3.5 h-3.5 text-primary" /> Request Ownership
                      </button>
                    )}
                  </>
                )}

                {/* MOVE-OUT BUTTON FOR RESIDING USERS (Owner or Tenant residing) */}
                {isResidentOfProp && canParticipate && (
                  <>
                    {activeMoveOut ? (
                      <div className="space-y-1">
                        {activeMoveOut.status === "Approved - Ready to Finalize" ? (
                          <div className="space-y-1.5">
                            <div className="p-2 bg-green-50 border border-green-200 rounded-xl text-[11px] font-bold text-green-800 text-center">
                              Move-Out Approved!
                            </div>
                            {onFinalizeMoveOut && (
                              <button
                                onClick={() => onFinalizeMoveOut(activeMoveOut.id)}
                                className="w-full py-2 rounded-xl bg-[#2E7D32] text-white hover:bg-[#1B5E20] text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-md animate-pulse"
                              >
                                <LogOut className="w-3.5 h-3.5" /> Finalize Move-Out
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-[11px] font-bold text-blue-800 text-center">
                              Move-Out Request Pending
                            </div>
                            {onCancelMoveOut && (
                              <button
                                onClick={() => onCancelMoveOut(activeMoveOut.id)}
                                className="w-full py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                              >
                                <Ban className="w-3.5 h-3.5" /> Cancel Move-Out Request
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : userPendingMoveIn ? (
                      /* Resident requested move-in to another property, awaiting approvals */
                      <div className="space-y-1">
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 text-center flex items-center justify-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Move-In to <strong>{userPendingMoveIn.toPropertyName}</strong> Pending Approval</span>
                        </div>
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-gray-200 text-gray-500 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1 border border-gray-300"
                          title={`Move-out locks until your move-in request to ${userPendingMoveIn.toPropertyName} is approved by both the owner and admin.`}
                        >
                          <LogOut className="w-3.5 h-3.5 text-gray-400" /> Move-Out Locked (Awaiting New Unit Approval)
                        </button>
                      </div>
                    ) : userApprovedMoveIn ? (
                      /* Move-In approved! Ready to execute transition move-out */
                      <div className="space-y-1.5">
                        <div className="p-2 bg-green-50 border border-green-200 rounded-xl text-[11px] font-bold text-green-800 text-center flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>New Unit Move-In Approved! Execute Move-Out to complete transition.</span>
                        </div>
                        <button
                          onClick={() => onRequestMoveOut && onRequestMoveOut(p.id)}
                          className="w-full py-2 rounded-xl bg-[#2E7D32] text-white hover:bg-[#1B5E20] text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-md animate-pulse"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Execute Move-Out for Transition
                        </button>
                      </div>
                    ) : (
                      /* Direct Move-Out */
                      <button
                        onClick={() => onRequestMoveOut && onRequestMoveOut(p.id)}
                        className="w-full py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Request Move-Out
                      </button>
                    )}
                  </>
                )}

                {/* MOVE-IN BUTTON FOR NON-RESIDENTS (Owner or Tenant) */}
                {!isResidentOfProp && p.ownerId !== null && canParticipate && (
                  <>
                    {activeMoveIn ? (
                      <div className="space-y-1">
                        <div className="p-2 bg-[#E3F2FD] border border-[#90CAF9] rounded-xl text-[11px] font-bold text-[#1565C0] text-center">
                          Move-In Request Pending ({activeMoveIn.status})
                        </div>
                        {onCancelMoveIn && (
                          <button
                            onClick={() => onCancelMoveIn(activeMoveIn.id)}
                            className="w-full py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" /> Cancel Move-In Request
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => onRequestMoveIn(p.id)}
                        disabled={userHasAnyActiveMoveIn}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                          userHasAnyActiveMoveIn
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-primary text-white hover:brightness-90"
                        }`}
                        title={
                          userHasAnyActiveMoveIn
                            ? "You already have a pending move-in request for another property."
                            : "Request Move-In"
                        }
                      >
                        <Home className="w-3.5 h-3.5" />
                        {userHasAnyActiveMoveIn ? "Move Request Pending Elsewhere" : "Request Move-In"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Create Property Modal */}
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
              <h3 className="font-extrabold text-main text-lg">Add New Property</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-main">
                    Select Block / Tower Name <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTowerManagement(!showTowerManagement)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Manage / Add Towers
                  </button>
                </div>

                <select
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm font-bold text-main"
                >
                  {towers.length === 0 && <option value="Hill Tower">Hill Tower</option>}
                  {towers.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.propertyCount} {t.propertyCount === 1 ? "property" : "properties"})
                    </option>
                  ))}
                </select>

                {/* Inline Tower Directory & Management Panel */}
                {showTowerManagement && (
                  <div className="mt-3 p-3 bg-surface border border-main/80 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-main/40 pb-1.5">
                      <span className="text-xs font-extrabold text-main">Manage Tower Directory</span>
                      <button
                        type="button"
                        onClick={() => setShowTowerManagement(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {towerError && (
                      <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px]">
                        {towerError}
                      </div>
                    )}

                    {/* Add New Tower Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTowerName}
                        onChange={(e) => setNewTowerName(e.target.value)}
                        placeholder="New Tower Name (e.g. Stellar Tower)"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-main bg-white text-xs text-main"
                      />
                      <button
                        type="button"
                        onClick={handleAddTower}
                        className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 transition-colors shrink-0"
                      >
                        + Add Tower
                      </button>
                    </div>

                    {/* List Existing Towers with Delete Options */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Available Towers ({towers.length})
                      </span>
                      {towers.map((t) => (
                        <div
                          key={t.name}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-base text-xs"
                        >
                          <span className="font-bold text-main">{t.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-semibold">
                              {t.propertyCount} {t.propertyCount === 1 ? "prop" : "props"}
                            </span>
                            {t.canDelete ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteTower(t.name)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title={`Delete tower '${t.name}' (0 properties assigned)`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span
                                className="text-[10px] text-gray-400 italic px-1 cursor-not-allowed"
                                title={`Cannot delete tower: ${t.propertyCount} property/properties are assigned`}
                              >
                                (In Use)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">Unit Number</label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. G1, F204, S04"
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-main mb-1">Bedrooms (BHK)</label>
                  <input
                    type="number"
                    min="1"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-main mb-1">Balconies</label>
                  <input
                    type="number"
                    min="0"
                    value={balconies}
                    onChange={(e) => setBalconies(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">Property Description</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Details like modular kitchen, garden access..."
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main h-16"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Property Image (Select from Assets)
                </label>
                <select
                  value={image || propertyAssets[0] || DEFAULT_PROPERTY_ASSETS[0]}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm font-bold text-main"
                >
                  {propertyAssets.map((assetPath) => (
                    <option key={assetPath} value={assetPath}>
                      {assetPath.split("/").pop()}
                    </option>
                  ))}
                </select>
                <div className="mt-2 relative rounded-xl overflow-hidden border border-main h-40 bg-base">
                  <img
                    src={image || propertyAssets[0] || DEFAULT_PROPERTY_ASSETS[0]}
                    alt="Property Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    Preview Window
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Management Security Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={adminSpecialPassword}
                  onChange={(e) => setAdminSpecialPassword(e.target.value)}
                  placeholder="Enter security key"
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-90 transition-colors"
              >
                Create Property Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Property Modal */}
      {deletingProperty && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setDeletingProperty(null)}
        >
          <div 
            className="bg-surface rounded-2xl max-w-md w-full p-6 border border-main shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-main/40">
              <h3 className="font-bold text-main text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" /> Confirm Property Deletion
              </h3>
              <button
                onClick={() => setDeletingProperty(null)}
                className="p-1 hover:bg-base rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-main">
              Are you sure you want to delete <strong className="text-primary">{deletingProperty.name}</strong>? This action cannot be undone.
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDeleteProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Management Security Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={deleteSecurityKey}
                  onChange={(e) => setDeleteSecurityKey(e.target.value)}
                  placeholder="Enter security key"
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingProperty(null)}
                  className="px-4 py-2 rounded-xl border border-main text-main font-semibold text-sm hover:bg-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Change Property Image Modal */}
      {editingImageProp && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setEditingImageProp(null)}
        >
          <div 
            className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full border border-main shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-main">
              <h3 className="font-extrabold text-main text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" /> Change Property Image
              </h3>
              <button
                onClick={() => setEditingImageProp(null)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              Updating image display for <strong className="text-primary">{editingImageProp.name}</strong>.
            </p>

            {imageSaveError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageSaveError}</span>
              </div>
            )}

            <form onSubmit={handleSavePropertyImage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Choose Image from Assets Folder <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedImageForProp}
                  onChange={(e) => setSelectedImageForProp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm font-bold text-main"
                >
                  {propertyAssets.map((assetPath) => (
                    <option key={assetPath} value={assetPath}>
                      {assetPath.split("/").pop()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Short Window Image Preview */}
              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Selected Image Short Preview
                </label>
                <div className="relative h-44 rounded-2xl overflow-hidden border border-main bg-black/5 shadow-inner">
                  <img
                    src={selectedImageForProp}
                    alt="Asset Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {selectedImageForProp.split("/").pop()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingImageProp(null)}
                  className="px-4 py-2 rounded-xl border border-main text-main font-semibold text-sm hover:bg-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-90 transition-colors shadow-md"
                >
                  Save Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
