import mongoose, { Schema, Document } from "mongoose";

// --- Mongoose Schemas ---

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, required: true },
  management_security_key: { type: String },
  dateOfBirth: { type: String },
  gender: { type: String },
  propertiesOwned: [{ type: String }],
  currentPropertyId: { type: String, default: null },
  requestedPropertyId: { type: String, default: null },
  requestedPropertyIds: [{ type: String }],
  livesInside: { type: Boolean, default: false },
  residencePropertyId: { type: String, default: null },
  ownerApproved: { type: Boolean, default: false },
  adminApproved: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: String }
}, { timestamps: true, strict: false });

const PropertySchema = new Schema({
  id: { type: String, required: true, unique: true },
  block: { type: String, required: true },
  unit: { type: String, required: true },
  displayName: { type: String, required: true },
  ownerId: { type: String, default: null },
  residentList: [{ type: String }],
  bedrooms: { type: Number },
  balconies: { type: Number },
  details: { type: String },
  image: { type: String },
  createdAt: { type: String }
}, { timestamps: true, strict: false });

const AmenitySchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String },
  operatingHours: { type: String },
  description: { type: String },
  image: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true, strict: false });

const MaintenanceRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  propertyId: { type: String },
  propertyDisplayName: { type: String },
  createdBy: { type: String },
  creatorName: { type: String },
  creatorRole: { type: String },
  issueDescription: { type: String },
  priority: { type: String },
  status: { type: String },
  assignedStaffId: { type: String, default: null },
  assignedStaffName: { type: String, default: null },
  createdDate: { type: String },
  completedDate: { type: String, default: null }
}, { timestamps: true, strict: false });

const AmenityBookingSchema = new Schema({
  id: { type: String, required: true, unique: true },
  amenityId: { type: String },
  amenityName: { type: String },
  userId: { type: String },
  userName: { type: String },
  userRole: { type: String },
  propertyDisplayName: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  status: { type: String },
  createdAt: { type: String }
}, { timestamps: true, strict: false });

const NotificationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  title: { type: String },
  message: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: String }
}, { timestamps: true, strict: false });

const OwnershipRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  propertyId: { type: String },
  propertyDisplayName: { type: String },
  requesterId: { type: String },
  requesterName: { type: String },
  requesterRole: { type: String },
  currentOwnerId: { type: String, default: null },
  status: { type: String },
  adminApproved: { type: Boolean, default: false },
  ownerApproved: { type: Boolean, default: false },
  createdAt: { type: String }
}, { timestamps: true, strict: false });

const MoveRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  userName: { type: String },
  fromPropertyId: { type: String, default: null },
  fromPropertyName: { type: String, default: null },
  toPropertyId: { type: String },
  toPropertyName: { type: String },
  status: { type: String },
  adminApproved: { type: Boolean, default: false },
  newOwnerApproved: { type: Boolean, default: false },
  createdAt: { type: String }
}, { timestamps: true, strict: false });

const MoveOutRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  userName: { type: String },
  userRole: { type: String },
  propertyId: { type: String },
  propertyDisplayName: { type: String },
  status: { type: String },
  adminApproved: { type: Boolean, default: false },
  ownerApproved: { type: Boolean, default: false },
  createdAt: { type: String }
}, { timestamps: true, strict: false });

const UnclaimRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  propertyId: { type: String },
  propertyDisplayName: { type: String },
  ownerId: { type: String },
  ownerName: { type: String },
  status: { type: String },
  createdAt: { type: String }
}, { timestamps: true, strict: false });

// Export Models
export const UserModel: any = mongoose.models.User || mongoose.model("User", UserSchema);
export const PropertyModel: any = mongoose.models.Property || mongoose.model("Property", PropertySchema);
export const AmenityModel: any = mongoose.models.Amenity || mongoose.model("Amenity", AmenitySchema);
export const MaintenanceRequestModel: any = mongoose.models.MaintenanceRequest || mongoose.model("MaintenanceRequest", MaintenanceRequestSchema);
export const AmenityBookingModel: any = mongoose.models.AmenityBooking || mongoose.model("AmenityBooking", AmenityBookingSchema);
export const NotificationModel: any = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export const OwnershipRequestModel: any = mongoose.models.OwnershipRequest || mongoose.model("OwnershipRequest", OwnershipRequestSchema);
export const MoveRequestModel: any = mongoose.models.MoveRequest || mongoose.model("MoveRequest", MoveRequestSchema);
export const MoveOutRequestModel: any = mongoose.models.MoveOutRequest || mongoose.model("MoveOutRequest", MoveOutRequestSchema);
export const UnclaimRequestModel: any = mongoose.models.UnclaimRequest || mongoose.model("UnclaimRequest", UnclaimRequestSchema);

export async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("ℹ️ MONGODB_URI environment variable not provided. Running in-memory / local mode.");
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Successfully connected to MongoDB!");
    return true;
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    return false;
  }
}

