import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  User,
  Shield,
  X,
  Sparkles,
  Info,
  Image as ImageIcon
} from "lucide-react";
import { Amenity, AmenityBooking, User as UserType } from "../types";

const DEFAULT_AMENITY_ASSETS = [
  "/assets/amenities/badminton 1.avif",
  "/assets/amenities/cricket 1.avif",
  "/assets/amenities/cricket 2.jpg",
  "/assets/amenities/gym 1.avif",
  "/assets/amenities/indoor gaming 1.png",
  "/assets/amenities/party hall 1.avif",
  "/assets/amenities/party hall 2.jpg",
  "/assets/amenities/swimming pool 1.avif",
  "/assets/amenities/swimming pool 2.avif",
  "/assets/amenities/swimming pool 3.png"
];

interface AmenitiesViewProps {
  user: UserType;
  amenities: Amenity[];
  bookings: AmenityBooking[];
  token: string;
  onRefresh: () => void;
}

// Quarter-hour time options helper
const QUARTER_HOUR_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    QUARTER_HOUR_OPTIONS.push(`${hh}:${mm}`);
  }
}

const AMENITY_CATEGORIES = [
  "Health & Fitness",
  "Sports",
  "Events",
  "Relaxation",
  "Indoor Gaming",
  "Custom Category"
];

const TIME_12H_OPTIONS = [
  "05:00 AM", "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM",
  "09:00 PM", "10:00 PM", "11:00 PM", "11:59 PM"
];

