# Google Sheets + UPI Setup — NGPL Registration Backend

This site saves **all** registrations into **one Google Spreadsheet** through a
Google Apps Script web app ([`apps-script/Code.gs`](apps-script/Code.gs)).
It is a separate backend and does not touch any other NGPL website.

```
Browser (React site) ──POST JSON──▶ Apps Script Web App ──▶ Google Spreadsheet
                                    (runs as sheet owner)     ├─ Individual Registrations
                                                              ├─ Team Registrations
                                                              ├─ Payment Records
                                                              ├─ Match Schedule
                                                              └─ Tournament Settings (read-only mirror)
```

**Target spreadsheet:** <https://docs.google.com/spreadsheets/d/1Jjgpb8ZGkleAi0JoMQAHZxuCa9aHUF5AQ51bXmnyPMo/edit>
(`DEFAULT_SPREADSHEET_ID` in `Code.gs`. A Script Property `SPREADSHEET_ID` overrides it.)
`setup` is **non-destructive**:

- It creates only the tabs that are missing.
- It adds missing trailing header columns.
- It never deletes rows.
- It never overwrites a header row that differs. Instead it stops, changes nothing, and tells you which tab to rename.

## Fixing "Registration not saved — registration server not configured"

This message means the website was built **without `VITE_BACKEND_URL`**. The site
correctly refuses to pretend it saved anything. To fix it, complete steps 1–6 below. In
short:

| Where | Setting | Required | Value |
|---|---|---|---|
| Website (`.env` locally / hosting env vars) | `VITE_BACKEND_URL` | **Yes** | Apps Script Web app URL ending in `/exec` |
| Apps Script → Script Properties | `ADMIN_KEY` | Yes (admin portal / verification) | Random secret ≥ 12 chars |
| Apps Script → Script Properties | `SPREADSHEET_ID` | Only if the script is *not* bound to the sheet | ID from the sheet URL |
| Apps Script deployment | Web app, *Execute as: Me*, *Who has access: Anyone* | **Yes** | — |
| Google authorization | Run `setup` once and click **Allow** | **Yes** | Scopes: Google Sheets, sheet menu UI |

When the site runs in dev mode, a red banner lists exactly which of these is missing. It gets
that list from `<WEB_APP_URL>?action=health`, which never returns secrets.

## Tournament capacity rules (enforced by the backend)

| Rule | Where enforced |
|---|---|
| **Max 25 confirmed teams** | Admins can't verify a team payment or set a team to *Confirmed* once 25 teams are confirmed. New team registrations and team payment submissions are refused (`TEAM_CAPACITY_REACHED`) once *confirmed + awaiting verification* reaches 25, so nobody pays for a slot that doesn't exist. |
| **Max 4 matches per day** | `adminScheduleMatch` refuses a 5th non-cancelled match on the same date (`MATCH_LIMIT_REACHED`). Restoring a cancelled match is re-checked against the same limit. Only *Confirmed* teams can be scheduled. Time-slot clashes and a team playing twice on one day are also blocked. |

Both limits live in `RULES` at the top of `Code.gs` (`MAX_CONFIRMED_TEAMS`, `MAX_MATCHES_PER_DAY`).

> [!IMPORTANT]
> **No service account or private key is used.** The script runs as the spreadsheet
> owner ("Execute as: Me"). The only secret is `ADMIN_KEY`, stored in Apps Script
> **Script Properties**, never in frontend code or the repository.

---

## 1. Open the spreadsheet and create the bound script

1. Open the target spreadsheet (link above) while signed in as an account with **edit access**.
   Keep sharing **private** (only organizers who must see personal data).
2. In the sheet: **Extensions → Apps Script**.
3. Delete the default `Code.gs` contents and paste all of [`apps-script/Code.gs`](apps-script/Code.gs).
4. Click ⚙️ **Project Settings** → tick **Show "appsscript.json" manifest file** → open
   `appsscript.json` in the editor and replace it with [`apps-script/appsscript.json`](apps-script/appsscript.json).
5. Save (Ctrl+S).

The script writes to the spreadsheet in `DEFAULT_SPREADSHEET_ID`. To point it at a
different sheet, add a Script Property `SPREADSHEET_ID` = the ID in that sheet's URL
(`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`).

