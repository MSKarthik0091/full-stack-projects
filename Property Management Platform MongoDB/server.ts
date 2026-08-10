import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  syncDbWithSeed,
  loadDataFromDb,
  persistUser,
  persistProperty,
  deletePropertyFromDb,
  persistAmenity,
  deleteAmenityFromDb,
  persistMaintenance,
  persistBooking,
  persistNotification,
  persistOwnershipRequest,
  persistMoveRequest,
  persistMoveOutRequest,
  persistUnclaimRequest
} from "./db.ts";

const __dirname = path.resolve();

const JWT_SECRET = process.env.JWT_SECRET || "property-management-secret-key-2026";

const app = express();
app.use(express.json());
app.use("/assets", express.static(path.join(process.cwd(), "assets")));

// In-Memory Database initialized with default seeded data
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  plainPassword?: string;
  role: "Admin" | "Owner" | "Tenant" | "Staff";
  status: "Pending" | "Approved" | "Rejected" | "Moved Out" | "Suspended";
  management_security_key?: string;
  plainManagementSecurityKey?: string;
  dateOfBirth?: string;
  gender?: string;
  propertiesOwned?: string[]; // Property IDs
  currentPropertyId?: string | null; // Property ID where residing
  requestedPropertyId?: string | null;
  requestedPropertyIds?: string[];
  livesInside?: boolean;
  residencePropertyId?: string | null;
  ownerApproved?: boolean;
  adminApproved?: boolean;
  isDeleted?: boolean;
  createdAt: string;
}

interface Property {
  id: string;
  block: string;
  unit: string;
  displayName: string;
  ownerId: string | null;
  residentList: string[]; // User IDs (Tenants and Resident Owners)
  bedrooms: number;
  balconies: number;
  details?: string;
  image?: string;
  createdAt: string;
}

interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyDisplayName: string;
  createdBy: string; // User ID
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

interface Amenity {
  id: string;
  name: string;
  type: "bookable" | "common";
  category: string;
  operatingHours: string;
  description: string;
  image: string;
  isDeleted?: boolean;
}

interface AmenityBooking {
  id: string;
  amenityId: string;
  amenityName: string;
  userId: string;
  userName: string;
  userRole: string;
  propertyDisplayName: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  status: "Booked" | "Completed" | "Cancelled";
  createdAt: string;
}