export const AmenitiesView: React.FC<AmenitiesViewProps> = ({
  user,
  amenities,
  bookings,
  token,
  onRefresh
}) => {
  const canBookAmenities = user.role === "Admin" || (user.status === "Approved" && user.currentPropertyId != null);

  const [activeTab, setActiveTab] = useState<"explore" | "my-bookings">("explore");
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTimeStr, setStartTimeStr] = useState("09:00");
  const [endTimeStr, setEndTimeStr] = useState("10:00");
  
  // Payment State
  const [showPaymentMock, setShowPaymentMock] = useState(false);
  const [amountToPay, setAmountToPay] = useState(0);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Create Amenity Form State (Admin)
  const [amenityName, setAmenityName] = useState("");
  const [amenityType, setAmenityType] = useState<"bookable" | "common">("bookable");
  const [categoryChoice, setCategoryChoice] = useState("Sports");
  const [customCategory, setCustomCategory] = useState("");
  const [openTime12h, setOpenTime12h] = useState("06:00 AM");
  const [closeTime12h, setCloseTime12h] = useState("10:00 PM");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [adminSpecialPassword, setAdminSpecialPassword] = useState("");

  // Delete Modal State
  const [deletingAmenity, setDeletingAmenity] = useState<{ id: string; name: string } | null>(null);
  const [deleteSecurityKey, setDeleteSecurityKey] = useState("");

  // Asset Images & Image Edit Modal State (Admin)
  const [amenityAssets, setAmenityAssets] = useState<string[]>(DEFAULT_AMENITY_ASSETS);
  const [editingImageAmenity, setEditingImageAmenity] = useState<{ id: string; name: string; image: string } | null>(null);
  const [selectedImageForAmenity, setSelectedImageForAmenity] = useState("");
  const [imageSaveError, setImageSaveError] = useState<string | null>(null);

  const fetchAmenityAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
        if (data.amenities && data.amenities.length > 0) {
          setAmenityAssets(data.amenities);
        }
      }
    } catch (err) {
      console.error("Error fetching amenity assets:", err);
    }
  };

  React.useEffect(() => {
    fetchAmenityAssets();
  }, []);

  const handleOpenChangeImage = (a: Amenity) => {
    const defaultImg = a.image || amenityAssets[0] || DEFAULT_AMENITY_ASSETS[0];
    setEditingImageAmenity({ id: a.id, name: a.name, image: defaultImg });
    setSelectedImageForAmenity(defaultImg);
    setImageSaveError(null);
  };

  const handleSaveAmenityImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImageAmenity) return;
    setImageSaveError(null);

    try {
      const res = await fetch(`/api/amenities/${editingImageAmenity.id}/image`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image: selectedImageForAmenity })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Failed to update amenity image");

      setSuccess(`Image updated successfully for ${editingImageAmenity.name}!`);
      setEditingImageAmenity(null);
      onRefresh();
    } catch (err: any) {
      setImageSaveError(err.message);
    }
  };

  const getUpcomingBookingsForAmenity = (amenityId: string) => {
    const now = new Date();
    return bookings.filter(
      (b) => b.amenityId === amenityId && b.status === "Booked" && new Date(b.endTime) > now
    );
  };

  const checkTimeValidity = () => {
    if (!bookingDate || !startTimeStr || !endTimeStr || !selectedAmenity) return { valid: false, error: "Invalid input" };
    
    const start = new Date(`${bookingDate}T${startTimeStr}:00`);
    const end = new Date(`${bookingDate}T${endTimeStr}:00`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { valid: false, error: "Invalid date/time" };
    if (start >= end) return { valid: false, error: "Start time must be before end time" };
    
    // Check past booking
    if (start < new Date()) return { valid: false, error: "Cannot book in the past" };
    
    const dur = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (dur < 1 || dur > 4) return { valid: false, error: "Duration must be 1 to 4 hours" };

    // Overlap check
    const upcoming = getUpcomingBookingsForAmenity(selectedAmenity.id);
    const hasOverlap = upcoming.some(b => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < end && bEnd > start;
    });
    if (hasOverlap) return { valid: false, error: "Time slot overlaps with an existing reservation" };

    // Operating hours check
    const opHours = selectedAmenity.operatingHours;
    if (opHours) {
      const parts = opHours.split("-").map(s => s.trim());
      if (parts.length === 2) {
        const parseTime = (ts: string) => {
          const match = ts.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
          if (!match) return null;
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const ampm = match[3] ? match[3].toUpperCase() : null;
          if (ampm === "PM" && h < 12) h += 12;
          if (ampm === "AM" && h === 12) h = 0;
          return h * 60 + m;
        };
        const openMins = parseTime(parts[0]);
        const closeMins = parseTime(parts[1]);
        if (openMins !== null && closeMins !== null) {
          const [sh, sm] = startTimeStr.split(":").map(Number);
          const [eh, em] = endTimeStr.split(":").map(Number);
          const startMins = sh * 60 + sm;
          let endMins = eh * 60 + em;
          if (endMins === 0 && end.getDate() !== start.getDate()) endMins = 1440;
          else if (endMins <= startMins) endMins += 1440;

          let adjClose = closeMins;
          if (adjClose <= openMins) adjClose += 1440;

          if (startMins < openMins || endMins > adjClose) {
             return { valid: false, error: `Outside operating hours (${opHours})` };
          }
        }
      }
    }

    return { valid: true, error: "" };
  };

  const calculateDurationHours = () => {
    if (!bookingDate || !startTimeStr || !endTimeStr) return 0;
    const start = new Date(`${bookingDate}T${startTimeStr}:00`);
    const end = new Date(`${bookingDate}T${endTimeStr}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return 0;
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const calculateAmount = (amenityName: string, durationHours: number) => {
    const name = amenityName.toLowerCase();
    let rate = 0;
    if (name.includes("party hall")) rate = 1000;
    else if (name.includes("cricket")) rate = 700;
    else if (name.includes("badminton")) rate = 150;
    return rate * durationHours;
  };

  const openBookingModal = (a: Amenity) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    let nextHour = now.getHours() + 1;
    let endNextHour = nextHour + 1;
    if (nextHour >= 24) {
      nextHour = 9;
      endNextHour = 10;
    }
    const startStr = `${String(nextHour).padStart(2, "0")}:00`;
    const endStr = `${String(endNextHour).padStart(2, "0")}:00`;

    setSelectedAmenity(a);
    setBookingDate(todayStr);
    setStartTimeStr(startStr);
    setEndTimeStr(endStr);
    setError(null);
    setSuccess(null);
    setShowBookingModal(true);
  };

  const handleBookAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity) return;
    
    const validity = checkTimeValidity();
    if (!validity.valid) {
      setError(validity.error);
      return;
    }

    setError(null);
    setSuccess(null);

    const startISO = new Date(`${bookingDate}T${startTimeStr}:00`).toISOString();
    const endISO = new Date(`${bookingDate}T${endTimeStr}:00`).toISOString();
    
    const durationHours = calculateDurationHours();
    const amount = calculateAmount(selectedAmenity.name, durationHours);

    const bookingPayload = {
      amenityId: selectedAmenity.id,
      startTime: startISO,
      endTime: endISO,
      localStartTime: startTimeStr,
      localEndTime: endTimeStr
    };

    if (amount > 0) {
      setAmountToPay(amount);
      setPendingBookingData(bookingPayload);
      setShowPaymentMock(true);
    } else {
      finalizeBooking(bookingPayload);
    }
  };

  const finalizeBooking = async (bookingPayload: any) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookingPayload)
      });

      const data = await res.json().catch(() => ({ error: "Server returned an unexpected response." }));
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setSuccess(`Successfully reserved ${selectedAmenity?.name}!`);
      setShowBookingModal(false);
      
      if (amountToPay > 0) {
        setPaymentSuccessful(true);
      } else {
        setShowPaymentMock(false);
        setPendingBookingData(null);
      }
      
      onRefresh();
    } catch (err: any) {
      setError(err.message);
      setShowPaymentMock(false);
      setPendingBookingData(null);
      setPaymentSuccessful(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsProcessingPayment(true);
    // Simulate network delay for payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      if (pendingBookingData) {
        finalizeBooking(pendingBookingData);
      }
    }, 1500);
  };

  const handleCancelBooking = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      setSuccess("Booking cancelled.");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const finalCategory = categoryChoice === "Custom Category" ? customCategory : categoryChoice;
      const finalOperatingHours = `${openTime12h} - ${closeTime12h}`;

      const res = await fetch("/api/amenities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: amenityName,
          type: amenityType,
          category: finalCategory,
          operatingHours: finalOperatingHours,
          description,
          image,
          specialPassword: adminSpecialPassword
        })
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Failed to create amenity");

      setSuccess(`Amenity ${data.name} added successfully!`);
      setShowCreateModal(false);
      setAdminSpecialPassword("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAmenity = (id: string, name: string) => {
    setError(null);
    setDeleteSecurityKey("");
    setDeletingAmenity({ id, name });
  };

  const handleConfirmDeleteAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingAmenity) return;
    setError(null);

    try {
      const res = await fetch(`/api/amenities/${deletingAmenity.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-admin-password": deleteSecurityKey
        }
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.indexOf("application/json") !== -1 ? await res.json() : { error: "Network or Server Error" };
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setSuccess(`Amenity ${deletingAmenity.name} deleted.`);
      setDeletingAmenity(null);
      setDeleteSecurityKey("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const myBookings = bookings.filter((b) => b.userId === user.id || user.role === "Admin");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-main">Community Amenities</h1>
          <p className="text-xs text-gray-600">Reserve courts, halls, turfs, and access shared recreational areas</p>
        </div>

        <div className="flex items-center gap-2">
          {user.role === "Admin" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:brightness-90 transition-colors shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Amenity
            </button>
          )}

          <div className="bg-surface p-1 rounded-2xl border border-main flex text-xs font-bold">
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === "explore" ? "bg-primary text-white" : "text-main hover:bg-highlight/30"
              }`}
            >
              Explore Amenities
            </button>
            <button
              onClick={() => setActiveTab("my-bookings")}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === "my-bookings" ? "bg-primary text-white" : "text-main hover:bg-highlight/30"
              }`}
            >
              Booking History ({myBookings.length})
            </button>
          </div>
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

      {/* EXPLORE AMENITIES VIEW */}
      {activeTab === "explore" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {amenities.map((a) => {
            const upcomingBookings = getUpcomingBookingsForAmenity(a.id);
            return (
              <div
                key={a.id}
                className="bg-surface rounded-3xl border border-main shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 relative overflow-hidden">
                    <img
                      src={a.image || amenityAssets[0] || DEFAULT_AMENITY_ASSETS[0]}
                      alt={a.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                      {a.category}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {a.type === "bookable" ? "Bookable" : "Common Access"}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-xl font-extrabold text-main">{a.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{a.operatingHours}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed pt-1">{a.description}</p>

                    {/* Booked Slots Visibility for All Users */}
                    {a.type === "bookable" && (
                      <div className="mt-3 pt-3 border-t border-main/30">
                        <span className="text-[11px] font-bold text-main flex items-center gap-1 mb-1.5">
                          <Calendar className="w-3 h-3 text-primary" /> Reserved Timings ({upcomingBookings.length}):
                        </span>
                        {upcomingBookings.length === 0 ? (
                          <p className="text-[10px] text-gray-400 italic">No upcoming reserved slots</p>
                        ) : (
                          <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                            {upcomingBookings.map((b) => (
                              <div
                                key={b.id}
                                className="text-[10px] bg-base p-1.5 rounded-lg border border-main/40 flex justify-between items-center text-muted"
                              >
                                <span>
                                  {new Date(b.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}:{" "}
                                  {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                                  {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <span className="font-bold text-gray-500">({b.userName})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-base border-t border-main/50 flex gap-2">
                  {a.type === "bookable" ? (
                    !canBookAmenities ? (
                      <button
                        disabled
                        className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-500 font-bold text-xs cursor-not-allowed text-center"
                        title="You must be a residing tenant or owner to book amenities."
                      >
                        Requires Active Residency
                      </button>
                    ) : (
                      <button
                        onClick={() => openBookingModal(a)}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:brightness-90 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <Calendar className="w-4 h-4" /> Reserve Slot
                      </button>
                    )
                  ) : (
                    <div className="flex-1 py-2.5 text-center text-xs font-bold bg-white text-[#6FAE7B] rounded-xl shadow-xs">
                      Open Access
                    </div>
                  )}

                  {user.role === "Admin" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenChangeImage(a)}
                        className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition-colors"
                        title="Change Amenity Image"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAmenity(a.id, a.name)}
                        className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                        title="Delete Amenity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOOKING HISTORY TABLE */}
      {activeTab === "my-bookings" && (
        <div className="bg-surface rounded-3xl border border-main shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-main bg-base">
            <h3 className="font-extrabold text-main text-base">Booking Reservations & History</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-main">
              <thead className="bg-surface border-b border-main uppercase text-[10px] font-extrabold text-muted tracking-wider">
                <tr>
                  <th className="p-4">Amenity</th>
                  <th className="p-4">Resident</th>
                  <th className="p-4">Property</th>
                  <th className="p-4">Start Time</th>
                  <th className="p-4">End Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main/30">
                {myBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No amenity bookings found.
                    </td>
                  </tr>
                ) : (
                  myBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-base/50 transition-colors">
                      <td className="p-4 font-bold text-main">{b.amenityName}</td>
                      <td className="p-4 font-semibold">{b.userName}</td>
                      <td className="p-4 font-medium text-gray-600">{b.propertyDisplayName}</td>
                      <td className="p-4">{new Date(b.startTime).toLocaleString()}</td>
                      <td className="p-4">{new Date(b.endTime).toLocaleString()}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === "Booked"
                              ? "status-booked"
                              : b.status === "Completed"
                              ? "status-approved"
                              : "status-rejected"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {b.status === "Booked" && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold border border-red-200 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reserve Slot Modal */}
      {showBookingModal && selectedAmenity && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowBookingModal(false);
            setSelectedAmenity(null);
            setError(null);
          }}
        >
          <div 
            className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full border border-main shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-main">
              <h3 className="font-extrabold text-main text-lg">Reserve {selectedAmenity.name}</h3>
              <button onClick={() => setShowBookingModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-base p-3 rounded-2xl border border-main/50 text-xs text-black flex gap-2">
              <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-bold">Booking Rules & Quota Notice</p>
                <p className="text-[11px] mt-0.5">
                  - Times selected in 15-minute intervals.<br />
                  - Booking duration must be between <strong>1 hour</strong> and <strong>4 hours</strong>.<br />
                  - Maximum 6 hours per calendar week per amenity.
                </p>
              </div>
            </div>

            {/* Upcoming Reserved Slots List */}
            {getUpcomingBookingsForAmenity(selectedAmenity.id).length > 0 && (
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-1">Already Reserved Slots:</span>
                <ul className="space-y-1 max-h-20 overflow-y-auto pr-1 text-[11px]">
                  {getUpcomingBookingsForAmenity(selectedAmenity.id).map((b) => (
                    <li key={b.id} className="flex justify-between">
                      <span>
                        {new Date(b.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}:{" "}
                        {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-semibold text-amber-700">({b.userName})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleBookAmenity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-main mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-main mb-1">Start Time (15m)</label>
                  <select
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                  >
                    {QUARTER_HOUR_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-main mb-1">End Time (15m)</label>
                  <select
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                  >
                    {QUARTER_HOUR_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Duration & Price Calculation */}
              {(() => {
                const dur = calculateDurationHours();
                const validity = checkTimeValidity();
                const isValid = validity.valid;
                const amount = calculateAmount(selectedAmenity.name, dur);
                return (
                  <div className={`p-3 rounded-xl border text-xs font-bold flex flex-col gap-2 ${
                    isValid ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="shrink-0">Duration: {dur.toFixed(2)} hrs</span>
                      <span className="text-right">{isValid ? "✓ Valid time slot" : `✕ ${validity.error}`}</span>
                    </div>
                    {isValid && amount > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-green-200/50">
                        <span className="text-gray-600 font-semibold">Total Amount (₹):</span>
                        <span className="text-lg text-green-900">₹{amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
              <button
                type="submit"
                disabled={!checkTimeValidity().valid}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors shadow-md ${
                  checkTimeValidity().valid
                    ? "bg-primary text-white hover:brightness-90"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {calculateAmount(selectedAmenity.name, calculateDurationHours()) > 0 ? "Proceed to Payment" : "Confirm Reservation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Mock Payment Modal */}
      {showPaymentMock && selectedAmenity && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4 font-sans">
          <div className="bg-white w-full max-w-[380px] rounded-lg overflow-hidden shadow-2xl flex flex-col h-[600px] max-h-[90vh]">
            {/* Razorpay Header */}
            <div className="bg-[#02042b] text-white p-5 flex flex-col relative shrink-0">
              <button 
                onClick={() => {
                  if (!isProcessingPayment) {
                    setShowPaymentMock(false);
                    setPaymentSuccessful(false);
                    setPendingBookingData(null);
                  }
                }} 
                disabled={isProcessingPayment} 
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                  <div className="w-6 h-6 bg-blue-600 rounded-sm font-bold text-white flex items-center justify-center text-xs">R</div>
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Resident Portal</h3>
                  <p className="text-white/70 text-xs">Test Mode</p>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="text-white/90 text-sm">Amount to pay</div>
                <div className="text-2xl font-bold tracking-tight">₹{amountToPay.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto bg-gray-50 relative">
              {paymentSuccessful ? (
                <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center space-y-4 p-6 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
                  <p className="text-sm text-gray-500 pb-4">Your reservation for <span className="font-semibold text-gray-700">{selectedAmenity.name}</span> is confirmed. You can safely close this window now.</p>
                  <button
                    onClick={() => {
                      setShowPaymentMock(false);
                      setPaymentSuccessful(false);
                      setPendingBookingData(null);
                    }}
                    className="w-full bg-[#02042b] text-white font-bold py-3.5 rounded-lg hover:bg-[#02042b]/90 transition-colors shadow-sm text-sm"
                  >
                    Close Window
                  </button>
                </div>
              ) : isProcessingPayment ? (
                <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-[#3395ff]/20 border-t-[#3395ff] rounded-full animate-spin"></div>
                  <div className="text-sm font-semibold text-gray-700">Processing Payment...</div>
                  <div className="text-xs text-gray-400">Please do not refresh the page</div>
                </div>
              ) : (
                <div className="p-4 space-y-4 pb-20">
                  {/* Contact Info */}
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Details</div>
                      <div className="text-xs text-blue-500 font-medium cursor-pointer">Edit</div>
                    </div>
                    <div className="text-sm text-gray-800 font-medium">{user.email}</div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Preferred Payment Methods</div>
                    <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100">
                      
                      {/* UPI */}
                      <div className="block cursor-pointer" onClick={() => setPaymentMethod('upi')}>
                        <div className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group ${paymentMethod === 'upi' ? 'bg-blue-50/30' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center overflow-hidden p-1 shrink-0 bg-white">
                              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-800">UPI</div>
                              <div className="text-xs text-gray-500">Google Pay, PhonePe, Paytm & more</div>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'upi' ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                             {paymentMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                          </div>
                        </div>
                      </div>

                      {/* Card */}
                      <div className="block cursor-pointer" onClick={() => setPaymentMethod('card')}>
                        <div className={`flex flex-col bg-white hover:bg-gray-50 transition-colors ${paymentMethod === 'card' ? 'bg-blue-50/30' : ''}`}>
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center overflow-hidden bg-white text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-800">Card</div>
                                <div className="text-xs text-gray-500">Visa, MasterCard, RuPay & more</div>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                               {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                            </div>
                          </div>
                          
                          {/* Card Form inside accordion */}
                          {paymentMethod === 'card' && (
                            <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
                            <div className="bg-white rounded border border-gray-200 p-3 space-y-3 shadow-sm cursor-auto">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Card Number</label>
                                <div className="relative">
                                  <input type="text" placeholder="4111 1111 1111 1111" className="w-full text-sm py-2 px-3 border-b border-gray-300 focus:border-blue-500 outline-none placeholder:text-gray-300 font-mono" />
                                  <div className="absolute right-2 top-2 flex gap-1">
                                    <div className="w-8 h-5 bg-gray-100 rounded border border-gray-200"></div>
                                    <div className="w-8 h-5 bg-gray-100 rounded border border-gray-200"></div>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Expiry</label>
                                  <input type="text" placeholder="MM / YY" className="w-full text-sm py-2 px-3 border-b border-gray-300 focus:border-blue-500 outline-none placeholder:text-gray-300 font-mono" />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">CVV</label>
                                  <div className="relative">
                                    <input type="password" placeholder="123" maxLength={4} className="w-full text-sm py-2 px-3 border-b border-gray-300 focus:border-blue-500 outline-none placeholder:text-gray-300 font-mono" />
                                    <svg className="w-4 h-4 text-gray-400 absolute right-2 top-2.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                  </div>
                                </div>
                              </div>
                              <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" defaultChecked />
                                  <span className="text-xs text-gray-600 group-hover:text-gray-900">Save card securely for future payments</span>
                                </label>
                              </div>
                            </div>
                          </div>
                          )}
                        </div>
                      </div>

                      {/* Netbanking */}
                      <div className="block cursor-pointer" onClick={() => setPaymentMethod('netbanking')}>
                        <div className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group ${paymentMethod === 'netbanking' ? 'bg-blue-50/30' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center overflow-hidden bg-white text-gray-400">
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-800">Netbanking</div>
                              <div className="text-xs text-gray-500">All Indian banks</div>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'netbanking' ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                             {paymentMethod === 'netbanking' && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Pay Button */}
            {!isProcessingPayment && !paymentSuccessful && (
              <div className="p-4 bg-white border-t border-gray-200 shrink-0 space-y-3 absolute bottom-0 left-0 right-0 z-20">
                <button
                  onClick={handlePaymentSuccess}
                  className="w-full bg-[#3395ff] text-white font-bold py-3.5 rounded-lg hover:bg-[#2b7fdb] transition-colors flex justify-center items-center shadow-sm text-sm"
                >
                  Pay ₹{amountToPay.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </button>
                <div className="flex justify-center items-center gap-1 opacity-50">
                  <Shield className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">Secured by <span className="text-[#3395ff] tracking-tighter">Razorpay</span></span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Admin Add Amenity Modal */}
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
              <h3 className="font-extrabold text-main text-lg">Add New Amenity</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateAmenity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-main mb-1">Amenity Name</label>
                <input
                  type="text"
                  required
                  value={amenityName}
                  onChange={(e) => setAmenityName(e.target.value)}
                  placeholder="e.g. Cricket Turf 2, Galaxy Party Hall"
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-main mb-1">Type</label>
                  <select
                    value={amenityType}
                    onChange={(e: any) => setAmenityType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                  >
                    <option value="bookable">Bookable</option>
                    <option value="common">Common Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-main mb-1">Category</label>
                  <select
                    value={categoryChoice}
                    onChange={(e) => setCategoryChoice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-main bg-base text-xs font-bold text-main"
                  >
                    {AMENITY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {categoryChoice === "Custom Category" && (
                <div>
                  <label className="block text-xs font-bold text-main mb-1">Custom Category Name</label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Indoor Console Gaming"
                    className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-main mb-1">Operating Hours</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-500 font-semibold block mb-0.5">Opening Time</span>
                    <select
                      value={openTime12h}
                      onChange={(e) => setOpenTime12h(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-main bg-base text-xs font-semibold text-main"
                    >
                      {TIME_12H_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 font-semibold block mb-0.5">Closing Time</span>
                    <select
                      value={closeTime12h}
                      onChange={(e) => setCloseTime12h(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-main bg-base text-xs font-semibold text-main"
                    >
                      {TIME_12H_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Selected Operating Hours: <strong>{openTime12h} - {closeTime12h}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the amenity facilities..."
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm text-main h-16"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Amenity Image (Select from Assets)
                </label>
                <select
                  value={image || amenityAssets[0] || DEFAULT_AMENITY_ASSETS[0]}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm font-bold text-main"
                >
                  {amenityAssets.map((assetPath) => (
                    <option key={assetPath} value={assetPath}>
                      {assetPath.split("/").pop()}
                    </option>
                  ))}
                </select>
                <div className="mt-2 relative rounded-xl overflow-hidden border border-main h-40 bg-base">
                  <img
                    src={image || amenityAssets[0] || DEFAULT_AMENITY_ASSETS[0]}
                    alt="Amenity Preview"
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
                Add Amenity Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Amenity Modal */}
      {deletingAmenity && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setDeletingAmenity(null)}
        >
          <div 
            className="bg-surface rounded-2xl max-w-md w-full p-6 border border-main shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-main/40">
              <h3 className="font-bold text-main text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" /> Confirm Amenity Deletion
              </h3>
              <button
                onClick={() => setDeletingAmenity(null)}
                className="p-1 hover:bg-base rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-main">
              Are you sure you want to delete <strong className="text-primary">{deletingAmenity.name}</strong>? This action cannot be undone.
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDeleteAmenity} className="space-y-4">
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
                  onClick={() => setDeletingAmenity(null)}
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

      {/* Admin Change Amenity Image Modal */}
      {editingImageAmenity && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setEditingImageAmenity(null)}
        >
          <div 
            className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full border border-main shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-main">
              <h3 className="font-extrabold text-main text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" /> Change Amenity Image
              </h3>
              <button
                onClick={() => setEditingImageAmenity(null)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              Updating image display for <strong className="text-primary">{editingImageAmenity.name}</strong>.
            </p>

            {imageSaveError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageSaveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAmenityImage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-main mb-1">
                  Choose Image from Assets Folder <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedImageForAmenity}
                  onChange={(e) => setSelectedImageForAmenity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-main bg-base text-sm font-bold text-main"
                >
                  {amenityAssets.map((assetPath) => (
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
                    src={selectedImageForAmenity}
                    alt="Asset Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {selectedImageForAmenity.split("/").pop()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingImageAmenity(null)}
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