export async function syncDbWithSeed(defaultData: {
  users: any[];
  properties: any[];
  amenities: any[];
  maintenanceRequests: any[];
  notifications: any[];
}) {
  const connected = await connectMongoDB();
  if (!connected) return;

  try {
    // Perform automatic schema/data cleanup for security and accuracy:
    // 1. Never store plainPassword in MongoDB
    // 2. management_security_key should only exist for Admin users
    await UserModel.updateMany({}, { $unset: { plainPassword: 1 } });
    await UserModel.updateMany({ role: { $ne: "Admin" } }, { $unset: { management_security_key: 1 } });

    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      const cleanUsers = defaultData.users.map((u) => {
        const copy = { ...u };
        delete copy.plainPassword;
        if (copy.role !== "Admin") {
          delete copy.management_security_key;
        }
        return copy;
      });
      await UserModel.insertMany(cleanUsers);
      console.log(`🌱 Seeded ${cleanUsers.length} users into MongoDB.`);
    }

    const propCount = await PropertyModel.countDocuments();
    if (propCount === 0) {
      await PropertyModel.insertMany(defaultData.properties);
      console.log(`🌱 Seeded ${defaultData.properties.length} properties into MongoDB.`);
    }

    const amenCount = await AmenityModel.countDocuments();
    if (amenCount === 0) {
      await AmenityModel.insertMany(defaultData.amenities);
      console.log(`🌱 Seeded ${defaultData.amenities.length} amenities into MongoDB.`);
    }

    const maintCount = await MaintenanceRequestModel.countDocuments();
    if (maintCount === 0) {
      await MaintenanceRequestModel.insertMany(defaultData.maintenanceRequests);
      console.log(`🌱 Seeded ${defaultData.maintenanceRequests.length} maintenance requests into MongoDB.`);
    }

    const notifCount = await NotificationModel.countDocuments();
    if (notifCount === 0) {
      await NotificationModel.insertMany(defaultData.notifications);
      console.log(`🌱 Seeded ${defaultData.notifications.length} notifications into MongoDB.`);
    }
  } catch (err) {
    console.error("Error seeding MongoDB:", err);
  }
}

export async function loadDataFromDb() {
  if (mongoose.connection.readyState !== 1) return null;

  try {
    const users = await UserModel.find({}).lean();
    const properties = await PropertyModel.find({}).lean();
    const amenities = await AmenityModel.find({}).lean();
    const maintenanceRequests = await MaintenanceRequestModel.find({}).lean();
    const bookings = await AmenityBookingModel.find({}).lean();
    const notifications = await NotificationModel.find({}).lean();
    const ownershipRequests = await OwnershipRequestModel.find({}).lean();
    const moveRequests = await MoveRequestModel.find({}).lean();
    const moveOutRequests = await MoveOutRequestModel.find({}).lean();
    const unclaimRequests = await UnclaimRequestModel.find({}).lean();

    return {
      users,
      properties,
      amenities,
      maintenanceRequests,
      bookings,
      notifications,
      ownershipRequests,
      moveRequests,
      moveOutRequests,
      unclaimRequests
    };
  } catch (err) {
    console.error("Failed to load data from MongoDB:", err);
    return null;
  }
}

export async function persistUser(user: any) {
  if (mongoose.connection.readyState === 1) {
    const userToSave = { ...user };
    delete userToSave.plainPassword;
    if (userToSave.role !== "Admin") {
      delete userToSave.management_security_key;
    }

    const unsetFields: any = { plainPassword: 1 };
    if (userToSave.role !== "Admin") {
      unsetFields.management_security_key = 1;
    }

    await UserModel.findOneAndUpdate(
      { id: user.id },
      { $set: userToSave, $unset: unsetFields },
      { upsert: true, new: true }
    );
  }
}

export async function persistProperty(property: any) {
  if (mongoose.connection.readyState === 1) {
    await PropertyModel.findOneAndUpdate({ id: property.id }, property, { upsert: true, new: true });
  }
}

export async function persistAmenity(amenity: any) {
  if (mongoose.connection.readyState === 1) {
    await AmenityModel.findOneAndUpdate({ id: amenity.id }, amenity, { upsert: true, new: true });
  }
}

export async function persistMaintenance(m: any) {
  if (mongoose.connection.readyState === 1) {
    await MaintenanceRequestModel.findOneAndUpdate({ id: m.id }, m, { upsert: true, new: true });
  }
}

export async function persistBooking(b: any) {
  if (mongoose.connection.readyState === 1) {
    await AmenityBookingModel.findOneAndUpdate({ id: b.id }, b, { upsert: true, new: true });
  }
}

export async function persistNotification(n: any) {
  if (mongoose.connection.readyState === 1) {
    await NotificationModel.findOneAndUpdate({ id: n.id }, n, { upsert: true, new: true });
  }
}

export async function persistOwnershipRequest(r: any) {
  if (mongoose.connection.readyState === 1) {
    await OwnershipRequestModel.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
  }
}

export async function persistMoveRequest(r: any) {
  if (mongoose.connection.readyState === 1) {
    await MoveRequestModel.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
  }
}

export async function persistMoveOutRequest(r: any) {
  if (mongoose.connection.readyState === 1) {
    await MoveOutRequestModel.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
  }
}

export async function persistUnclaimRequest(r: any) {
  if (mongoose.connection.readyState === 1) {
    await UnclaimRequestModel.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
  }
}

export async function deletePropertyFromDb(id: string) {
  if (mongoose.connection.readyState === 1) {
    await PropertyModel.deleteOne({ id });
  }
}

export async function deleteAmenityFromDb(id: string) {
  if (mongoose.connection.readyState === 1) {
    await AmenityModel.deleteOne({ id });
  }
}
