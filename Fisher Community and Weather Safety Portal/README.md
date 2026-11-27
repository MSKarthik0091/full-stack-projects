# Fisher Community Market Access & Weather Safety Portal

A modern, full-stack **Location-Aware Fisher Community, Market Access & Marine Weather Safety Platform** built with **React 19**, **TypeScript**, **Vite**, **Express**, **Tailwind CSS v4**, **Mongoose / MongoDB**, and **Lucide React Icons**.

Live URL: https://full-stack-projects-3.onrender.com/
---

## 📖 Overview

The **Fisher Community Market Access & Weather Safety Portal** is a global, location-aware digital platform designed to empower small-scale and commercial fishing communities, foster fair seafood trade transparency, enhance maritime safety, and directly connect verified fishers with wholesale buyers, restaurants, and retail markets across coastal regions worldwide (*e.g., Seattle Harbor, Galle Coastal Harbor, Lisbon Doca do Bom Sucesso, Busan Jagalchi Seafood Market, Cape Town Waterfront, Toyosu Outer Market, Sydney Fish Market, Cochin Fishing Harbor, Kanniyakumari Fishing Harbor*).

The portal operates on a location-centric model where any visitor can access public marine weather forecasts, safety advisories, and market price benchmarks, while protected marketplace actions (*listing catches, sending purchase requests, approving accounts, updating market price benchmarks*) are governed by a strict role-based access control (RBAC) pipeline.

---

## ✨ Key Features

### 🔐 1. Authentication & Role-Based Governance (RBAC)
- **Hierarchical User Roles**:
  - **Portal Overseer (Admin)**: Full administrative authority, approving or rejecting fisher and buyer membership applications, managing global location registries, adding fish species, publishing marine safety warnings, updating price benchmarks, and inspecting audit trails.
  - **Approved Fisher**: Verified vessel operators who can manage vessel details, post fresh catch listings with photos and storage conditions, manage incoming purchase requests, accept/reject buyer offers, and track sales performance.
  - **Approved Buyer**: Verified wholesalers, restaurants, seafood markets, and processors who can browse active catch listings, send purchase requests with customized price offers, track request statuses, and contact fishers directly.
  - **Pending Account**: Newly registered fishers or buyers awaiting Admin review and verification before gaining marketplace privileges.
  - **Public Guest**: Unauthenticated visitors who can select any global location, view live marine weather forecasts, monitor active safety alerts, and inspect market price benchmark trends.
- **Interactive Demo Persona Switcher**: Instant 1-click test login presets (*e.g., Capt. Mateo Silva [Approved Fisher], Elena Rostova [Approved Buyer], System Overseer [Admin], Devon Vance [Pending Fisher], Klaus Webber [Pending Buyer]*) for dynamic testing.
- **JWT & Password Security**: Signed JSON Web Token (JWT) bearer authentication paired with PBKDF2 SHA512 password hashing and secure token session headers.

### 🌊 2. Location-Aware Marine Weather & Sea Safety Engine
- **Comprehensive Marine Metrics**: Real-time and forecasted atmospheric/oceanographic data including air temperature, feels-like index, wind speed/direction, wave height/period/direction, swell conditions, sea surface temperature, humidity, visibility, pressure, and UV index.
- **Marine Weather Forecasts**: Hourly step-by-step breakdown and multi-day sea condition outlooks tailored for maritime navigation planning.
- **Emergency Marine Safety Warnings**: Active safety alerts (`storm`, `high_waves`, `strong_wind`, `heavy_rain`, `cyclone`, `marine_warning`) categorized by severity level (`low`, `moderate`, `high`, `extreme`) with actionable safety advice.
- **Worldwide Location Search & Geocoding**: Search bar that enables users to query any coastal harbor, fishing zone, port, or city across the globe with auto-detected latitude/longitude coordinates and currency settings.

### 📈 3. Transparent Fish Market Price Dashboard
- **Market Price Benchmarks**: Transparent daily and historical price records across major commercial species (*Yellowfin Tuna, King Salmon, Atlantic Cod, Mahi Mahi, Giant Tiger Prawn, Red Snapper*).
- **Interactive Price Analytics**: Recharts-powered historical price trend visualizers showing minimum, maximum, and average price ranges over time.
- **Data Integrity & Provenance**: Tracks data sources (`admin`, `government`, `external_api`, `market_data`), currency conversions, and verification status (`verified`, `unverified`).

### 🛒 4. Direct Buyer-Fisher Catch Marketplace
- **Detailed Catch Listings**: Fishers can create listings specifying species, available quantity in kilograms, asking price per kg, harvest date, storage method (*ice, refrigerated, frozen, none*), freshness level (*very fresh, fresh, chilled, frozen*), photos, and minimum order requirements.
- **Advanced Filtering & Search**: Buyers can filter catches by fish species, price range, freshness tier, catch location, and storage method.
- **Purchase Offer Pipeline**: Approved buyers submit purchase requests detailing requested quantity (kg), custom price offers, and notes. Fishers receive real-time notifications to accept or decline offers.

