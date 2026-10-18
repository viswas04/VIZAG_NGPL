# NGPL Tennis Ball Cricket Tournament — Season 1
**“PLAY • COMPETE • BE THE NEXT GEN STAR”**
*Visakhapatnam, Andhra Pradesh, India*

A high-performance sports tournament web platform built with React 19, Vite, TypeScript, and Tailwind CSS.

---

## 🏏 Project Overview

- **League Name**: Next Gen Premier League (NGPL)
- **Tournament**: Tennis Ball Cricket Tournament
- **Edition**: Season 1
- **Host City**: Visakhapatnam, Andhra Pradesh, India
- **Prize Pool**: ₹1,10,500+
  - 🏆 **₹70,000 First Prize** (Champion Trophy + Gold Medals)
  - 🥈 **₹30,000 Runner-up Prize** (Runner-up Trophy + Medals)
  - 🌟 **₹3,500 Best Batsman**
  - 🎯 **₹3,500 Best Bowler**
  - 🛡️ **₹3,500 Best Fielder**
- **Official Facilities**:
  - 📺 Live Telecasting
  - ⚖️ Official Umpires
  - ☕ Snacks & Energy Drinks Provided
  - 🎾 Tennis Ball Cricket (Professional heavy ball)
- **Helplines**:
  - `96188 96939` (Clickable call & WhatsApp)
  - `79893 18524` (Clickable call & WhatsApp)

---

## ⚡ Tech Stack

- **Framework**: React 19 + Vite 8
- **Language**: TypeScript with strict types (`verbatimModuleSyntax`)
- **Styling**: Tailwind CSS v4 + Custom Sports Design System (metallic gold, deep navy, floodlight radial glows)
- **Icons**: Lucide React
- **QR Generation**: QRCode library for desktop UPI scanning
- **Backend**: Google Apps Script web app writing to one Google Spreadsheet (5 tabs: Individual Registrations, Team Registrations, Payment Records, Match Schedule, Tournament Settings) — see [SETUP_GOOGLE_SHEETS.md](SETUP_GOOGLE_SHEETS.md)
- **Capacity rules (server-enforced)**: max **25 confirmed teams**, max **4 scheduled matches per day**
- **Architecture**: `apps-script/Code.gs` (server), `src/services/apiClient.ts`, `registrationService.ts`, `upiService.ts`, `adminService.ts`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure the Backend & Environment
Follow **[SETUP_GOOGLE_SHEETS.md](SETUP_GOOGLE_SHEETS.md)** to create the spreadsheet, deploy the Apps Script web app and set `ADMIN_KEY`.
Then copy `.env.example` to `.env` and set:
- `VITE_BACKEND_URL`: the Apps Script **Web app URL** (required, since registrations are refused without it).

The UPI receiver (`7989318524-2@ybl`) and fees live **only** in `PAYMENT_CONFIG` in `apps-script/Code.gs`.
The admin key lives **only** in Apps Script Script Properties. No secrets go in the frontend.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
Generates optimized static assets in the `dist/` directory.

### Tests
```bash
npm run test:backend   # automated tests of the Apps Script logic (in-memory sheets)
npm run mock:backend   # local mock backend on :8787 for UI testing (not Google Sheets)
node scripts/live-integration-test.mjs <WEB_APP_URL> [ADMIN_KEY]   # live test: [TEST] rows, read-back, cleanup
```

---

## 💳 Registration & Payment Flow

1. **Player Registration (₹149)** / **Team Entry (₹12,000, 11–16 players)**: the form is validated in the browser, then **re-validated on the server**, which generates the Registration ID and writes the row. The site continues only after the server confirms the save. Otherwise it shows a "not saved" error.
2. **UPI Payment**: the server returns the payment request (receiver `7989318524-2@ybl`, amount, reference). The site shows the tournament name and payable amount, a QR code, and a `upi://pay?pa=…&am=…&tn=NGPL S1 <RegistrationID>` link.
3. **UTR Submission**: the payer enters the 12-digit UPI Ref No. This creates a **Payment Records** row with status **Pending Verification**. It is **never** marked paid automatically.
4. **Status / Pay later**: footer → *Check Registration / Pay* (Registration ID + mobile).

---

## 🛡️ Organizer Admin Portal

- Private URL: **`/#admin`** (not linked publicly). Sign in with the server-side `ADMIN_KEY`.
- Verify / Reject each payment after checking the actual UPI/bank statement (explicit confirmation + notes).
- Tabs for Payment Records, Individuals, Teams (with rosters) and **Match Schedule**, plus registration status changes and CSV export.
- Confirmed-teams metric (x/25). Match scheduling accepts Confirmed teams only and refuses a 5th match on any day.
- Alternative: **NGPL Admin** menu inside the Google Sheet.

---

## 🌐 Deployment Instructions

### Vercel / Netlify
1. Connect repository to Vercel/Netlify.
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Add Environment Variable: `VITE_BACKEND_URL` (Apps Script web app URL)