interface NotificationItem {
  id: string;
  userId: string; // Target user or "ALL_ADMINS" or "ALL_STAFF"
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface OwnershipRequest {
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

interface MoveRequest {
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

interface MoveOutRequest {
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

interface UnclaimRequest {
  id: string;
  propertyId: string;
  propertyDisplayName: string;
  ownerId: string;
  ownerName: string;
  status: "Pending Admin Approval" | "Approved" | "Rejected" | "Cancelled";
  createdAt: string;
}

// Data Stores
const users: User[] = [
  {
    id: "u-admin",
    name: "System Admin",
    email: "admin@complex.com",
    passwordHash: bcrypt.hashSync("admin123", 10),
    plainPassword: "admin123",
    role: "Admin",
    status: "Approved",
    management_security_key: bcrypt.hashSync(process.env.MANAGEMENT_SECURITY_KEY || "special123", 10),
    plainManagementSecurityKey: process.env.MANAGEMENT_SECURITY_KEY || "special123",
    dateOfBirth: "1980-01-01",
    gender: "Male",
    createdAt: new Date().toISOString()
  },
  {
    id: "u-owner1",
    name: "Robert Vance",
    email: "robert@owner.com",
    passwordHash: bcrypt.hashSync("owner123", 10),
    plainPassword: "owner123",
    role: "Owner",
    status: "Approved",
    dateOfBirth: "1981-05-15",
    gender: "Male",
    propertiesOwned: ["p-1", "p-2"],
    currentPropertyId: "p-1",
    createdAt: new Date().toISOString()
  },
  {
    id: "u-owner2",
    name: "Elena Rostova",
    email: "elena@owner.com",
    passwordHash: bcrypt.hashSync("owner123", 10),
    plainPassword: "owner123",
    role: "Owner",
    status: "Approved",
    dateOfBirth: "1987-02-20",
    gender: "Female",
    propertiesOwned: ["p-3"],
    currentPropertyId: null, // Lives outside complex
    createdAt: new Date().toISOString()
  },
  {
    id: "u-tenant1",
    name: "Kyle Simmons",
    email: "kyle.simmons@example.com",
    passwordHash: bcrypt.hashSync("tenant123", 10),
    plainPassword: "tenant123",
    role: "Tenant",
    status: "Approved",
    dateOfBirth: "1998-08-10",
    gender: "Male",
    currentPropertyId: "p-3",
    createdAt: new Date().toISOString()
  },
  {
    id: "u-staff1",
    name: "David Morgan",
    email: "david@staff.com",
    passwordHash: bcrypt.hashSync("staff123", 10),
    plainPassword: "staff123",
    role: "Staff",
    status: "Approved",
    dateOfBirth: "1985-11-03",
    gender: "Male",
    createdAt: new Date().toISOString()
  },
  {
    id: "u-owner3",
    name: "Jane Doe",
    email: "jane@example.com",
    passwordHash: bcrypt.hashSync("jane123", 10),
    plainPassword: "jane123",
    role: "Owner",
    status: "Approved",
    dateOfBirth: "1998-08-10",
    gender: "Female",
    propertiesOwned: ["p-4"],
    currentPropertyId: "p-4",
    createdAt: new Date().toISOString()
  },
  {
    id: "u-tenant2",
    name: "Rebecca Fleeman",
    email: "becca@example.com",
    passwordHash: bcrypt.hashSync("becca123", 10),
    plainPassword: "becca123",
    role: "Tenant",
    status: "Approved",
    dateOfBirth: "2000-04-12",
    gender: "Female",
    currentPropertyId: "p-2",
    createdAt: new Date().toISOString()
  },
  {
    id: "u-staff2",
    name: "Isabella Lockhart",
    email: "bella@example.com",
    passwordHash: bcrypt.hashSync("bella123", 10),
    plainPassword: "bella123",
    role: "Staff",
    status: "Approved",
    dateOfBirth: "1992-07-22",
    gender: "Female",
    createdAt: new Date().toISOString()
  }
];

const properties: Property[] = [
  {
    id: "p-1",
    block: "Hill Tower",
    unit: "F01",
    displayName: "Hill Tower - F01",
    ownerId: "u-owner1",
    residentList: ["u-owner1"],
    bedrooms: 3,
    balconies: 2,
    details: "Spacious ground floor apartment with garden access and modular kitchen.",
    image: "/assets/properties/apartment 1.avif",
    createdAt: new Date().toISOString()
  },
  {
    id: "p-2",
    block: "Hill Tower",
    unit: "F02",
    displayName: "Hill Tower - F02",
    ownerId: "u-owner1",
    residentList: ["u-tenant2"],
    bedrooms: 2,
    balconies: 1,
    details: "Second floor luxury apartment with panoramic sunset view.",
    image: "/assets/properties/apartment 2.avif",
    createdAt: new Date().toISOString()
  },
  {
    id: "p-3",
    block: "Lake Tower",
    unit: "F01",
    displayName: "Lake Tower - F01",
    ownerId: "u-owner2",
    residentList: ["u-tenant1"],
    bedrooms: 4,
    balconies: 3,
    details: "Penthouse suite overlooking the central lake and green park.",
    image: "/assets/properties/apartment 3.jpg",
    createdAt: new Date().toISOString()
  },
  {
    id: "p-4",
    block: "East Tower",
    unit: "F01",
    displayName: "East Tower - F01",
    ownerId: "u-owner3",
    residentList: ["u-owner3"],
    bedrooms: 2,
    balconies: 1,
    details: "Unowned corner unit with modern amenities.",
    image: "/assets/properties/apartment 4.jpg",
    createdAt: new Date().toISOString()
  },
  {
    id: "p-5",
    block: "Lake Tower",
    unit: "F02",
    displayName: "Lake Tower - F02",
    ownerId: null,
    residentList: [],
    bedrooms: 3,
    balconies: 2,
    details: "Luxury lake-facing 3BHK.",
    image: "/assets/properties/apartment 5.jpg",
    createdAt: new Date().toISOString()
  },
  {
    id: "p-6",
    block: "East Tower",
    unit: "F02",
    displayName: "East Tower - F02",
    ownerId: null,
    residentList: [],
    bedrooms: 2,
    balconies: 1,
    details: "Spacious corner 2BHK.",
    image: "/assets/properties/apartment 6.jpg",
    createdAt: new Date().toISOString()
  },
  {
    id: "p-7",
    block: "Stellar Tower",
    unit: "F01",
    displayName: "Stellar Tower - F01",
    ownerId: null,
    residentList: [],
    bedrooms: 4,
    balconies: 3,
    details: "Premium penthouse in the new Stellar Tower.",
    image: "/assets/properties/apartment 1.avif",
    createdAt: new Date().toISOString()
  }
];

const towersList: string[] = ["East Tower", "Hill Tower", "Lake Tower", "Stellar Tower"];

const amenities: Amenity[] = [
  {
    id: "a-1",
    name: "Badminton Court 1",
    type: "bookable",
    category: "Sports",
    operatingHours: "06:00 AM - 10:00 PM",
    description: "Indoor wooden synthetic badminton court with modern lighting.",
    image: "/assets/amenities/badminton 1.avif"
  },
  {
    id: "a-2",
    name: "Galaxy Party Hall",
    type: "bookable",
    category: "Events",
    operatingHours: "09:00 AM - 11:00 PM",
    description: "Air-conditioned 150-seater event hall with acoustic sound system.",
    image: "/assets/amenities/party hall 1.avif"
  },
  {
    id: "a-3",
    name: "Cricket Turf 1",
    type: "bookable",
    category: "Sports",
    operatingHours: "06:00 AM - 11:59 PM",
    description: "Full-pitch floodlit astro-turf cricket arena.",
    image: "/assets/amenities/cricket 1.avif"
  },
  {
    id: "a-4",
    name: "Olympia Swimming Pool",
    type: "common",
    category: "Relaxation",
    operatingHours: "06:00 AM - 09:00 PM",
    description: "Temperature-controlled lap pool with dedicated kid zone.",
    image: "/assets/amenities/swimming pool 1.avif"
  },
  {
    id: "a-5",
    name: "Fitness Gym & Cardio Center",
    type: "common",
    category: "Health",
    operatingHours: "05:30 AM - 10:30 PM",
    description: "Fully equipped gym with modern cardio & strength equipment.",
    image: "/assets/amenities/gym 1.avif"
  },
  {
    id: "a-6",
    name: "Cricket Turf 2",
    type: "bookable",
    category: "Sports",
    operatingHours: "06:00 AM - 11:59 PM",
    description: "Additional floodlit astro-turf cricket arena for matches and practice.",
    image: "/assets/amenities/cricket 2.jpg"
  },
  {
    id: "a-7",
    name: "Gaming Vertex",
    type: "common",
    category: "Indoor Gaming",
    operatingHours: "09:00 AM - 11:59 PM",
    description: "An immersive entertainment zone featuring next-gen consoles, VR stations, and classic arcade setups. Live registrations only.",
    image: "/assets/amenities/indoor gaming 1.png"
  }
];

const maintenanceRequests: MaintenanceRequest[] = [
  {
    id: "m-1",
    propertyId: "p-1",
    propertyDisplayName: "Hill Tower - F01",
    createdBy: "u-tenant1",
    creatorName: "Kyle Simmons",
    creatorRole: "Tenant",
    issueDescription: "Kitchen sink faucet leak requiring pipe washer replacement.",
    priority: "Medium",
    status: "Pending",
    createdDate: new Date(Date.now() - 86400000).toISOString()
  }
];

const bookings: AmenityBooking[] = [];
const notifications: NotificationItem[] = [
  {
    id: "n-1",
    userId: "u-tenant1",
    title: "Welcome to Property Portal",
    message: "Your tenancy for Hill Tower - F01 is active and verified.",
    read: false,
    createdAt: new Date().toISOString()
  }
];
const ownershipRequests: OwnershipRequest[] = [];
const moveRequests: MoveRequest[] = [];
const moveOutRequests: MoveOutRequest[] = [];
const unclaimRequests: UnclaimRequest[] = [];

// Helper: Check if booking time is within amenity operating hours
function isWithinOperatingHours(
  start: Date,
  end: Date,
  operatingHoursStr: string,
  localStartTime?: string,
  localEndTime?: string
): boolean {
  if (!operatingHoursStr) return true;
  try {
    const parts = operatingHoursStr.split("-").map((s) => s.trim());
    if (parts.length !== 2) return true;

    const parseTimeToMinutes = (timeStr: string) => {
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;

      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const openMins = parseTimeToMinutes(parts[0]);
    const closeMins = parseTimeToMinutes(parts[1]);

    if (openMins === null || closeMins === null) return true;

    let startMins: number;
    let endMins: number;

    if (localStartTime && localEndTime) {
      const [sh, sm] = localStartTime.split(":").map(Number);
      const [eh, em] = localEndTime.split(":").map(Number);
      startMins = sh * 60 + sm;
      endMins = eh * 60 + em;
    } else {
      startMins = start.getHours() * 60 + start.getMinutes();
      endMins = end.getHours() * 60 + end.getMinutes();
    }

    if (endMins === 0 && end.getDate() !== start.getDate()) {
      endMins = 1440;
    } else if (endMins <= startMins) {
      endMins += 1440;
    }

    let adjustedCloseMins = closeMins;
    if (adjustedCloseMins <= openMins) {
      adjustedCloseMins += 1440;
    }

    return startMins >= openMins && endMins <= adjustedCloseMins;
  } catch (err) {
    return true;
  }
}

// Helper lazy evaluation for bookings
function updateBookingStatuses() {
  const now = new Date();
  bookings.forEach((b) => {
    if (b.status === "Booked" && new Date(b.endTime) <= now) {
      b.status = "Completed";
      persistBooking(b);
    }
  });
}

// Middleware: Authenticate JWT
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

let ADMIN_SPECIAL_PASSWORD = process.env.MANAGEMENT_SECURITY_KEY || "special123";

function verifyAdminSpecialPassword(req: any) {
  const provided = req.body?.specialPassword || req.headers["x-admin-password"] || req.body?.adminPassword;
  if (!provided) return false;

  const adminUser = users.find((u) => u.role === "Admin" && !u.isDeleted);
  if (adminUser && adminUser.management_security_key) {
    try {
      return bcrypt.compareSync(provided, adminUser.management_security_key);
    } catch {
      return provided === adminUser.management_security_key;
    }
  }

  return provided === ADMIN_SPECIAL_PASSWORD;
}

// Admin API to change Management Security Key
app.post("/api/admin/change-management-key", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only System Admin can update the Management Security Key." });
  }

  const { adminPassword, currentSecurityKey, newSecurityKey } = req.body;

  if (!adminPassword || !currentSecurityKey || !newSecurityKey) {
    return res.status(400).json({ error: "Admin account password, current key, and new key are required." });
  }

  // 1. Verify Admin user's account password
  const adminUser = users.find((u) => u.id === req.user.id && !u.isDeleted);
  if (!adminUser || !bcrypt.compareSync(adminPassword, adminUser.passwordHash)) {
    return res.status(401).json({ error: "Incorrect Admin account password." });
  }

  // 2. Verify current Management Security Key against stored hash in Admin user record
  let isCurrentValid = false;
  if (adminUser.management_security_key) {
    try {
      isCurrentValid = bcrypt.compareSync(currentSecurityKey, adminUser.management_security_key);
    } catch {
      isCurrentValid = currentSecurityKey === adminUser.management_security_key;
    }
  } else {
    isCurrentValid = currentSecurityKey === ADMIN_SPECIAL_PASSWORD;
  }

  if (!isCurrentValid) {
    return res.status(401).json({ error: "Incorrect current Management Security Key." });
  }

  // 3. Validation for new key
  if (newSecurityKey.trim().length < 6) {
    return res.status(400).json({ error: "New Management Security Key must be at least 6 characters long." });
  }

  if (adminUser.management_security_key) {
    try {
      if (bcrypt.compareSync(newSecurityKey.trim(), adminUser.management_security_key)) {
        return res.status(400).json({ error: "New Management Security Key must be different from the current key." });
      }
    } catch {
      if (newSecurityKey.trim() === adminUser.management_security_key) {
        return res.status(400).json({ error: "New Management Security Key must be different from the current key." });
      }
    }
  } else if (newSecurityKey.trim() === ADMIN_SPECIAL_PASSWORD) {
    return res.status(400).json({ error: "New Management Security Key must be different from the current key." });
  }

  const hashedKey = bcrypt.hashSync(newSecurityKey.trim(), 10);
  adminUser.management_security_key = hashedKey;
  adminUser.plainManagementSecurityKey = newSecurityKey.trim();
  ADMIN_SPECIAL_PASSWORD = newSecurityKey.trim();

  persistUser(adminUser);

  // Create audit notification
  const keyNotif = {
    id: `n-${Date.now()}`,
    userId: adminUser.id,
    title: "Management Security Key Updated",
    message: `The Management Security Key was successfully changed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(keyNotif);
  persistNotification(keyNotif);

  res.json({ message: "Management Security Key updated successfully." });
});

// API ROUTES

const DEFAULT_PASSWORD_MAP: Record<string, string> = {
  "admin@complex.com": "admin123",
  "robert@owner.com": "owner123",
  "elena@owner.com": "owner123",
  "kyle.simmons@example.com": "tenant123",
  "david@staff.com": "staff123",
  "jane@example.com": "jane123",
  "becca@example.com": "becca123",
  "bella@example.com": "bella123"
};

app.get("/api/public/login-credentials", (req, res) => {
  const adminUser = users.find((u) => u.role === "Admin" && !u.isDeleted);
  const currentAdminMgmtKey = adminUser?.plainManagementSecurityKey || ADMIN_SPECIAL_PASSWORD || "special123";

  const list = users
    .filter((u) => !u.isDeleted)
    .map((u) => {
      const emailLower = u.email.toLowerCase();
      const defaultPass = DEFAULT_PASSWORD_MAP[emailLower];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        password: u.plainPassword || defaultPass || "(Check Register form)",
        managementSecurityKey: u.role === "Admin" ? currentAdminMgmtKey : undefined
      };
    });
  res.json({ users: list, adminManagementSecurityKey: currentAdminMgmtKey });
});

// Auth & User APIs
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, dateOfBirth, gender, propertyId, propertyIds, propertiesCount, livesInside, residencePropertyId } = req.body;

  if (!name || !email || !password || !role || !dateOfBirth || !gender) {
    return res.status(400).json({ error: "Missing required registration fields (Name, Email, Password, Role, Date of Birth, and Gender are required)" });
  }

  if (role === "Admin") {
    return res.status(403).json({ error: "Admin registration is prohibited" });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && !u.isDeleted);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  if (role === "Tenant") {
    if (!propertyId) {
      return res.status(400).json({ error: "Desired property must be selected for Tenant registration" });
    }
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) {
      return res.status(404).json({ error: "Selected property does not exist" });
    }
  }

  const reqPropIds: string[] = role === "Owner" ? (Array.isArray(propertyIds) ? propertyIds : propertyId ? [propertyId] : []) : [];

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    plainPassword: password,
    role,
    status: "Pending",
    dateOfBirth,
    gender,
    propertiesOwned: [],
    currentPropertyId: null,
    requestedPropertyId: role === "Tenant" ? propertyId : null,
    requestedPropertyIds: reqPropIds,
    livesInside: role === "Owner" ? Boolean(livesInside) : undefined,
    residencePropertyId: role === "Owner" && livesInside ? residencePropertyId || propertyId || (reqPropIds.length > 0 ? reqPropIds[0] : null) : null,
    ownerApproved: role === "Owner" ? true : false,
    adminApproved: false,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  persistUser(newUser);

  // Notify Admins
  const adminNotif = {
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: `New ${role} Registration Request`,
    message: `${name} (${email}) registered as ${role} and is pending approval.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(adminNotif);
  persistNotification(adminNotif);

  // If tenant, notify owner of selected property
  if (role === "Tenant" && propertyId) {
    const prop = properties.find((p) => p.id === propertyId);
    if (prop && prop.ownerId) {
      const ownerNotif = {
        id: `n-${Date.now() + 1}`,
        userId: prop.ownerId,
        title: "New Tenant Registration Request",
        message: `${name} requested to move into your property ${prop.displayName}.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      notifications.push(ownerNotif);
      persistNotification(ownerNotif);
    }
  }

  res.status(201).json({ message: "Registration submitted successfully. Pending approval." });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && !u.isDeleted);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (user.status === "Pending") {
    return res.status(401).json({ error: "Your account registration is pending approval." });
  }
  if (user.status === "Rejected") {
    return res.status(401).json({ error: "Your registration request was rejected." });
  }
  if (user.status === "Suspended") {
    return res.status(401).json({ error: "Your account is currently suspended." });
  }

  const validPassword = bcrypt.compareSync(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      currentPropertyId: user.currentPropertyId,
      propertiesOwned: user.propertiesOwned
    }
  });
});

app.get("/api/auth/me", authenticateToken, (req: any, res: any) => {
  const user = users.find((u) => u.id === req.user.id && !u.isDeleted);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.role === "Owner" && (!user.propertiesOwned || user.propertiesOwned.length === 0) && user.currentPropertyId) {
    user.role = "Tenant";
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    currentPropertyId: user.currentPropertyId,
    propertiesOwned: user.propertiesOwned
  });
});

app.post("/api/auth/change-password", authenticateToken, (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(400).json({ error: "Incorrect current password" });
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  user.plainPassword = newPassword;
  persistUser(user);
  res.json({ message: "Password changed successfully" });
});

// Admin User Approvals & Management
app.get("/api/users", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin" && req.user.role !== "Owner") {
    return res.status(403).json({ error: "Admin or Owner access required" });
  }
  users.forEach(u => {
    if (u.role === "Owner" && (!u.propertiesOwned || u.propertiesOwned.length === 0) && u.currentPropertyId) {
      u.role = "Tenant";
      persistUser(u);
    }
  });
  const activeUsers = users
    .filter((u) => !u.isDeleted)
    .map(({ passwordHash, ...u }) => u);
  res.json(activeUsers);
});

app.post("/api/users/:id/approve", authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const targetUser = users.find((u) => u.id === id);
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can approve via this endpoint" });
  }

  // Tenant Approval Validation
  if (targetUser.role === "Tenant") {
    const propId = targetUser.requestedPropertyId || targetUser.currentPropertyId;
    if (propId) {
      const prop = properties.find((p) => p.id === propId);
      if (!prop) {
        return res.status(404).json({ error: "Requested property not found" });
      }
      if (!prop.ownerId) {
        return res.status(400).json({
          error: `Cannot approve tenant registration: Selected property (${prop.displayName}) has no assigned owner. Admin can only approve tenant registration for owned properties.`
        });
      }

      targetUser.adminApproved = true;

      // If owner has approved or if Admin force approves, finalize registration
      if (targetUser.ownerApproved || req.body.forceOverride) {
        targetUser.ownerApproved = true;
        if (!prop.residentList.includes(targetUser.id)) {
          prop.residentList.push(targetUser.id);
          persistProperty(prop);
        }
        targetUser.currentPropertyId = prop.id;
        targetUser.status = "Approved";

        if (!targetUser.propertiesOwned || targetUser.propertiesOwned.length === 0) {
          targetUser.role = "Tenant";
        }
        persistUser(targetUser);

        const appNotif = {
          id: `n-${Date.now()}`,
          userId: targetUser.id,
          title: "Account Approved",
          message: `Your tenancy registration for ${prop.displayName} has been fully approved!`,
          read: false,
          createdAt: new Date().toISOString()
        };
        notifications.push(appNotif);
        persistNotification(appNotif);

        return res.json({ message: "Tenant registration fully approved by Admin & Owner.", user: targetUser });
      } else {
        persistUser(targetUser);
        // Notify owner that Admin approved and Owner approval is needed
        const ownerNotif = {
          id: `n-${Date.now()}`,
          userId: prop.ownerId,
          title: "Tenant Registration Pending Owner Approval",
          message: `Admin approved ${targetUser.name}'s tenancy request for ${prop.displayName}. Please review and approve in your Dashboard.`,
          read: false,
          createdAt: new Date().toISOString()
        };
        notifications.push(ownerNotif);
        persistNotification(ownerNotif);

        const propOwner = prop.ownerId ? users.find((u) => u.id === prop.ownerId) : null;
        return res.json({
          message: `Admin approval recorded. Awaiting Property Owner (${propOwner ? propOwner.name : "Owner"}) approval.`,
          user: targetUser
        });
      }
    }
  }

  // Owner Approval Validation
  if (targetUser.role === "Owner") {
    const reqPropIds = targetUser.requestedPropertyIds && targetUser.requestedPropertyIds.length > 0
      ? targetUser.requestedPropertyIds
      : (targetUser.requestedPropertyId ? [targetUser.requestedPropertyId] : []);

    if (reqPropIds.length > 0) {
      const occupied = properties.filter((p) => reqPropIds.includes(p.id) && p.ownerId !== null && p.ownerId !== targetUser.id);
      if (occupied.length > 0) {
        const names = occupied.map((p) => p.displayName).join(", ");
        return res.status(400).json({
          error: `Cannot approve owner registration: Selected property/properties (${names}) already have an owner assigned.`
        });
      }

      reqPropIds.forEach((pid) => {
        const prop = properties.find((p) => p.id === pid);
        if (prop) {
          prop.ownerId = targetUser.id;
          persistProperty(prop);
        }
      });
      targetUser.propertiesOwned = reqPropIds;

      if (targetUser.livesInside) {
        const resPropId = targetUser.residencePropertyId || (reqPropIds.length > 0 ? reqPropIds[0] : null);
        if (resPropId) {
          const resProp = properties.find((p) => p.id === resPropId);
          if (resProp) {
            if (!resProp.residentList.includes(targetUser.id)) {
              resProp.residentList.push(targetUser.id);
              persistProperty(resProp);
            }
            targetUser.currentPropertyId = resProp.id;
          }
        }
      }
    }
  }

  targetUser.adminApproved = true;
  targetUser.ownerApproved = true;
  targetUser.status = "Approved";
  persistUser(targetUser);

  const finalNotif = {
    id: `n-${Date.now()}`,
    userId: targetUser.id,
    title: "Account Approved",
    message: "Your registration request has been approved!",
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(finalNotif);
  persistNotification(finalNotif);

  res.json({ message: "User approved successfully", user: targetUser });
});

// Owner Approves Tenant Registration Request
app.post("/api/users/:id/owner-approve", authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const targetUser = users.find((u) => u.id === id);
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  const propId = targetUser.requestedPropertyId || targetUser.currentPropertyId;
  if (!propId) {
    return res.status(400).json({ error: "User has no requested property" });
  }

  const prop = properties.find((p) => p.id === propId);
  if (!prop) return res.status(404).json({ error: "Property not found" });

  if (req.user.role !== "Admin" && prop.ownerId !== req.user.id) {
    return res.status(403).json({ error: "Only the property owner can approve tenant move-in for this property." });
  }

  targetUser.ownerApproved = true;

  if (targetUser.adminApproved) {
    targetUser.status = "Approved";

    if (!prop.residentList.includes(targetUser.id)) {
      prop.residentList.push(targetUser.id);
      persistProperty(prop);
    }
    targetUser.currentPropertyId = prop.id;

    if (!targetUser.propertiesOwned || targetUser.propertiesOwned.length === 0) {
      targetUser.role = "Tenant";
    }
    persistUser(targetUser);

    const propOwner = prop.ownerId ? users.find((u) => u.id === prop.ownerId) : null;
    const notifObj = {
      id: `n-${Date.now()}`,
      userId: targetUser.id,
      title: "Tenant Registration Approved",
      message: `Property owner (${propOwner ? propOwner.name : req.user.name}) approved your tenancy for ${prop.displayName}!`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(notifObj);
    persistNotification(notifObj);

    res.json({ message: `Approved tenant ${targetUser.name} for ${prop.displayName}`, user: targetUser });
  } else {
    persistUser(targetUser);
    const adminNotif = {
      id: `n-${Date.now()}`,
      userId: "u-admin",
      title: "Tenant Registration Pending Admin Approval",
      message: `Owner approved ${targetUser.name}'s tenancy request for ${prop.displayName}. Please review and approve.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(adminNotif);
    persistNotification(adminNotif);

    res.json({ 
      message: `Owner approval recorded. Awaiting System Admin approval.`, 
      user: targetUser 
    });
  }
});

// Owner Rejects Tenant Registration Request
app.post("/api/users/:id/owner-reject", authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const targetUser = users.find((u) => u.id === id);
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  const propId = targetUser.requestedPropertyId || targetUser.currentPropertyId;
  const prop = propId ? properties.find((p) => p.id === propId) : null;

  if (req.user.role !== "Admin" && prop && prop.ownerId !== req.user.id) {
    return res.status(403).json({ error: "Unauthorized to reject this tenant" });
  }

  targetUser.status = "Rejected";
  targetUser.isDeleted = true;
  persistUser(targetUser);

  res.json({ message: "Tenant registration rejected." });
});

app.post("/api/users/:id/reject", authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const targetUser = users.find((u) => u.id === id);
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  targetUser.status = "Rejected";
  targetUser.isDeleted = true; // Soft deletion with partial index logic allowing re-registration
  persistUser(targetUser);

  res.json({ message: "User registration rejected and record removed" });
});

// Tower Management APIs
app.get("/api/towers", (req, res) => {
  const propertyBlocks = properties.map((p) => p.block);
  const combined = Array.from(new Set([...towersList, ...propertyBlocks])).sort();
  const enriched = combined.map((tName) => {
    const count = properties.filter((p) => p.block.toLowerCase() === tName.toLowerCase()).length;
    return {
      name: tName,
      propertyCount: count,
      canDelete: count === 0
    };
  });
  res.json(enriched);
});

app.post("/api/towers", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can add towers" });
  }
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Tower name is required" });
  }

  const trimmed = name.trim();
  const exists = towersList.some((t) => t.toLowerCase() === trimmed.toLowerCase()) ||
                 properties.some((p) => p.block.toLowerCase() === trimmed.toLowerCase());

  if (exists) {
    return res.status(409).json({ error: `Tower "${trimmed}" already exists.` });
  }

  towersList.push(trimmed);
  res.status(201).json({ message: `Tower "${trimmed}" added successfully`, name: trimmed });
});

app.delete("/api/towers/:name", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can delete towers" });
  }

  const targetName = decodeURIComponent(req.params.name).trim();
  const propertyCount = properties.filter((p) => p.block.toLowerCase() === targetName.toLowerCase()).length;

  if (propertyCount > 0) {
    return res.status(400).json({
      error: `Cannot delete tower "${targetName}": ${propertyCount} property/properties are assigned to this tower.`
    });
  }

  const index = towersList.findIndex((t) => t.toLowerCase() === targetName.toLowerCase());
  if (index !== -1) {
    towersList.splice(index, 1);
  }

  res.json({ message: `Tower "${targetName}" deleted successfully.` });
});

// Property Management APIs
app.get("/api/properties", (req, res) => {
  const enriched = properties.map((p) => {
    const owner = users.find((u) => u.id === p.ownerId && !u.isDeleted);
    const residents = users.filter((u) => p.residentList.includes(u.id) && !u.isDeleted);
    return {
      ...p,
      ownerName: owner ? owner.name : "Unowned",
      ownerEmail: owner ? owner.email : null,
      residentDetails: residents.map((r) => ({ id: r.id, name: r.name, role: r.role }))
    };
  });
  res.json(enriched);
});

app.post("/api/properties", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can create properties" });
  }

  if (!verifyAdminSpecialPassword(req)) {
    return res.status(401).json({ error: "Invalid Management Security Key." });
  }

  const { block, unit, bedrooms, balconies, details, image } = req.body;
  if (!block || !unit) {
    return res.status(400).json({ error: "Block and Unit are required" });
  }

  const displayName = `${block} - ${unit}`;
  const exists = properties.find(
    (p) => p.block.toLowerCase() === block.toLowerCase() && p.unit.toLowerCase() === unit.toLowerCase()
  );
  if (exists) {
    return res.status(409).json({ error: `Property ${displayName} already exists.` });
  }

  const newProperty: Property = {
    id: `p-${Date.now()}`,
    block,
    unit,
    displayName,
    ownerId: null,
    residentList: [],
    bedrooms: Number(bedrooms) || 2,
    balconies: Number(balconies) || 1,
    details: details || "",
    image: image || "/assets/properties/apartment 1.avif",
    createdAt: new Date().toISOString()
  };

  properties.push(newProperty);
  persistProperty(newProperty);

  if (!towersList.some((t) => t.toLowerCase() === block.trim().toLowerCase())) {
    towersList.push(block.trim());
  }
  res.status(201).json(newProperty);
});

// Update Property Image (Admin Only)
app.put("/api/properties/:id/image", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can change property images" });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Image path is required" });
  }

  const prop = properties.find((p) => p.id === req.params.id);
  if (!prop) {
    return res.status(404).json({ error: "Property not found" });
  }

  prop.image = image;
  persistProperty(prop);
  res.json({ message: "Property image updated successfully", property: prop });
});

app.delete("/api/properties/:id", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can delete properties" });
  }

  if (!verifyAdminSpecialPassword(req)) {
    return res.status(401).json({ error: "Invalid Management Security Key." });
  }

  const index = properties.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Property not found" });

  const prop = properties[index];
  if (prop.ownerId !== null || prop.residentList.length > 0) {
    return res.status(400).json({
      error: "Cannot delete property: Property must have no active Owner and zero active Residents."
    });
  }

  properties.splice(index, 1);
  deletePropertyFromDb(prop.id);
  res.json({ message: "Property deleted successfully" });
});

// Property Unclaiming (Relinquishing Ownership via Admin Approval)
app.get("/api/unclaim-requests", authenticateToken, (req: any, res: any) => {
  res.json(unclaimRequests);
});

app.post("/api/properties/:id/unclaim", authenticateToken, (req: any, res: any) => {
  const prop = properties.find((p) => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: "Property not found" });

  if (prop.ownerId !== req.user.id) {
    return res.status(403).json({ error: "Only the property owner can request to unclaim this property." });
  }

  if (prop.residentList.length > 0) {
    return res.status(400).json({
      error: "Cannot unclaim property while residents still occupy it. All residents must move out first."
    });
  }

  const existing = unclaimRequests.find(
    (u) => u.propertyId === prop.id && u.status === "Pending Admin Approval"
  );
  if (existing) {
    return res.status(400).json({ error: "An unclaim request is already pending Admin approval for this property." });
  }

  const newUnclaim: UnclaimRequest = {
    id: `ur-${Date.now()}`,
    propertyId: prop.id,
    propertyDisplayName: prop.displayName,
    ownerId: req.user.id,
    ownerName: req.user.name,
    status: "Pending Admin Approval",
    createdAt: new Date().toISOString()
  };

  unclaimRequests.push(newUnclaim);
  persistUnclaimRequest(newUnclaim);

  const adminNotif = {
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "Property Unclaim Request",
    message: `${req.user.name} requested to surrender/unclaim ownership of ${prop.displayName}.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(adminNotif);
  persistNotification(adminNotif);

  res.status(201).json(newUnclaim);
});

app.post("/api/unclaim-requests/:id/approve", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can approve unclaim requests." });
  }

  const ur = unclaimRequests.find((u) => u.id === req.params.id);
  if (!ur) return res.status(404).json({ error: "Unclaim request not found" });

  const prop = properties.find((p) => p.id === ur.propertyId);
  if (!prop) return res.status(404).json({ error: "Property not found" });

  if (prop.residentList.length > 0) {
    return res.status(400).json({ error: "Cannot approve unclaim while residents still occupy the property." });
  }

  // Remove owner
  const oldOwnerId = prop.ownerId;
  prop.ownerId = null;
  persistProperty(prop);

  if (oldOwnerId) {
    const owner = users.find((u) => u.id === oldOwnerId);
    if (owner && owner.propertiesOwned) {
      owner.propertiesOwned = owner.propertiesOwned.filter((pid) => pid !== prop.id);
      if (owner.propertiesOwned.length === 0 && owner.currentPropertyId) {
        owner.role = "Tenant";
      }
      persistUser(owner);
    }
  }

  ur.status = "Approved";
  persistUnclaimRequest(ur);

  const appNotif = {
    id: `n-${Date.now()}`,
    userId: ur.ownerId,
    title: "Property Unclaim Approved",
    message: `Admin approved your unclaim request for ${prop.displayName}. Property ownership has been surrendered.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(appNotif);
  persistNotification(appNotif);

  res.json(ur);
});

app.post("/api/unclaim-requests/:id/reject", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can reject unclaim requests." });
  }

  const ur = unclaimRequests.find((u) => u.id === req.params.id);
  if (!ur) return res.status(404).json({ error: "Unclaim request not found" });

  ur.status = "Rejected";
  persistUnclaimRequest(ur);

  const rejNotif = {
    id: `n-${Date.now()}`,
    userId: ur.ownerId,
    title: "Unclaim Request Rejected",
    message: `Admin rejected your unclaim request for ${ur.propertyDisplayName}.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(rejNotif);
  persistNotification(rejNotif);

  res.json(ur);
});

app.post("/api/unclaim-requests/:id/cancel", authenticateToken, (req: any, res: any) => {
  const ur = unclaimRequests.find((u) => u.id === req.params.id);
  if (!ur) return res.status(404).json({ error: "Unclaim request not found" });

  if (ur.ownerId !== req.user.id && req.user.role !== "Admin") {
    return res.status(403).json({ error: "Unauthorized to cancel this request." });
  }

  ur.status = "Cancelled";
  persistUnclaimRequest(ur);
  res.json(ur);
});

// Ownership Requests
app.get("/api/ownership-requests", authenticateToken, (req: any, res: any) => {
  res.json(ownershipRequests);
});

app.post("/api/ownership-requests", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Owner" && req.user.role !== "Tenant") {
    return res.status(403).json({ error: "Only Owners and Tenants can request property ownership. Admins and Staff cannot." });
  }

  const { propertyId } = req.body;
  const prop = properties.find((p) => p.id === propertyId);
  if (!prop) return res.status(404).json({ error: "Property not found" });

  if (prop.ownerId !== null) {
    return res.status(400).json({ error: "Cannot request ownership of a property that already has an owner. Ownership requests are allowed for ownerless properties only." });
  }

  const existingReq = ownershipRequests.find(
    (r) => r.propertyId === propertyId && r.requesterId === req.user.id && r.status.startsWith("Pending")
  );
  if (existingReq) {
    return res.status(409).json({ error: "You already have a pending ownership request for this property." });
  }

  const newReq: OwnershipRequest = {
    id: `or-${Date.now()}`,
    propertyId: prop.id,
    propertyDisplayName: prop.displayName,
    requesterId: req.user.id,
    requesterName: req.user.name,
    requesterRole: req.user.role,
    currentOwnerId: null,
    status: "Pending Admin Approval",
    adminApproved: false,
    ownerApproved: true,
    createdAt: new Date().toISOString()
  };

  ownershipRequests.push(newReq);
  persistOwnershipRequest(newReq);

  const adminNotif = {
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "Ownership Request Submitted",
    message: `${req.user.name} requested ownership of ${prop.displayName}.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(adminNotif);
  persistNotification(adminNotif);

  if (prop.ownerId) {
    const ownerNotif = {
      id: `n-${Date.now() + 1}`,
      userId: prop.ownerId,
      title: "Ownership Transfer Request",
      message: `${req.user.name} requested to purchase/transfer ownership of ${prop.displayName}.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(ownerNotif);
    persistNotification(ownerNotif);
  }

  res.status(201).json(newReq);
});

app.post("/api/ownership-requests/:id/approve", authenticateToken, (req: any, res: any) => {
  const reqObj = ownershipRequests.find((r) => r.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: "Request not found" });

  if (reqObj.status === "Approved" || reqObj.status === "Rejected" || reqObj.status === "Cancelled") {
    return res.status(400).json({ error: "This request is no longer pending." });
  }

  const prop = properties.find((p) => p.id === reqObj.propertyId);
  if (!prop) return res.status(404).json({ error: "Associated property not found" });

  if (reqObj.currentOwnerId === null && prop.ownerId !== null && prop.ownerId !== reqObj.requesterId) {
    return res.status(400).json({ error: "This property has already been assigned an owner." });
  }

  if (req.user.role === "Admin") {
    reqObj.adminApproved = true;
  } else if (req.user.id === reqObj.currentOwnerId) {
    reqObj.ownerApproved = true;
  } else {
    return res.status(403).json({ error: "Not authorized to approve this request" });
  }

  if (req.user.role === "Admin" && req.body.forceOverride) {
    reqObj.adminApproved = true;
    reqObj.ownerApproved = true;
  }

  if (reqObj.adminApproved && reqObj.ownerApproved) {
    reqObj.status = "Approved";

    const oldOwnerId = prop.ownerId;
    prop.ownerId = reqObj.requesterId;
    persistProperty(prop);

    if (oldOwnerId) {
      const oldOwner = users.find((u) => u.id === oldOwnerId);
      if (oldOwner && oldOwner.propertiesOwned) {
        oldOwner.propertiesOwned = oldOwner.propertiesOwned.filter((pid) => pid !== prop.id);
        if (oldOwner.propertiesOwned.length === 0 && oldOwner.currentPropertyId) {
          oldOwner.role = "Tenant";
        }
        persistUser(oldOwner);
      }
    }

    const requester = users.find((u) => u.id === reqObj.requesterId);
    if (requester) {
      if (!requester.propertiesOwned) requester.propertiesOwned = [];
      requester.propertiesOwned.push(prop.id);

      if (requester.role === "Tenant") {
        requester.role = "Owner";
      }
      persistUser(requester);
    }

    const appNotif = {
      id: `n-${Date.now()}`,
      userId: reqObj.requesterId,
      title: "Ownership Approved!",
      message: `You are now the official owner of ${prop.displayName}.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(appNotif);
    persistNotification(appNotif);

    // Auto-disapprove all other pending ownership requests for this property
    ownershipRequests.forEach((otherReq) => {
      if (
        otherReq.propertyId === prop.id &&
        otherReq.id !== reqObj.id &&
        (otherReq.status.startsWith("Pending") || otherReq.status === "Pending Admin Approval" || otherReq.status === "Pending Owner Approval")
      ) {
        otherReq.status = "Rejected";
        persistOwnershipRequest(otherReq);

        const autoNotif = {
          id: `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: otherReq.requesterId,
          title: "Ownership Request Disapproved",
          message: `Your ownership request for ${prop.displayName} was auto-disapproved because ${requester ? requester.name : "another resident"} was approved as the owner.`,
          read: false,
          createdAt: new Date().toISOString()
        };
        notifications.push(autoNotif);
        persistNotification(autoNotif);
      }
    });
  } else {
    reqObj.status = reqObj.adminApproved ? "Pending Owner Approval" : "Pending Admin Approval";
  }