### 👤 5. Dedicated Role-Based Dashboards
- **Fisher Dashboard**: Vessel information manager (*boat name, registration number, capacity*), active catch inventory, sales analytics, and incoming purchase offer manager.
- **Buyer Dashboard**: Business credentials manager, purchase offer history log, seller contact details, and saved favorites.
- **Admin Control Panel**: Approval queue for pending fisher and buyer applications, location and species management, safety alert dispatch panel, market price benchmark updater, and immutable system audit logs.

### 🔔 6. Notifications & Audit Logs
- **Event-Driven Notifications**: Real-time notification drawer informing users of account approvals, purchase offer responses, marine safety warnings, and market price movements.
- **Immutable System Audit Logs**: Comprehensive administrative audit trails logging governance actions, user promotions, moderation events, and dataset modifications.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (Framer Motion), Recharts, Lucide React Icons.
- **Backend**: Express.js, TypeScript (`tsx`), JWT (`jsonwebtoken`), PBKDF2 Password Hashing, Dotenv.
- **Database Engine**: Dual Engine — In-Memory Store / Seed Data Engine with automatic MongoDB (Mongoose) connection and hydration when `MONGODB_URI` is provided.
- **AI Integration**: Google Gemini API SDK (`@google/genai`) for intelligent summaries and location processing.
- **Build System**: Vite (client SPA build) + Esbuild (bundled CommonJS server `dist/server.cjs`).

---

## 📂 Directory Structure

```text
Fisher Community Portal/
│
├── data_dump.txt
├── Fisher_Community_Market_Access_Weather_Safety_Portal_Technical_Documentation_Updated.docx
│
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx
│   │   ├── Navbar.tsx
│   │   ├── NotificationsDrawer.tsx
│   │   └── ThemeToggle.tsx
│   │
│   ├── context/
│   │   └── ThemeContext.tsx
│   │
│   ├── data/
│   │   └── initialData.ts
│   │
│   ├── db/
│   │   ├── connect.ts
│   │   ├── models.ts
│   │   └── seed.ts
│   │
│   ├── pages/
│   │   ├── AdminDashboard.tsx
│   │   ├── AuthPage.tsx
│   │   ├── BuyerDashboard.tsx
│   │   ├── FisherDashboard.tsx
│   │   ├── LandingPage.tsx
│   │   ├── LocationOverviewPage.tsx
│   │   ├── MarketplacePage.tsx
│   │   ├── PriceDashboardPage.tsx
│   │   └── WeatherSeaPage.tsx
│   │
│   ├── services/
│   │   └── api.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
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
Ensure you have **Node.js** (v18 or higher) installed on your system.

### 1. Clone or Extract Project
Place the project repository on your local system.

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

Configure your environment variables as needed:
```env
PORT=3000
JWT_SECRET=fisher_portal_jwt_secret_example_key_32chars!
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/fisher_portal
```
*(Note: If `MONGODB_URI` is omitted or unconfigured, the application seamlessly operates in memory using the pre-seeded dataset in `src/data/initialData.ts`.)*

### 4. Run Development Server
Start the full-stack development server:

```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 5. Build for Production
To test or compile the production bundle:

```bash
npm run build
npm start
```

---

## 📋 Default Test Credentials & Demo Personas

For testing, you can use the built-in preset accounts available on the **Login / Register** page or via the quick demo selector:

| Name / Persona | Role | Location | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **System Overseer (Admin)** | Portal Overseer | Global Authority | `admin@fisherportal.org` | `password123` |
| **Capt. Mateo Silva** | Approved Fisher | Seattle Harbor | `mateo.silva@coastalnet.com` | `password123` |
| **Elena Rostova** | Approved Wholesaler | Seattle Harbor | `elena@pacificseafood.com` | `password123` |
| **Devon Vance** | Pending Fisher | Seattle Harbor | `devon.vance@soundfisheries.io` | `password123` |
| **Klaus Webber** | Pending Buyer | Lisbon Doca | `klaus@harborimports.eu` | `password123` |

---

## 📤 Pushing This Repository to Git / GitHub

To push this project to a remote GitHub or GitLab repository:

1. **Initialize Git** (if not initialized):
   ```bash
   git init
   ```

2. **Stage all files**:
   ```bash
   git add .
   ```

3. **Commit changes**:
   ```bash
   git commit -m "Initial commit - Fisher Community Market Access & Weather Safety Portal"
   ```

4. **Set default branch to `main`**:
   ```bash
   git branch -M main
   ```

5. **Link your remote repository** *(replace URL with your repository URL)*:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   ```

6. **Push code to remote repository**:
   ```bash
   git push -u origin main
   ```

---

## 📄 License

This project is licensed under the **MIT License**.
