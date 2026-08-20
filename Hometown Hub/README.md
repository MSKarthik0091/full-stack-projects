# Hometown Hub

A modern, full-stack **Hyperlocal Community & Neighborhood Governance Platform** built with **React 19**, **TypeScript**, **Vite**, **Express**, **Tailwind CSS v4**, and **Lucide React Icons**.

---

## 📖 Overview

**Hometown Hub** is a full-featured digital town square designed to connect verified local residents, foster civic engagement, organize neighborhood events, and support role-based community stewardship across towns, localities, and villages (e.g., *Besant Nagar*, *Medavakkam*, *Velachery*, *Greenfield Village*, *Brooklyn Heights*).

The platform features a multi-tiered governance structure supporting **Platform Admins**, **Community Admins**, **Moderators**, **Members**, and **Guests**. It includes automated duplicate locality checks, event proposal pipelines, verified resident directories, interactive demo persona switching, and dual-engine data persistence (JSON File Store + MongoDB fallback/sync).

---

## ✨ Key Features

### 🔐 1. Authentication & Role-Based Governance (RBAC)
- **Hierarchical Roles**:
  - **Platform Admin**: Global system oversight, community creation approvals, assigning local admins, and platform audit logging.
  - **Community Admin**: Manages local branding, approves membership applications, appoints co-admins and moderators, and approves event proposals.
  - **Moderator**: Content moderation, reviewing reports, soft-deleting flagged posts/comments, and maintaining civic standards.
  - **Member**: Verified resident posting, commenting, reacting, creating event proposals, and viewing local directories.
  - **Guest**: Public browsing of open community feeds and upcoming public events.
- **Interactive Demo Persona Switcher**: Instantly switch between pre-configured test personas (*e.g., Platform Admin, Arun Kumar, Priya Sundaram, Karthik Raman, Deepa Venkat, Oliver Holloway*) to test role permissions dynamically.
- **JWT & Password Security**: Signed JWT bearer token authentication with user profile privacy settings (*Public vs. Private profile photo, bio, and hometown*).

### 🏘️ 2. Locality & Community Discovery Engine
- **Geographic Locality Hierarchies**: Geo-structured communities mapped by Country, State, District, Town/Locality, Postal Code, and coordinates.
- **Locality Uniqueness & Anti-Duplication**: Built-in uniqueness verification engine prevents fragmented duplicate communities for the same geographic locality.
- **Community Creation Proposals**: Residents can submit community creation requests subject to Platform Admin review and similarity checks.
- **Admin-Less Community Oversight**: Un-administered communities (*e.g., Greenfield Village*) automatically fall under temporary Platform Admin oversight with open candidate invitation workflows.

### 👥 3. Residency Verification & Co-Admin Stewardship
- **Multi-Method Verification**: Community Admins verify resident connections via phone, in-person, email, or document proof.
- **Role Offers & Invites**: Community Admins can extend Moderator or Co-Admin role offers to active members via top-bar notification banners.
- **Sole Admin Protections**: Safety warnings prevent sole Community Admins from leaving without acknowledging fallback to Admin-less status.

### 📰 4. Community Feed, Discussions & Media Attachments
- **Categorized Feed**: Filter posts by *General*, *Discussion*, *Local News*, *Culture*, *Announcement*, and *Initiative*.
- **Privacy Controls**: Public posts visible to all visitors vs. Private (Resident-Only) posts reserved for verified local members.
- **Reactions & Threaded Comments**: Multi-reaction support (*like*, *helpful*, *heart*, *celebrate*) and nested comment discussions.
- **Media Attachments**: Support for uploading and serving post image attachments via `/uploads/posts/`.

### 📅 5. Event Scheduling & Proposal Engine
- **Event Lifecycle**: Schedule and manage local events with status indicators (`active`, `cancelled`, `completed`) and live indicators (`🔴 LIVE NOW`).
- **Proposal Approval Pipeline**: Member-created events enter a `pending` state requiring review and approval by Community Admins.
- **RSVP & Capacity Tracking**: Track attendee RSVPs (*going*, *interested*, *waitlist*, *cancelled*) with automatic capacity management.