  persistOwnershipRequest(reqObj);
  res.json(reqObj);
});

app.post("/api/ownership-requests/:id/reject", authenticateToken, (req: any, res: any) => {
  const reqObj = ownershipRequests.find((r) => r.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: "Request not found" });

  if (req.user.role !== "Admin" && req.user.id !== reqObj.currentOwnerId) {
    return res.status(403).json({ error: "Not authorized to reject this ownership request." });
  }

  reqObj.status = "Rejected";
  persistOwnershipRequest(reqObj);

  const rejNotif = {
    id: `n-${Date.now()}`,
    userId: reqObj.requesterId,
    title: "Ownership Request Rejected",
    message: `Your ownership request for ${reqObj.propertyDisplayName} was rejected.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(rejNotif);
  persistNotification(rejNotif);

  res.json(reqObj);
});

app.post("/api/ownership-requests/:id/cancel", authenticateToken, (req: any, res: any) => {
  const reqObj = ownershipRequests.find((r) => r.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: "Request not found" });

  if (req.user.id !== reqObj.requesterId && req.user.role !== "Admin") {
    return res.status(403).json({ error: "Unauthorized to cancel this ownership request." });
  }

  reqObj.status = "Cancelled";
  persistOwnershipRequest(reqObj);
  res.json(reqObj);
});

// Move In Workflow
app.get("/api/move-requests", authenticateToken, (req: any, res: any) => {
  res.json(moveRequests);
});

app.post("/api/move-requests", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Owner" && req.user.role !== "Tenant") {
    return res.status(403).json({ error: "Only Owners and Tenants can participate in move-in requests. Admins and Staff cannot." });
  }

  const { toPropertyId } = req.body;
  const toProp = properties.find((p) => p.id === toPropertyId);
  if (!toProp) return res.status(404).json({ error: "Destination property not found" });

  if (!toProp.ownerId) {
    return res.status(400).json({ error: "Cannot move into an unowned property." });
  }

  const currentUser = users.find((u) => u.id === req.user.id);
  if (!currentUser) return res.status(404).json({ error: "User not found" });

  const activeMove = moveRequests.find(
    (m) => m.userId === currentUser.id && (m.status === "Pending Approvals" || m.status === "Approved - Waiting for Move-Out")
  );
  if (activeMove) {
    return res.status(400).json({ error: "You already have an active move-in request pending." });
  }

  const currentProp = properties.find((p) => p.id === currentUser.currentPropertyId);

  // If user IS the property owner of the target unit, owner approval is auto true
  const isOwnerOfTarget = toProp.ownerId === currentUser.id;

  const newMoveReq: MoveRequest = {
    id: `mr-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.name,
    fromPropertyId: currentProp ? currentProp.id : null,
    fromPropertyName: currentProp ? currentProp.displayName : null,
    toPropertyId: toProp.id,
    toPropertyName: toProp.displayName,
    status: "Pending Approvals",
    adminApproved: false,
    newOwnerApproved: isOwnerOfTarget,
    createdAt: new Date().toISOString()
  };

  moveRequests.push(newMoveReq);
  persistMoveRequest(newMoveReq);

  const adminNotif = {
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "Move-In Request",
    message: `${currentUser.name} requested move-in to ${toProp.displayName}.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(adminNotif);
  persistNotification(adminNotif);

  if (toProp.ownerId && !isOwnerOfTarget) {
    const ownerNotif = {
      id: `n-${Date.now() + 1}`,
      userId: toProp.ownerId,
      title: "Tenant Move-In Request",
      message: `${currentUser.name} requested to move into your property ${toProp.displayName}.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(ownerNotif);
    persistNotification(ownerNotif);
  }

  res.status(201).json(newMoveReq);
});

