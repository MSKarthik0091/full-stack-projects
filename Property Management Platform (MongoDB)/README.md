# Property Management Platform

A modern, full-stack **Property Rental, Maintenance & Amenity Management System** built with **React 19**, **TypeScript**, **Vite**, **Express**, and **Tailwind CSS**.

---

## 📖 Overview

The **Property Management Platform** is a full-featured web application designed to streamline community living, apartment complex administration, tenant onboarding, maintenance tracking, and facility bookings. It supports multi-role access control, multi-step approval workflows for residency transitions, and real-time status management.

---

## ✨ Key Features

### 🔐 1. Authentication & Role-Based Access Control (RBAC)
- **Role Permissions**: Tailored views and capabilities for **Admin**, **Owner**, **Tenant**, and **Staff**.
- **Secure Authentication**: JWT-based authentication with bcrypt password encryption.
- **Admin Security Key**: Protected administrative actions (such as adding/deleting properties or resetting keys) guarded by a configurable Management Security Key.

### 🏢 2. Property & Tower Management
- **Tower Administration**: Dynamically manage residential towers (e.g., *Hill Tower*, *Lake Tower*, *East Tower*, *Stellar Tower*).
- **Unit Tracking**: Detailed apartment specs (bedrooms, balconies, owner, resident list, and image galleries).
- **Ownership Requests**: Users can request ownership of unowned properties, subject to Admin approval.
- **Property Surrender / Unclaim**: Property owners can request to unclaim/surrender property records with Admin review.

### 🚚 3. Two-Step Residency Workflows (Move-In / Move-Out)
- **Move-In Workflow**: Prospective tenants submit move-in requests that require approval from both the **Property Owner** and **System Admin**.
- **Move-Out Workflow**: Controlled move-out transitions ensuring zero active residents before property status changes or ownership transfers occur.

### 🛠️ 4. Maintenance Request Pipeline
- **Issue Reporting**: Tenants and Owners can raise maintenance requests with specific priority levels (*Low*, *Medium*, *High*).
- **Staff Assignment**: Admins assign issues to dedicated maintenance staff members (*e.g., David Morgan, Isabella Lockhart*).
- **Status Lifecycle**: Track requests through `Pending` ➔ `In Progress` ➔ `Waiting for Admin Approval` ➔ `Completed`.

### 🏸 5. Amenity & Facility Booking Engine
- **Bookable Amenities**: Schedule slots for Badminton Courts, Cricket Turfs, and Party Halls.
- **Common Amenities**: Access schedules for Swimming Pools, Gyms, and Gaming Zones.
- **Operating Hours Validation**: Automatic validation prevents bookings outside facility opening hours or overlapping schedule conflicts.

### 🔔 6. Notification System
- **Real-time Alerts**: Role-targeted and individual notifications for pending approvals, maintenance status updates, and tenancy changes.
- **Unread Badge & History**: Quick mark-as-read functionality with full history logs.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React Icons, Motion (Framer Motion).
- **Backend**: Express.js, TypeScript (`tsx`), JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`).
- **Database**: Dual Engine — MongoDB (via Mongoose) with automatic Fallback In-Memory Engine for seamless offline or development execution.
- **Build System**: Vite (client bundle) + Esbuild (bundled CJS server).

---

## 📂 Directory Structure

```text
├── assets/                  # Static assets (property & amenity images)
├── src/
│   ├── components/          # React UI views & components
│   │   ├── Navbar.tsx             # Top navigation & notifications header
│   │   ├── Dashboard.tsx          # Overview dashboard with key stats & actions
│   │   ├── PropertiesView.tsx     # Property listings, towers, & move workflows
│   │   ├── MaintenanceView.tsx    # Issue tracking & staff assignment
│   │   ├── AmenitiesView.tsx      # Facility booking calendar & management
│   │   ├── UsersView.tsx          # Admin user directory & approval center
│   │   ├── NotificationsView.tsx  # User notification inbox
│   │   ├── AuthModal.tsx          # Login & registration modal
│   │   └── ProfileModal.tsx       # User profile & password management
│   ├── App.tsx              # Main React application entry & state wrapper
│   ├── main.tsx             # React DOM root render
│   ├── types.ts             # Global TypeScript interfaces & data models
│   └── index.css            # Tailwind CSS styling entry
├── server.ts                # Express REST API backend & Vite integration
├── db.ts                    # MongoDB connection & persistence fallback sync engine
├── package.json             # NPM dependencies & build scripts
├── vite.config.ts           # Vite configuration
└── metadata.json            # Application metadata
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
Make sure you have **Node.js** (v18 or higher) installed on your system.

### 1. Clone or Extract Project
Place the project folder on your local computer.

### 2. Install Dependencies
Open your terminal inside the project directory and run:

```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Configure your `.env` variables if needed:
```env
JWT_SECRET=your_custom_jwt_secret_here
MANAGEMENT_SECURITY_KEY=special123
MONGODB_URI=mongodb://localhost:27017/property_management
```
*(Note: If `MONGODB_URI` is omitted or unavailable, the application automatically runs in fast in-memory mode with seeded data.)*

### 4. Run Development Server
Start the full-stack development server:

```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 5. Build for Production
To test or build the application for production deployment:

```bash
npm run build
npm start
```

---

## 📋 Default Test Credentials

For quick testing, you can use the built-in demo accounts:

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@complex.com` | `admin123` |
| **Property Owner** | `robert@owner.com` | `owner123` |
| **Property Owner** | `elena@owner.com` | `owner123` |
| **Tenant** | `kyle.simmons@example.com` | `tenant123` |
| **Staff** | `david@staff.com` | `staff123` |

*(Note: Management Security Key for Admin actions defaults to `special123`)*

---

## 📤 Pushing This Folder to GitHub / Git Repository

If you have created a new empty repository on GitHub/GitLab and want to push this entire project folder into it, follow these steps in your PC's terminal inside this folder:

1. **Initialize Git** (if not already initialized):
   ```bash
   git init
   ```

2. **Add all files to staging**:
   ```bash
   git add .
   ```

3. **Create initial commit**:
   ```bash
   git commit -m "Initial commit - Property Management Platform"
   ```

4. **Rename branch to `main`**:
   ```bash
   git branch -M main
   ```

5. **Link your remote Git repository** *(replace URL with your actual Git repo URL)*:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   ```

6. **Push code to remote repository**:
   ```bash
   git push -u origin main
   ```

---

## 📄 License

This project is open source and available under the Apache-2.0 License.