### 🛡️ 6. Moderation, Reporting & Audit Logging
- **Flagging & Reporting**: Members can flag inappropriate posts, comments, events, or user profiles with detailed reasons.
- **Moderation Queue**: Dedicated panel for Moderators and Community Admins to review pending reports, execute content removals, or dismiss flags.
- **Platform Audit Logs**: Immutable audit trails recording key governance events (*community approvals, role promotions, moderation actions*).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React Icons, Motion (Framer Motion).
- **Backend**: Express.js, TypeScript (`tsx`), JWT (`jsonwebtoken`), Dotenv.
- **Database Engine**: Dual Engine — JSON File Store (`data/hometownhub-db.json`) with automatic MongoDB (Mongoose) hydration and synchronization when `MONGODB_URI` is provided.
- **Build System**: Vite (client SPA build) + Esbuild (bundled CommonJS server `dist/server.cjs`).

---

## 📂 Directory Structure

```text
Hometown Hub/
│
├── data/
│   └── hometownhub-db.json
│
├── server/
│   ├── models/
│   │   └── index.ts
│   ├── db.ts
│   ├── mongo.ts
│   └── seedData.ts
│
├── src/
│   ├── components/
│   │   ├── AuthPage.tsx
│   │   ├── CommunityAdminPanel.tsx
│   │   ├── CommunityBrandingModal.tsx
│   │   ├── CommunityDiscovery.tsx
│   │   ├── CommunityView.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── CreateEventModal.tsx
│   │   ├── CreatePostModal.tsx
│   │   ├── EventsSection.tsx
│   │   ├── ImageSelector.tsx
│   │   ├── MemberDirectory.tsx
│   │   ├── Navbar.tsx
│   │   ├── PendingRoleOffersBanner.tsx
│   │   ├── PersonaSwitcher.tsx
│   │   ├── PlatformAdminDashboard.tsx
│   │   ├── PostCard.tsx
│   │   ├── ProfilePhotoSelector.tsx
│   │   ├── ReportModal.tsx
│   │   ├── RequestCommunityModal.tsx
│   │   ├── RequestRoleModal.tsx
│   │   └── UserProfileModal.tsx
│   │
│   ├── api.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── uploads/
│   └── posts/
│       └── .gitkeep
│
├── .env.example
├── .gitignore
├── bun.lock
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
└── vite.config.ts
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
PORT=3000
JWT_SECRET=hometown_hub_jwt_super_secret_key_2026_secure_random_string_dev
MONGODB_URI=mongodb://localhost:27017/hometown_hub
```
*(Note: If `MONGODB_URI` is omitted or unavailable, the application automatically operates using the local JSON database engine in `data/hometownhub-db.json` initialized with seed data.)*

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

## 📋 Default Test Credentials & Demo Personas

For quick testing, you can use the built-in demo accounts or the top **Persona Switcher** bar:

| Name / Persona | Username | Designation & Community | Default Password |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin` | Global Platform Admin | `admin123` |
| **Arun Kumar** | `arunkumar` | Community Admin (Besant Nagar) | `arun123` |
| **Priya Sundaram** | `priya_s` | Community Co-Admin (Besant Nagar) | `priya123` |
| **Karthik Raman** | `karthik_r` | Community Moderator (Besant Nagar) | `karthik123` |
| **Deepa Venkat** | `deepa_v` | Community Admin (Medavakkam) & Member (Besant Nagar) | `deepa123` |
| **Oliver Holloway** | `oliver_h` | Active Member & Admin Candidate (Greenfield Village) | `oliver123` |
| **Emma Watson-Smith** | `emma_ws` | Community Moderator (Greenfield Village) | `emma123` |

---

## 📤 Pushing This Folder to GitHub / Git Repository

If you want to push this entire project folder to a GitHub/GitLab repository, run these commands in your terminal inside this project directory:

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
   git commit -m "Initial commit - Hometown Hub Hyperlocal Community Platform"
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

This project is released under the **MIT License**.