## 2. Configure server-side settings (Script Properties)

**Project Settings → Script Properties → Add script property**

| Property | Required | Value |
|---|---|---|
| `ADMIN_KEY` | Yes | A long random secret (≥ 12 chars, recommend 24+). Used to sign in to the admin portal. |
| `SPREADSHEET_ID` | Only for standalone scripts | Spreadsheet ID from the URL |

Generate a key, e.g. in PowerShell:
`-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})`

Share the admin key only with organizers who verify payments. To revoke access, change it.

**Easier:** after step 4, reload the sheet and use **NGPL Admin → Set admin key**. This
writes `ADMIN_KEY` into Script Properties for you, so the key never appears in any code.

## 3. UPI receiver (single configurable location)

The UPI ID and fees are defined **only** at the top of `Code.gs`:

```js
var PAYMENT_CONFIG = {
  UPI_ID: '7989318524-2@ybl',
  ...
  FEES: { Individual: 149, Team: 12000 },
}
```

The website receives the UPI ID from the backend with every registration, so QR codes,
UPI links and the **UPI Receiver** column always match. To change it later: edit
`UPI_ID`, save, and **redeploy a new version** (step 5). No frontend change is needed.

> [!WARNING]
> Before going live, scan the generated QR with a UPI app and confirm the **receiver
> name shown by the app** is the tournament organizer. `7989318524-2@ybl` has 11 digits
> (Indian mobile-based UPI IDs normally have 10). If the app can't resolve it, correct `UPI_ID`.

## 4. Authorize and create the tabs

1. In the Apps Script editor, select the function **`setup`** and click **Run**.
2. Google asks for authorization → choose your account → *Advanced* → *Go to project* →
   **Allow**. Requested scopes: Google Sheets (this spreadsheet) and the sheet menu UI.
3. Return to the sheet: the five tabs exist with header rows (existing tabs/data untouched).
4. Run **`selfTest`**. The execution log should show
   `OK — spreadsheet reachable, tabs and headers present. UPI receiver: 7989318524-2@ybl`.
5. Reload the sheet. A **NGPL Admin** menu appears.

## 5. Deploy the web app

1. **Deploy → New deployment** → type **Web app**.
2. *Execute as*: **Me** · *Who has access*: **Anyone**
   (required so the public form can submit; the sheet itself stays private).
3. **Deploy** → copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).
4. After any later change to `Code.gs`: **Deploy → Manage deployments → ✏️ Edit →
   Version: New version → Deploy**. The URL stays the same.

Check that it's live: open `<WEB_APP_URL>?action=health` in a browser. You should see
`{"ok":true,"service":"ngpl-registration-backend","ready":true,"problems":[],…,"upiId":"7989318524-2@ybl",…,"capacity":{"maxConfirmedTeams":25,…}}`.
If `ready` is `false`, `problems` says exactly what to fix.

### Alternative: deploy from this repo with clasp (CLI)

```powershell
# one-time: enable "Google Apps Script API" at https://script.google.com/home/usersettings
npx @google/clasp login                       # opens browser OAuth; token is saved in ~/.clasprc.json (outside the repo)
npx @google/clasp create --type sheets --parentId 1Jjgpb8ZGkleAi0JoMQAHZxuCa9aHUF5AQ51bXmnyPMo --title "NGPL Registration Backend" --rootDir apps-script
npx @google/clasp push -f                     # uploads Code.gs + appsscript.json
# open the created sheet and run setup once, then click Allow (step 4), and set ADMIN_KEY
npx @google/clasp deploy --description "v1"   # prints the deployment ID
# Web app URL = https://script.google.com/macros/s/<deploymentId>/exec
```

`.clasp.json` and `.clasprc.json` are git-ignored. On the first deploy, open
**Deploy → Manage deployments** in the editor and confirm the Web app settings
(*Me* / *Anyone*) from `appsscript.json`.

## 6. Configure the website

Create `.env` (never commit it; it is git-ignored):

```env
VITE_BACKEND_URL=https://script.google.com/macros/s/XXXXXXXX/exec
```

On Vercel/Netlify set the same `VITE_BACKEND_URL` environment variable and rebuild.
`VITE_*` values are public, which is fine for the web app URL. Never put the admin key there.

