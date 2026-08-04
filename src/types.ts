export type UserRole = "Admin" | "Owner" | "Tenant" | "Staff";
export type UserStatus = "Pending" | "Approved" | "Rejected" | "Moved Out" | "Suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  dateOfBirth: string;
  gender: string;
  currentPropertyId?: string | null;
  propertiesOwned?: string[];
  requestedPropertyId?: string | null;
  requestedPropertyIds?: string[];
  livesInside?: boolean;
  residencePropertyId?: string | null;
  ownerApproved?: boolean;
  adminApproved?: boolean;
  createdAt: string;
}

export interface Property {
  id: string;
  block: string;
  unit: string;
  displayName: string;
  ownerId: string | null;
  ownerName?: string;
  ownerEmail?: string | null;
  residentList: string[];
  residentDetails?: { id: string; name: string; role: string }[];
  bedrooms: number;
  balconies: number;
  details?: string;
  image?: string;
  createdAt: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyDisplayName: string;
  createdBy: string;
  creatorName: string;
  creatorRole: string;
  issueDescription: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Waiting for Admin Approval" | "Completed";
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdDate: string;
  completedDate?: string | null;
}

export interface Amenity {
  id: string;
  name: string;
  type: "bookable" | "common";
  category: string;
  operatingHours: string;
  description: string;
  image: string;
}

export interface AmenityBooking {
  id: string;
  amenityId: string;
  amenityName: string;
  userId: string;
  userName: string;
  userRole: string;
  propertyDisplayName: string;
  startTime: string;
  endTime: string;
  status: "Booked" | "Completed" | "Cancelled";
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface OwnershipRequest {
  id: string;
  propertyId: string;
  propertyDisplayName: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  currentOwnerId: string | null;
  status: "Pending Admin Approval" | "Pending Owner Approval" | "Approved" | "Rejected" | "Cancelled";
  adminApproved: boolean;
  ownerApproved: boolean;
  createdAt: string;
}

export interface MoveRequest {
  id: string;
  userId: string;
  userName: string;
  fromPropertyId: string | null;
  fromPropertyName: string | null;
  toPropertyId: string;
  toPropertyName: string;
  status: "Pending Approvals" | "Approved - Waiting for Move-Out" | "Completed" | "Rejected" | "Cancelled";
  adminApproved: boolean;
  newOwnerApproved: boolean;
  createdAt: string;
}

export interface MoveOutRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  propertyId: string;
  propertyDisplayName: string;
  status: "Pending Approvals" | "Approved - Ready to Finalize" | "Completed" | "Rejected" | "Cancelled";
  adminApproved: boolean;
  ownerApproved: boolean;
  createdAt: string;
}

export interface UnclaimRequest {
  id: string;
  propertyId: string;
  propertyDisplayName: string;
  ownerId: string;
  ownerName: string;
  status: "Pending Admin Approval" | "Approved" | "Rejected" | "Cancelled";
  createdAt: string;
}