app.post("/api/move-requests/:id/approve", authenticateToken, (req: any, res: any) => {
  const mr = moveRequests.find((m) => m.id === req.params.id);
  if (!mr) return res.status(404).json({ error: "Move request not found" });

  const toProp = properties.find((p) => p.id === mr.toPropertyId);
  if (!toProp) return res.status(404).json({ error: "Target property not found" });

  if (req.user.role === "Admin") {
    mr.adminApproved = true;
  } else if (req.user.id === toProp.ownerId) {
    mr.newOwnerApproved = true;
  } else {
    return res.status(403).json({ error: "Unauthorized approval attempt" });
  }

  if (mr.adminApproved && mr.newOwnerApproved) {
    mr.status = "Approved - Waiting for Move-Out";
    const appNotif = {
      id: `n-${Date.now()}`,
      userId: mr.userId,
      title: "Move-In Approved!",
      message: `Your move-in request to ${mr.toPropertyName} is approved. Please execute Move Out from your current property to finalize.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(appNotif);
    persistNotification(appNotif);
  }

  persistMoveRequest(mr);
  res.json(mr);
});

app.post("/api/move-requests/:id/reject", authenticateToken, (req: any, res: any) => {
  const mr = moveRequests.find((m) => m.id === req.params.id);
  if (!mr) return res.status(404).json({ error: "Move request not found" });

  const toProp = properties.find((p) => p.id === mr.toPropertyId);

  if (req.user.role !== "Admin" && (toProp && req.user.id !== toProp.ownerId)) {
    return res.status(403).json({ error: "Unauthorized to reject this move request." });
  }

  mr.status = "Rejected";
  persistMoveRequest(mr);

  const rejNotif = {
    id: `n-${Date.now()}`,
    userId: mr.userId,
    title: "Move-In Request Rejected",
    message: `Your move-in request to ${mr.toPropertyName} was rejected.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(rejNotif);
  persistNotification(rejNotif);

  res.json(mr);
});

app.post("/api/move-requests/:id/cancel", authenticateToken, (req: any, res: any) => {
  const mr = moveRequests.find((m) => m.id === req.params.id);
  if (!mr) return res.status(404).json({ error: "Move request not found" });

  if (req.user.id !== mr.userId && req.user.role !== "Admin") {
    return res.status(403).json({ error: "Unauthorized to cancel this move request." });
  }

  mr.status = "Cancelled";
  persistMoveRequest(mr);
  res.json(mr);
});

// Standalone Move-Out Requests Workflow
app.get("/api/move-out-requests", authenticateToken, (req: any, res: any) => {
  res.json(moveOutRequests);
});

app.post("/api/move-out-requests", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Owner" && req.user.role !== "Tenant") {
    return res.status(403).json({ error: "Only Owners and Tenants can request move-out. Admins and Staff cannot." });
  }

  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.currentPropertyId) {
    return res.status(400).json({ error: "You are currently not residing in any property." });
  }

  const currentProp = properties.find((p) => p.id === user.currentPropertyId);
  if (!currentProp) return res.status(404).json({ error: "Current property record not found" });

  const activeReq = moveOutRequests.find(
    (m) => m.userId === user.id && (m.status === "Pending Approvals" || m.status === "Approved - Ready to Finalize")
  );
  if (activeReq) {
    return res.status(400).json({ error: "You already have an active move-out request pending." });
  }

  // Check if user is attempting move-out while move-in to a new apartment is still pending approval
  const pendingMoveIn = moveRequests.find(
    (m) => m.userId === user.id && m.status === "Pending Approvals"
  );
  if (pendingMoveIn) {
    return res.status(400).json({
      error: `Cannot request move-out yet: Your move-in request for ${pendingMoveIn.toPropertyName} is awaiting approvals from the owner and admin. You can move out once your new apartment move-in is approved.`
    });
  }

  const isOwnerResiding = currentProp.ownerId === user.id;

  const newReq: MoveOutRequest = {
    id: `mor-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    propertyId: currentProp.id,
    propertyDisplayName: currentProp.displayName,
    status: "Pending Approvals",
    adminApproved: false,
    ownerApproved: isOwnerResiding ? true : false,
    createdAt: new Date().toISOString()
  };

  moveOutRequests.push(newReq);
  persistMoveOutRequest(newReq);

  const adminNotif = {
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "Move-Out Request",
    message: `${user.name} requested move-out from ${currentProp.displayName}.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(adminNotif);
  persistNotification(adminNotif);

  if (currentProp.ownerId && !isOwnerResiding) {
    const ownerNotif = {
      id: `n-${Date.now() + 1}`,
      userId: currentProp.ownerId,
      title: "Tenant Move-Out Request",
      message: `${user.name} requested to move out from your property ${currentProp.displayName}.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(ownerNotif);
    persistNotification(ownerNotif);
  }

  res.status(201).json(newReq);
});

app.post("/api/move-out-requests/:id/approve", authenticateToken, (req: any, res: any) => {
  const mor = moveOutRequests.find((m) => m.id === req.params.id);
  if (!mor) return res.status(404).json({ error: "Move-out request not found" });

  const prop = properties.find((p) => p.id === mor.propertyId);

  if (req.user.role === "Admin") {
    mor.adminApproved = true;
  } else if (prop && req.user.id === prop.ownerId) {
    mor.ownerApproved = true;
  } else {
    return res.status(403).json({ error: "Unauthorized approval attempt" });
  }

  if (mor.adminApproved && mor.ownerApproved) {
    mor.status = "Approved - Ready to Finalize";
    const appNotif = {
      id: `n-${Date.now()}`,
      userId: mor.userId,
      title: "Move-Out Approved!",
      message: `Your move-out request for ${mor.propertyDisplayName} is fully approved! Click 'Finalize Move-Out' to complete.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(appNotif);
    persistNotification(appNotif);
  }

  persistMoveOutRequest(mor);
  res.json(mor);
});

app.post("/api/move-out-requests/:id/reject", authenticateToken, (req: any, res: any) => {
  const mor = moveOutRequests.find((m) => m.id === req.params.id);
  if (!mor) return res.status(404).json({ error: "Move-out request not found" });

  const prop = properties.find((p) => p.id === mor.propertyId);

  if (req.user.role !== "Admin" && (prop && req.user.id !== prop.ownerId)) {
    return res.status(403).json({ error: "Unauthorized to reject this move-out request." });
  }

  mor.status = "Rejected";
  persistMoveOutRequest(mor);

  const rejNotif = {
    id: `n-${Date.now()}`,
    userId: mor.userId,
    title: "Move-Out Request Rejected",
    message: `Your move-out request for ${mor.propertyDisplayName} was rejected.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(rejNotif);
  persistNotification(rejNotif);

  res.json(mor);
});

app.post("/api/move-out-requests/:id/cancel", authenticateToken, (req: any, res: any) => {
  const mor = moveOutRequests.find((m) => m.id === req.params.id);
  if (!mor) return res.status(404).json({ error: "Move-out request not found" });

  if (req.user.id !== mor.userId && req.user.role !== "Admin") {
    return res.status(403).json({ error: "Unauthorized to cancel this move-out request." });
  }

  mor.status = "Cancelled";
  persistMoveOutRequest(mor);
  res.json(mor);
});

app.post("/api/move-out-requests/:id/finalize", authenticateToken, (req: any, res: any) => {
  const mor = moveOutRequests.find((m) => m.id === req.params.id);
  if (!mor) return res.status(404).json({ error: "Move-out request not found" });

  if (mor.userId !== req.user.id) {
    return res.status(403).json({ error: "Only the requesting resident can finalize move-out." });
  }

  if (mor.status !== "Approved - Ready to Finalize") {
    return res.status(400).json({ error: "Move-out request is not fully approved yet or is already completed." });
  }

  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const prop = properties.find((p) => p.id === mor.propertyId);
  if (prop) {
    prop.residentList = prop.residentList.filter((uid) => uid !== user.id);
    persistProperty(prop);
  }

  user.currentPropertyId = null;
  user.status = "Moved Out";
  persistUser(user);

  mor.status = "Completed";
  persistMoveOutRequest(mor);

  // Auto-cancel future bookings
  const now = new Date();
  bookings.forEach((b) => {
    if (b.userId === user.id && b.status === "Booked" && new Date(b.startTime) > now) {
      b.status = "Cancelled";
      persistBooking(b);
    }
  });

  const finNotif = {
    id: `n-${Date.now()}`,
    userId: user.id,
    title: "Move-Out Completed",
    message: `You have finalized your move-out from ${prop ? prop.displayName : "property"}.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(finNotif);
  persistNotification(finNotif);

  res.json({ message: "Move-out finalized successfully.", user });
});

// Finalize Move Out
app.post("/api/residency/move-out", authenticateToken, (req: any, res: any) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.currentPropertyId) {
    return res.status(400).json({ error: "User is currently not residing in any property." });
  }

  // Check if user has a move-in request still awaiting owner and admin approvals
  const pendingMoveIn = moveRequests.find(
    (m) => m.userId === user.id && m.status === "Pending Approvals"
  );
  if (pendingMoveIn) {
    return res.status(400).json({
      error: `Move-out locked: Your move-in request to ${pendingMoveIn.toPropertyName} is pending approvals from the owner and admin. You can move out once approved.`
    });
  }

  const currentProp = properties.find((p) => p.id === user.currentPropertyId);
  if (currentProp) {
    currentProp.residentList = currentProp.residentList.filter((uid) => uid !== user.id);
    persistProperty(currentProp);
  }

  user.currentPropertyId = null;
  user.status = "Moved Out";
  persistUser(user);

  // Auto-cancel future bookings
  const now = new Date();
  bookings.forEach((b) => {
    if (b.userId === user.id && b.status === "Booked" && new Date(b.startTime) > now) {
      b.status = "Cancelled";
      persistBooking(b);
    }
  });

  const outNotif = {
    id: `n-${Date.now()}`,
    userId: user.id,
    title: "Move-Out Executed",
    message: `You have successfully moved out of ${currentProp ? currentProp.displayName : "your property"}.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(outNotif);
  persistNotification(outNotif);

  res.json({ message: "Move out completed successfully.", user });
});

// Finalize Move In (Step 4 of transition)
app.post("/api/residency/move-in-finalize", authenticateToken, (req: any, res: any) => {
  const { moveRequestId } = req.body;
  const mr = moveRequests.find((m) => m.id === moveRequestId);
  if (!mr) return res.status(404).json({ error: "Move request not found" });

  if (mr.userId !== req.user.id) {
    return res.status(403).json({ error: "Unauthorized move-in attempt" });
  }

  if (mr.status !== "Approved - Waiting for Move-Out") {
    return res.status(400).json({ error: "Move request is not fully approved or is already completed." });
  }

  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Validate user is NOT in any residentList
  const isCurrentlyResiding = properties.some((p) => p.residentList.includes(user.id));
  if (isCurrentlyResiding) {
    return res.status(400).json({
      error: "You must execute Move-Out from your current property before completing Move-In to the new property."
    });
  }

  const toProp = properties.find((p) => p.id === mr.toPropertyId);
  if (!toProp) return res.status(404).json({ error: "Destination property not found" });

  toProp.residentList.push(user.id);
  persistProperty(toProp);

  user.currentPropertyId = toProp.id;
  user.status = "Approved";
  persistUser(user);

  mr.status = "Completed";
  persistMoveRequest(mr);

  const welcomeNotif = {
    id: `n-${Date.now()}`,
    userId: user.id,
    title: "Move-In Complete!",
    message: `Welcome to your new home at ${toProp.displayName}!`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(welcomeNotif);
  persistNotification(welcomeNotif);

  res.json({ message: "Move-in finalized successfully!", user });
});

// Maintenance Management APIs
app.get("/api/maintenance", authenticateToken, (req: any, res: any) => {
  res.json(maintenanceRequests);
});

app.post("/api/maintenance", authenticateToken, (req: any, res: any) => {
  const { propertyId, issueDescription, priority } = req.body;
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const prop = properties.find((p) => p.id === propertyId);
  if (!prop) return res.status(404).json({ error: "Property not found" });

  // Verification: User must belong to property (either owner or active resident)
  const isOwner = prop.ownerId === user.id;
  const isResident = prop.residentList.includes(user.id);
  if (!isOwner && !isResident && user.role !== "Admin") {
    return res.status(403).json({ error: "You can only create maintenance requests for properties you belong to." });
  }

  const newReq: MaintenanceRequest = {
    id: `m-${Date.now()}`,
    propertyId: prop.id,
    propertyDisplayName: prop.displayName,
    createdBy: user.id,
    creatorName: user.name,
    creatorRole: user.role,
    issueDescription,
    priority: priority || "Medium",
    status: "Pending",
    createdDate: new Date().toISOString()
  };

  maintenanceRequests.push(newReq);
  persistMaintenance(newReq);

  // Notify Staff & Admin
  const ticketNotif = {
    id: `n-${Date.now()}`,
    userId: "ALL_STAFF",
    title: "New Maintenance Ticket",
    message: `New ${newReq.priority} priority ticket reported for ${prop.displayName}.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(ticketNotif);
  persistNotification(ticketNotif);

  res.status(201).json(newReq);
});

// Staff Pick Request
app.post("/api/maintenance/:id/claim", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Staff") {
    return res.status(403).json({ error: "Only Staff members can claim maintenance tickets." });
  }

  const reqObj = maintenanceRequests.find((m) => m.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: "Ticket not found" });

  if (reqObj.status !== "Pending") {
    return res.status(400).json({ error: "Ticket is already claimed or in progress." });
  }

  reqObj.assignedStaffId = req.user.id;
  reqObj.assignedStaffName = req.user.name;
  reqObj.status = "In Progress";
  persistMaintenance(reqObj);

  res.json(reqObj);
});