If `VITE_BACKEND_URL` is missing, the site shows "Online registration is temporarily
unavailable" and refuses submissions. Nothing is stored in the browser.

## 7. Real end-to-end test (required before announcing registrations)

> [!IMPORTANT]
> Google Sheets integration is only confirmed once a real submission appears in the
> live spreadsheet. Do all of the following:

1. `npm run dev`, then open the site and submit an **individual** registration with your own number.
   Expected: the payment screen shows **₹149**, **7989318524-2@ybl** and a registration ID.
   Check **Individual Registrations** has the row with *Payment Status = Awaiting Payment*.
2. Submit a **team** registration. Expected: **₹12,000** and a new row in **Team Registrations**
   with the full roster.
3. Submit a payment reference on the payment screen. The UPI link always requests the
   full fee, so either pay it for a genuine entry or enter a dummy 12-digit UTR for a
   test row. Expected: a
   **Payment Records** row with *Verification Status = Pending Verification*, and the
   registration row changes to *Pending Verification / Under Review*.
4. Open `https://<your-site>/#admin`, sign in with `ADMIN_KEY`, and reject or verify the test payment.
   Expected: the Payment Records row shows the decision, timestamp and notes, and the
   registration row is synced.
5. Automated live check: it writes rows labelled `[TEST]`, reads them back, then removes them when you pass `ADMIN_KEY`:
   `node scripts/live-integration-test.mjs <WEB_APP_URL> <ADMIN_KEY>`
6. Delete the test rows from the tabs afterwards. Keep the header rows.

---

## Admin: verifying payments

Submitting a UTR **never** marks a payment as paid. Every payment stays **Pending
Verification** until an organizer checks it against the **actual UPI/bank statement**
for `7989318524-2@ybl` (UTR, exact amount, date).

Two admin-only methods:

- **Website admin portal:** visit `/#admin` (not linked anywhere public) and sign in with
  `ADMIN_KEY`. *Payment Records* tab → **Verify** / **Reject** → tick the confirmation →
  add notes → confirm. The key is checked by the server. After 10 wrong attempts admin
  access locks for 15 minutes.
- **Inside the Google Sheet:** open the *Payment Records* tab, select the row, then go to
  **NGPL Admin → Verify selected payment / Reject selected payment**.

Please don't type statuses into cells by hand. Use the portal or the menu so the
registration tabs stay in sync.

| Field | Values |
|---|---|
| Payment Records → Verification Status | `Pending Verification`, `Verified`, `Rejected` |
| Registration tabs → Payment Status | `Awaiting Payment` (no UTR yet), then the three values above |
| Registration tabs → Registration Status | `Pending Payment`, `Under Review`, `Confirmed` (only after Verified), `Payment Rejected`, `Cancelled` |
| Match Schedule → Match Status | `Scheduled`, `Completed`, `Cancelled` |

## Admin: scheduling matches

In the admin portal open **Match Schedule**. Pick a date, a start time and two
*Confirmed* teams, then click **Schedule**. The server assigns a `MATCH-XXXXXX` ID and writes
the row to the **Match Schedule** tab. If the day already has 4 active matches it refuses.
Cancelling a match frees its slot.

## Security notes

- Server validates every field, computes age, enforces fees (client amounts must match or
  the request is rejected), sanitizes cells against formula injection, and stores phone
  numbers as text.
- Duplicate prevention: one active registration per player mobile; per team name and per
  captain mobile; a UTR can't be reused; retries with the same request ID are idempotent;
  writes are serialized with `LockService`.
- Each row write is read back before success is returned. Any failure returns an error
  and the site shows "not saved".
- Public status lookup requires both Registration ID **and** registered mobile, and only
  returns the name, amount, statuses and the last 4 digits of the mobile.

## Local development without Google

```bash
npm run test:backend      # 23 automated tests of Code.gs logic (in-memory sheets)
npm run mock:backend      # http://localhost:8787 runs Code.gs in memory (admin key: local-admin-key-0000)
# then in another terminal (PowerShell):
$env:VITE_BACKEND_URL="http://localhost:8787"; npm run dev
```

`MOCK_FAIL_WRITES=1 npm run mock:backend` simulates a Google Sheets outage.
The mock **does not** write to Google Sheets and does not prove the live integration.
