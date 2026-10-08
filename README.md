# SEYO — Merchant Loyalty & Customer Engagement Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-QR%20%2F%20NFC-0e7c66.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](#)
[![Node](https://img.shields.io/badge/Node.js-18%2B%20%2F%2022-green.svg)](#)

SEYO is a multi-tenant QR/NFC customer engagement platform engineered to industrial-grade standards. It powers four merchant product tiers (**Spin**, **Loyalty**, **Review**, and **Combined**) with cryptographic magic-link onboarding, server-authoritative customer status evaluation, and staff terminal verification.

---

## Table of Contents

1. [Key Features](#1-key-features)
2. [Product Tiers](#2-product-tiers)
3. [Architecture & Security](#3-architecture--security)
4. [Quick Start & Setup Instructions](#4-quick-start--setup-instructions)
5. [Pre-Seeded Interactive Demos](#5-pre-seeded-interactive-demos)
6. [API Documentation](#6-api-documentation)
7. [Deployment Guidelines](#7-deployment-guidelines)
8. [Folder Structure](#8-folder-structure)

---

## 1. Key Features

* **Multi-Tenant Isolation:** All data access is strictly scoped to `businessId`. Customer profiles are indexed by `businessId + mobile`, allowing customers to belong to multiple merchants independently.
* **Separation of Permanent Entry & Short-Lived Sessions:**
  * **Permanent Entry:** Merchant hardware NFC tags and printed QR codes never expire.
  * **Customer Session:** Short-lived 30-minute cryptographic session tokens prevent replay attacks. Sensitive query keys are stripped from URLs on load.
* **Server-Authoritative Status Engine:** The backend computes customer eligibility and directs them to the **first incomplete stage**:
  $$\text{Spin} \longrightarrow \text{Loyalty} \longrightarrow \text{Review} \longrightarrow \text{Cooldown}$$
* **Merchant Timezone Boundary:** All daily resets, spin cooldowns, and stamp rules calculate against the merchant's operational IANA timezone.
* **Resumable 15-Minute Magic Link Onboarding:** Merchants purchase a tier on the marketing site, receive an encrypted magic link, and can refresh or pause without losing wizard progress.
* **Offer Immutability:** Once an offer status is `active`, backend endpoints reject all configuration mutation attempts. To modify rules, an offer must be cancelled and re-created.
* **Staff Terminal & 4-Digit PIN Security:** Staff verify reward redemptions on-site using a hashed 4-digit PIN.

---

## 2. Product Tiers

| Tier | Core Modules | Target Audience | Highlights |
| :--- | :--- | :--- | :--- |
| **`spin`** | Spin & Win | Cafes, Bars, Food Trucks | 2–7 slices, 100% all-win guaranteed, cryptographically random reward selection. |
| **`loyalty`** | Digital Stamps | Restaurants, Salons, Gyms | 3–365 visits target, 3–365 validation days (independent!), lifetime visits leaderboard. |
| **`review`** | Google Reviews | Boutiques, Local Services | Pre-handoff server feedback persistence, 1-tap clipboard copying, Google Maps redirect. |
| **`combined`** | Full 3-in-1 Suite | High-volume Hospitality & Retail | Automated progression, smart stage skipping, express loyalty QR bypass. |

---

## 3. Architecture & Security

```text
                  CUSTOMER HARDWARE TAP
             (Physical NFC Tag / Counter QR)
                            │
                            ▼
                  MERCHANT ENTRY RESOLVE
                 (/api/entry/resolve/:id)
                            │
                            ▼
                     ACTIVE OFFER?
                      /          \
                    NO            YES
                    ↓              ↓
             NO-OFFER SCREEN   CUSTOMER AUTH
                            (Inline Mobile OTP)
                                   │
                                   ▼
                         CUSTOMER STATUS ENGINE
                         (Merchant Timezone Aware)
                                   │
             ┌─────────────────────┼─────────────────────┐
             ▼                     ▼                     ▼
           SPIN                 LOYALTY                REVIEW
      (100% All-Win)       (1 Stamp / Day)      (Server Persisted)
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   ▼
                        FIRST INCOMPLETE STAGE
                                   │
                                   ▼
                         MIDNIGHT COOLDOWN
                   (+ Top 5 Loyal Legends Modal)
```

### Security Specifications
* **Cryptographic Tokens:** Magic tokens and session keys are generated via `crypto.randomBytes(32).toString('hex')`. Only SHA-256 hashes are persisted.
* **Password & PIN Hashing:** Passwords and 4-digit staff PINs are stored with PBKDF2 salt hashing (`salt:hash`).
* **Randomness:** Spin rewards use Node.js `crypto.randomInt` over accumulated weights; `Math.random()` is prohibited.
* **Replay Protection:** Permanent NFC tags resolve to an entry identifier; customer identity is bound to a single-use session key.

---

## 4. Quick Start & Setup Instructions

### Prerequisites
* Node.js 18.x or 22.x
* npm or bun

### 1. Clone & Install
```bash
git clone <repo-url>
cd seyo
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
```

### 3. Launch Full-Stack Development Server
```bash
npm run dev
```
The server will boot on `http://0.0.0.0:3000`. In development, Express automatically mounts Vite middleware.

---

## 5. Pre-Seeded Interactive Demos

The platform boots with pre-seeded demo accounts ready for immediate testing:

### Demo 1: Bella Napoli Pizzeria (Combined Suite)
* **Customer Entry:** `http://localhost:3000/c/bella-napoli/v`
* **Staff Login:** `http://localhost:3000/staff/login?demo=bella-napoli`
  * Identifier: `owner@bellanapoli.com`
  * Password: `seyo1234`
  * Staff 4-Digit Redemption PIN: `7788`

### Demo 2: Tokyo Ramen Lab (Spin Tier)
* **Customer Entry:** `http://localhost:3000/c/tokyo-ramen/v`
* **Staff Login:** `http://localhost:3000/staff/login?demo=tokyo-ramen`
  * Identifier: `lab@tokyoramen.jp`
  * Password: `seyo1234`
  * Staff 4-Digit Redemption PIN: `7788`

### Test Customer Authentication
* Mobile number: Any 10-digit number (e.g., `555 123 4567`)
* OTP code: Instant development bypass `123456`

---

## 6. API Documentation

### Onboarding Endpoints
* `POST /api/onboarding/create-magic-link` — Generates 15-min TTL magic link token upon simulated purchase.
* `GET /api/onboarding/verify-magic-link?token=...` — Verifies token and establishes authorized 24-hr wizard session.
* `GET /api/onboarding/session-state` — Resumes wizard step.
* `PUT /api/onboarding/step` — Saves step draft data.
* `POST /api/onboarding/launch` — Re-validates configuration and launches active offer.

### Customer Endpoints
* `GET /api/entry/resolve/:identifier` — Resolves merchant entry by slug or permanent NFC/QR code.
* `POST /api/auth/customer/otp/request` — Requests one-time mobile verification code.
* `POST /api/auth/customer/otp/verify` — Verifies OTP, registers customer, returns session.
* `GET /api/customer/status/:slug` — Returns merchant timezone status and first incomplete stage.
* `POST /api/customer/spin` — Executes server-selected 100% all-win reward.
* `POST /api/customer/loyalty/stamp` — Increments visit count, evaluates milestone reward.
* `POST /api/customer/review/persist` — Stores feedback before Google Maps redirect.
* `GET /api/customer/top-rankers/:slug` — Returns Top 5 Loyal Legends (masked mobile, sorted by `totalVisits`).

### Staff Endpoints
* `POST /api/staff/login` — Authenticates staff with business credentials.
* `GET /api/staff/terminal-data` — Returns active metrics, customer loyalty lists, and QR data URLs.
* `POST /api/staff/redeem-voucher` — Redeems customer reward voucher using 4-digit staff PIN.
* `POST /api/staff/cancel-offer` — Cancels active offer to allow new offer creation.

---

## 7. Deployment Guidelines

### Frontend Deployment (Vercel)
1. Set Framework Preset: **Vite**.
2. Build Command: `npm run build`.
3. Output Directory: `dist`.
4. Environment Variables:
   * `VITE_API_URL`: Your production backend URL (e.g. `https://seyo-backend.up.railway.app`).

### Backend Deployment (Railway / Cloud Run)
1. Build & Start:
   * Build: `npm run build`
   * Start: `node server.ts` or `tsx server.ts`
2. Environment Variables:
   * `PORT`: `3000` (or injected by host)
   * `NODE_ENV`: `production`
   * `APP_URL`: Production domain URL

### Production Database Migration (MongoDB Atlas)
The development environment uses `MemoryDB` backed by `.seyo_db_store.json`. Because business logic is strictly decoupled into repository services (`onboardingService`, `customerSessionService`, `loyaltyService`, etc.), switching to MongoDB Atlas requires replacing the database adapter without altering controllers, routes, or frontend code.

---

## 8. Folder Structure

```text
seyo/
├── backend/
│   └── src/
│       ├── app.ts                 # Express app assembly & route mounting
│       ├── db/
│       │   ├── MemoryDB.ts        # Disk-persisted storage with TTL cleanup
│       │   └── seed.ts            # Pre-seeded test merchants
│       ├── middleware/            # staffMiddleware, errorMiddleware
│       ├── routes/                # onboarding, entry, customer, staff, auth
│       ├── services/              # Status engine, spin, loyalty, review, staff
│       └── utils/                 # crypto, timezone calculations
├── shared/
│   ├── constants/                 # tiers, 10 countries, limits, palette
│   ├── types/                     # business, offer, customer, reward, qr
│   └── validation/                # spinValidation, loyaltyValidation, offerValidation
├── src/
│   ├── components/
│   │   ├── common/                # Button, Input, Modal, LoadingScreen
│   │   ├── onboarding/            # Profile, Branding, TierConfig, Security, Launch
│   │   ├── customer/              # Auth, SpinWheel, LoyaltyTracker, Cooldown
│   │   ├── staff/                 # Terminal, LoyaltyList, RewardsList, QRGenerator
│   │   └── review/                # ReviewGenerator
│   ├── pages/                     # LandingPage, SetupPage, CustomerEntryPage, StaffTerminalPage
│   ├── services/                  # api, customerService, staffApi, onboardingService
│   ├── App.tsx                    # Top-level client routing
│   └── main.tsx                   # React root entry
├── docs/                          # Architecture, API, and flow specifications
├── server.ts                      # Full-stack server entry point
├── package.json
└── README.md
```

---
*Built with precision for high-retention merchant customer engagement.*