// Staff Un-claim Request
app.post("/api/maintenance/:id/unclaim", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Staff") {
    return res.status(403).json({ error: "Only Staff can unclaim tickets" });
  }

  const reqObj = maintenanceRequests.find((m) => m.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: "Ticket not found" });

  if (reqObj.assignedStaffId !== req.user.id) {
    return res.status(403).json({ error: "You are not assigned to this ticket" });
  }

  reqObj.assignedStaffId = null;
  reqObj.assignedStaffName = null;
  reqObj.status = "Pending";
  persistMaintenance(reqObj);

  res.json(reqObj);
});

// Staff Resolve Request (Submits for Admin Approval)
app.post("/api/maintenance/:id/resolve", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Staff") {
    return res.status(403).json({ error: "Only Staff can resolve tickets" });
  }

  const reqObj = maintenanceRequests.find((m) => m.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: "Ticket not found" });

  if (reqObj.assignedStaffId !== req.user.id) {
    return res.status(403).json({ error: "You can only resolve tickets assigned to you." });
  }

  reqObj.status = "Waiting for Admin Approval";
  persistMaintenance(reqObj);

  const resNotif = {
    id: `n-${Date.now()}`,
    userId: "u-admin",
    title: "Maintenance Ticket Resolved (Pending Approval)",
    message: `Staff ${req.user.name} resolved ticket for ${reqObj.propertyDisplayName}. Needs final admin sign-off.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(resNotif);
  persistNotification(resNotif);

  res.json(reqObj);
});

// Admin Finalize Maintenance Ticket
app.post("/api/maintenance/:id/finalize", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can finalize maintenance tickets." });
  }

  const { approved } = req.body;
  const reqObj = maintenanceRequests.find((m) => m.id === req.params.id);
  if (!reqObj) return res.status(404).json({ error: "Ticket not found" });

  if (approved) {
    reqObj.status = "Completed";
    reqObj.completedDate = new Date().toISOString();

    const compNotif = {
      id: `n-${Date.now()}`,
      userId: reqObj.createdBy,
      title: "Maintenance Completed",
      message: `Maintenance issue for ${reqObj.propertyDisplayName} has been resolved and verified!`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(compNotif);
    persistNotification(compNotif);
  } else {
    reqObj.status = "Pending";
    reqObj.assignedStaffId = null;
    reqObj.assignedStaffName = null;
  }

  persistMaintenance(reqObj);
  res.json(reqObj);
});

// Amenity Management & Bookings
app.get("/api/amenities", (req, res) => {
  res.json(amenities.filter((a) => !a.isDeleted));
});

app.post("/api/amenities", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can create amenities" });
  }

  if (!verifyAdminSpecialPassword(req)) {
    return res.status(401).json({ error: "Invalid Management Security Key." });
  }

  const { name, type, category, operatingHours, description, image } = req.body;
  const newAmenity: Amenity = {
    id: `a-${Date.now()}`,
    name,
    type: type || "bookable",
    category: category || "Sports",
    operatingHours: operatingHours || "06:00 AM - 10:00 PM",
    description: description || "",
    image: image || "/assets/amenities/badminton 1.avif"
  };

  amenities.push(newAmenity);
  persistAmenity(newAmenity);
  res.status(201).json(newAmenity);
});

// Update Amenity Image (Admin Only)
app.put("/api/amenities/:id/image", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can change amenity images" });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Image path is required" });
  }

  const item = amenities.find((a) => a.id === req.params.id && !a.isDeleted);
  if (!item) {
    return res.status(404).json({ error: "Amenity not found" });
  }

  item.image = image;
  persistAmenity(item);
  res.json({ message: "Amenity image updated successfully", amenity: item });
});

// Assets API to list available files in /assets/properties and /assets/amenities
app.get("/api/assets", (req, res) => {
  try {
    const propDir = path.join(process.cwd(), "assets", "properties");
    const amenDir = path.join(process.cwd(), "assets", "amenities");

    const propertyFiles = fs.existsSync(propDir)
      ? fs.readdirSync(propDir).filter((f) => !f.startsWith(".")).map((f) => `/assets/properties/${f}`)
      : [
          "/assets/properties/apartment 1.avif",
          "/assets/properties/apartment 2.avif",
          "/assets/properties/apartment 3.jpg",
          "/assets/properties/apartment 4.jpg",
          "/assets/properties/apartment 5.jpg",
          "/assets/properties/apartment 6.jpg"
        ];

    const amenityFiles = fs.existsSync(amenDir)
      ? fs.readdirSync(amenDir).filter((f) => !f.startsWith(".")).map((f) => `/assets/amenities/${f}`)
      : [
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

    res.json({ properties: propertyFiles, amenities: amenityFiles });
  } catch (err) {
    res.status(500).json({ error: "Failed to list assets" });
  }
});

app.delete("/api/amenities/:id", authenticateToken, (req: any, res: any) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Only Admin can delete amenities" });
  }

  if (!verifyAdminSpecialPassword(req)) {
    return res.status(401).json({ error: "Invalid Management Security Key." });
  }

  const item = amenities.find((a) => a.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Amenity not found" });

  item.isDeleted = true;
  persistAmenity(item);

  // Auto-cancel future bookings
  const now = new Date();
  bookings.forEach((b) => {
    if (b.amenityId === item.id && b.status === "Booked" && new Date(b.startTime) > now) {
      b.status = "Cancelled";
      persistBooking(b);
    }
  });

  res.json({ message: "Amenity deleted. Future bookings cancelled; past history preserved." });
});

// Amenity Bookings APIs
app.get("/api/bookings", authenticateToken, (req: any, res: any) => {
  updateBookingStatuses();
  res.json(bookings);
});

app.post("/api/bookings", authenticateToken, (req: any, res: any) => {
  updateBookingStatuses();
  const { amenityId, startTime, endTime, localStartTime, localEndTime } = req.body;
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Verification: Booking Permissions
  // Staff cannot book
  if (user.role === "Staff") {
    return res.status(403).json({ error: "Staff members cannot book amenities." });
  }

  let isResident = false;
  let resPropName = "";

  if (user.role === "Admin") {
    isResident = true;
    resPropName = "Admin Complex Pass";
  } else if (user.status === "Approved" && user.currentPropertyId) {
    isResident = true;
    const p = properties.find((prop) => prop.id === user.currentPropertyId);
    resPropName = p ? p.displayName : "Resident Complex Unit";
  }

  if (!isResident) {
    return res.status(403).json({
      error: "Amenity booking is restricted to residents assigned to a property or living inside the apartment complex."
    });
  }

  const amenity = amenities.find((a) => a.id === amenityId && !a.isDeleted);
  if (!amenity) return res.status(404).json({ error: "Amenity not found" });

  if (amenity.type !== "bookable") {
    return res.status(400).json({ error: "This amenity is common/non-bookable." });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return res.status(400).json({ error: "Start time must be prior to end time." });
  }

  // Prevent booking past time
  const now = new Date();
  if (start < now) {
    return res.status(400).json({ error: "Cannot book a past date or time slot. Please select a current or future time." });
  }

  // Validate booking duration (minimum 1 hour, maximum 4 hours)
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (durationHours < 0.999 || durationHours > 4.001) {
    return res.status(400).json({ error: "Booking duration must be greater than or equal to 1 hour and less than or equal to 4 hours." });
  }

  // Operating Hours Check
  if (!isWithinOperatingHours(start, end, amenity.operatingHours, localStartTime, localEndTime)) {
    return res.status(400).json({
      error: `This amenity cannot be booked at this time. Amenity operating hours are ${amenity.operatingHours}.`
    });
  }

  // Check Overlaps
  const overlap = bookings.some(
    (b) =>
      b.amenityId === amenityId &&
      b.status === "Booked" &&
      new Date(b.startTime) < end &&
      new Date(b.endTime) > start
  );

  if (overlap) {
    return res.status(409).json({ error: "Selected time slot is already booked. Please choose another interval." });
  }

  // Check 6-Hour Weekly Quota Limit per resident
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const totalBookedHoursInWeek = bookings
    .filter(
      (b) =>
        b.userId === user.id &&
        b.amenityId === amenityId &&
        b.status !== "Cancelled" &&
        new Date(b.startTime) >= oneWeekAgo
    )
    .reduce((sum, b) => {
      const dur = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
      return sum + dur;
    }, 0);

  if (totalBookedHoursInWeek + durationHours > 6) {
    return res.status(400).json({
      error: `Weekly booking quota exceeded! Maximum allowed is 6 hours per week for ${amenity.name}. You have already booked ${totalBookedHoursInWeek.toFixed(1)} hours this week.`
    });
  }

  const newBooking: AmenityBooking = {
    id: `b-${Date.now()}`,
    amenityId: amenity.id,
    amenityName: amenity.name,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    propertyDisplayName: resPropName,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status: "Booked",
    createdAt: new Date().toISOString()
  };

  bookings.push(newBooking);
  persistBooking(newBooking);
  res.status(201).json(newBooking);
});

app.post("/api/bookings/:id/cancel", authenticateToken, (req: any, res: any) => {
  const b = bookings.find((item) => item.id === req.params.id);
  if (!b) return res.status(404).json({ error: "Booking not found" });

  if (b.userId !== req.user.id && req.user.role !== "Admin") {
    return res.status(403).json({ error: "Not authorized to cancel this booking" });
  }

  b.status = "Cancelled";
  persistBooking(b);
  res.json({ message: "Booking cancelled successfully.", booking: b });
});

// Notification APIs
app.get("/api/notifications", authenticateToken, (req: any, res: any) => {
  const userNotes = notifications.filter(
    (n) =>
      n.userId === req.user.id ||
      (req.user.role === "Admin" && n.userId === "u-admin") ||
      (req.user.role === "Staff" && n.userId === "ALL_STAFF")
  );
  // Sort newest first
  userNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userNotes);
});

app.post("/api/notifications/mark-read", authenticateToken, (req: any, res: any) => {
  notifications.forEach((n) => {
    if (
      n.userId === req.user.id ||
      (req.user.role === "Admin" && n.userId === "u-admin") ||
      (req.user.role === "Staff" && n.userId === "ALL_STAFF")
    ) {
      n.read = true;
      persistNotification(n);
    }
  });
  res.json({ message: "Notifications marked as read" });
});

// Vite Development Integration / Static Assets
async function startServer() {
  const PORT = 3000;

  // Initialize and Sync MongoDB database if MONGODB_URI is configured
  try {
    await syncDbWithSeed({
      users,
      properties,
      amenities,
      maintenanceRequests,
      notifications
    });

    const dbData = await loadDataFromDb();
    if (dbData) {
      if (dbData.users.length) {
        dbData.users.forEach((u: any) => {
          if (u.role !== "Admin") {
            delete u.management_security_key;
          }
        });
        users.splice(0, users.length, ...(dbData.users as any));
      }
      if (dbData.properties.length) properties.splice(0, properties.length, ...(dbData.properties as any));
      if (dbData.amenities.length) amenities.splice(0, amenities.length, ...(dbData.amenities as any));
      if (dbData.maintenanceRequests.length) maintenanceRequests.splice(0, maintenanceRequests.length, ...(dbData.maintenanceRequests as any));
      if (dbData.bookings.length) bookings.splice(0, bookings.length, ...(dbData.bookings as any));
      if (dbData.notifications.length) notifications.splice(0, notifications.length, ...(dbData.notifications as any));
      if (dbData.ownershipRequests.length) ownershipRequests.splice(0, ownershipRequests.length, ...(dbData.ownershipRequests as any));
      if (dbData.moveRequests.length) moveRequests.splice(0, moveRequests.length, ...(dbData.moveRequests as any));
      if (dbData.moveOutRequests.length) moveOutRequests.splice(0, moveOutRequests.length, ...(dbData.moveOutRequests as any));
      if (dbData.unclaimRequests.length) unclaimRequests.splice(0, unclaimRequests.length, ...(dbData.unclaimRequests as any));
      console.log("⚡ Synchronized live state from MongoDB database successfully!");
    }

    // Ensure Admin user has a hashed management_security_key stored in MongoDB
    const adminUser = users.find((u) => u.role === "Admin" && !u.isDeleted);
    if (adminUser) {
      if (!adminUser.management_security_key) {
        adminUser.management_security_key = bcrypt.hashSync(process.env.MANAGEMENT_SECURITY_KEY || "special123", 10);
        persistUser(adminUser);
      }
    }
  } catch (dbErr) {
    console.error("MongoDB initialization warning:", dbErr);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Property Management Platform Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
