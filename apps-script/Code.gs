/**
 * NGPL Tennis Ball Cricket Tournament — Registration & Payment Backend
 * ====================================================================
 * Google Apps Script web app that writes ALL registrations into ONE Google
 * Spreadsheet using four tabs:
 *   1. "Individual Registrations"
 *   2. "Team Registrations"
 *   3. "Payment Records"
 *   4. "Match Schedule"
 *
 * Capacity rules enforced here: max 25 confirmed teams, max 4 matches per day.
 *
 * Security model
 * --------------
 * - The script runs as the spreadsheet owner ("Execute as: Me"), so NO service
 *   account key / private key is needed anywhere. The spreadsheet stays private.
 * - The admin key lives in Script Properties (ADMIN_KEY) — never in frontend code.
 * - All validation, ID generation, fee amounts and the UPI receiver are decided
 *   HERE on the server. Client-supplied amounts are only compared, never trusted.
 * - A payment is NEVER marked Verified automatically. Submitting a UTR only
 *   creates a "Pending Verification" payment record. Only an administrator can
 *   mark it Verified or Rejected after checking actual bank/UPI records.
 *
 * This backend is independent of any other NGPL website/backend.
 */

// ============================================================================
// PAYMENT CONFIGURATION — SINGLE SOURCE OF TRUTH
// The UPI receiver and fees are defined ONLY here. The website receives them
// from this backend in every registration response, so changing UPI_ID here
// (and redeploying) updates QR codes, UPI links and sheet records everywhere.
// ============================================================================
var PAYMENT_CONFIG = {
  UPI_ID: '7989318524-2@ybl',
  PAYEE_NAME: 'NGPL Cricket Tournament',
  TOURNAMENT_NAME: 'NGPL Tennis Ball Cricket Tournament - Season 1',
  CURRENCY: 'INR',
  FEES: {
    Individual: 149,
    Team: 12000,
  },
}

var RULES = {
  MIN_AGE: 14,
  MAX_AGE: 55,
  MIN_SQUAD: 11,
  MAX_SQUAD: 16,
  ROLES: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper-Batsman'],
  TIMEZONE: 'Asia/Kolkata',
  // Tournament capacity limits (enforced on the server)
  MAX_CONFIRMED_TEAMS: 25,
  MAX_MATCHES_PER_DAY: 4,
}

/**
 * The organizers' spreadsheet. An ID is NOT a credential: the sheet stays private
 * and only the script owner's authorization can read/write it. A Script Property
 * SPREADSHEET_ID (if set) overrides this value.
 */
var DEFAULT_SPREADSHEET_ID = '1Jjgpb8ZGkleAi0JoMQAHZxuCa9aHUF5AQ51bXmnyPMo'

var SHEET_NAMES = {
  INDIVIDUAL: 'Individual Registrations',
  TEAM: 'Team Registrations',
  PAYMENTS: 'Payment Records',
  MATCHES: 'Match Schedule',
  SETTINGS: 'Tournament Settings',
}

/** Names that mark a registration as an integration test (only these can be purged). */
var TEST_LABEL = '[TEST]'

var HEADERS = {
  INDIVIDUAL: [
    'Registration ID',
    'Submission Timestamp',
    'Full Name',
    'Date of Birth',
    'Age',
    'Mobile Number',
    'Email',
    'City',
    'Playing Role',
    'Cricket Experience',
    'Emergency Contact',
    'Registration Fee (INR)',
    'Payment UTR/Reference',
    'Payment Status',
    'Registration Status',
  ],
  TEAM: [
    'Team Registration ID',
    'Submission Timestamp',
    'Team Name',
    'Captain Name',
    'Captain Mobile Number',
    'Captain Email',
    'City',
    'Squad Size',
    'Player Roster (Name | Mobile | Role)',
    'Team Entry Fee (INR)',
    'Payment UTR/Reference',
    'Payment Status',
    'Registration Status',
  ],
  PAYMENTS: [
    'Payment Reference ID',
    'Registration ID',
    'Registration Type',
    'Payer Name',
    'Payer Mobile Number',
    'Expected Amount (INR)',
    'UPI Receiver',
    'UTR/Transaction Reference',
    'Submission Timestamp',
    'Verification Status',
    'Verified/Rejected Timestamp',
    'Admin Notes',
  ],
  MATCHES: [
    'Match ID',
    'Match Date',
    'Start Time',
    'Team A Registration ID',
    'Team A Name',
    'Team B Registration ID',
    'Team B Name',
    'Venue / Ground',
    'Match Status',
    'Created Timestamp',
    'Admin Notes',
  ],
  SETTINGS: ['Setting', 'Value', 'Notes'],
}

/** Data tabs the backend reads/writes, with their expected header rows. */
function dataTabs_() {
  return [
    { name: SHEET_NAMES.INDIVIDUAL, headers: HEADERS.INDIVIDUAL, numeric: [COL.IND.FEE, COL.IND.AGE] },
    { name: SHEET_NAMES.TEAM, headers: HEADERS.TEAM, numeric: [COL.TEAM.FEE, COL.TEAM.SQUAD] },
    { name: SHEET_NAMES.PAYMENTS, headers: HEADERS.PAYMENTS, numeric: [COL.PAY.AMOUNT] },
    { name: SHEET_NAMES.MATCHES, headers: HEADERS.MATCHES, numeric: [] },
    { name: SHEET_NAMES.SETTINGS, headers: HEADERS.SETTINGS, numeric: [] },
  ]
}

// 0-based column indexes (keep in sync with HEADERS)
var COL = {
  IND: { ID: 0, TS: 1, NAME: 2, DOB: 3, AGE: 4, MOBILE: 5, EMAIL: 6, CITY: 7, ROLE: 8, EXP: 9, EMERGENCY: 10, FEE: 11, UTR: 12, PAY_STATUS: 13, REG_STATUS: 14 },
  TEAM: { ID: 0, TS: 1, TEAM: 2, CAPTAIN: 3, MOBILE: 4, EMAIL: 5, CITY: 6, SQUAD: 7, ROSTER: 8, FEE: 9, UTR: 10, PAY_STATUS: 11, REG_STATUS: 12 },
  PAY: { REF: 0, REG_ID: 1, TYPE: 2, PAYER: 3, MOBILE: 4, AMOUNT: 5, UPI: 6, UTR: 7, TS: 8, STATUS: 9, DECIDED_TS: 10, NOTES: 11 },
  MATCH: { ID: 0, DATE: 1, TIME: 2, A_ID: 3, A_NAME: 4, B_ID: 5, B_NAME: 6, VENUE: 7, STATUS: 8, TS: 9, NOTES: 10 },
}

var MATCH_STATUS = { SCHEDULED: 'Scheduled', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }
var MATCH_STATUS_VALUES = [MATCH_STATUS.SCHEDULED, MATCH_STATUS.COMPLETED, MATCH_STATUS.CANCELLED]

// Payment status values (registration tabs). "Awaiting Payment" = no UTR yet.
var PAYMENT_STATUS = {
  AWAITING: 'Awaiting Payment',
  PENDING: 'Pending Verification',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
}

// Verification status values in the Payment Records tab (exactly three).
var VERIFICATION_STATUSES = [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.VERIFIED, PAYMENT_STATUS.REJECTED]

var REG_STATUS = {
  PENDING_PAYMENT: 'Pending Payment',
  UNDER_REVIEW: 'Under Review',
  CONFIRMED: 'Confirmed',
  PAYMENT_REJECTED: 'Payment Rejected',
  CANCELLED: 'Cancelled',
}
var REG_STATUS_VALUES = [
  REG_STATUS.PENDING_PAYMENT,
  REG_STATUS.UNDER_REVIEW,
  REG_STATUS.CONFIRMED,
  REG_STATUS.PAYMENT_REJECTED,
  REG_STATUS.CANCELLED,
]

var ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
var IDEMPOTENCY_TTL_SECONDS = 6 * 60 * 60
var ADMIN_MAX_FAILURES = 10
var ADMIN_LOCKOUT_SECONDS = 15 * 60

// ============================================================================
// HTTP ENTRY POINTS
// ============================================================================

function doGet(e) {
  var action = e && e.parameter && e.parameter.action
  if (action === 'health' || !action) {
    var diag = diagnostics_()
    return jsonOutput_({
      ok: true,
      service: 'ngpl-registration-backend',
      ready: diag.ready,
      problems: diag.problems,
      payment: publicPaymentConfig_(),
      capacity: diag.capacity,
      spreadsheetIdSuffix: diag.spreadsheetIdSuffix,
    })
  }
  return jsonOutput_({ ok: false, error: 'Unsupported request.' })
}

/**
 * Reports which server-side configuration is missing. Never returns secrets or
 * the full spreadsheet ID — only whether each item is configured.
 */
function diagnostics_() {
  var problems = []
  var capacity = null
  var props = PropertiesService.getScriptProperties()
  var adminKey = props.getProperty('ADMIN_KEY')
  if (!adminKey || adminKey.length < 12) {
    problems.push('ADMIN_KEY Script Property is missing or shorter than 12 characters (admin verification disabled; registrations still work).')
  }
  var idSuffix = ''
  try {
    var ss = getSpreadsheet_()
    idSuffix = String(ss.getId ? ss.getId() : '').slice(-6)
    var tabProblems = []
    dataTabs_().forEach(function (t) {
      var sheet = ss.getSheetByName(t.name)
      if (!sheet) tabProblems.push('Missing tab "' + t.name + '" (run setup).')
      else {
        var p = headerProblem_(sheet, t.headers)
        if (p) tabProblems.push(p)
      }
    })
    problems = problems.concat(tabProblems)
    if (!tabProblems.length) capacity = teamCapacity_()
  } catch (err) {
    problems.push(
      'Spreadsheet not reachable: the script owner must authorize access (run setup in the Apps Script editor and click Allow) and have edit access to the spreadsheet, or set the SPREADSHEET_ID Script Property. (' +
        String(err && err.message ? err.message : err).substring(0, 160) + ')'
    )
  }
  // Registrations only require the spreadsheet; ADMIN_KEY is needed for admin tasks.
  var ready = !problems.some(function (p) { return p.indexOf('ADMIN_KEY') !== 0 })
  return { ready: ready, problems: problems, capacity: capacity, spreadsheetIdSuffix: idSuffix }
}

/** Team slot usage. Confirmed count is the hard limit; pending counts as provisional. */
function teamCapacity_() {
  var rows = getDataRows_(getSheet_(SHEET_NAMES.TEAM))
  var confirmed = 0
  var pending = 0
  rows.forEach(function (r) {
    if (r[COL.TEAM.REG_STATUS] === REG_STATUS.CONFIRMED) confirmed++
    else if (r[COL.TEAM.PAY_STATUS] === PAYMENT_STATUS.PENDING && r[COL.TEAM.REG_STATUS] !== REG_STATUS.CANCELLED) pending++
  })
  return {
    maxConfirmedTeams: RULES.MAX_CONFIRMED_TEAMS,
    confirmedTeams: confirmed,
    pendingVerificationTeams: pending,
    slotsRemaining: Math.max(0, RULES.MAX_CONFIRMED_TEAMS - confirmed),
    openForRegistration: confirmed + pending < RULES.MAX_CONFIRMED_TEAMS,
    maxMatchesPerDay: RULES.MAX_MATCHES_PER_DAY,
  }
}

function doPost(e) {
  var body
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}')
  } catch (err) {
    return jsonOutput_({ ok: false, code: 'BAD_REQUEST', error: 'Invalid request body.' })
  }

  try {
    var result = route_(body)
    return jsonOutput_(result)
  } catch (err) {
    if (err && err.isClientError) {
      return jsonOutput_({ ok: false, code: err.code, error: err.message, fieldErrors: err.fieldErrors })
    }
    logError_('Unhandled backend error', err)
    return jsonOutput_({
      ok: false,
      code: 'SERVER_ERROR',
      error: 'We could not save your submission to the registration sheet. Nothing was recorded. Please try again in a few minutes or contact the organizers.',
    })
  }
}

function route_(body) {
  switch (body.action) {
    case 'registerIndividual':
      return withIdempotency_(body.requestId, function () {
        return registerIndividual_(body.data || {})
      })
    case 'registerTeam':
      return withIdempotency_(body.requestId, function () {
        return registerTeam_(body.data || {})
      })
    case 'submitPayment':
      return withIdempotency_(body.requestId, function () {
        return submitPayment_(body)
      })
    case 'lookupRegistration':
      return lookupRegistration_(body)
    case 'adminLogin':
      requireAdmin_(body.adminKey)
      return { ok: true }
    case 'adminList':
      requireAdmin_(body.adminKey)
      return adminList_()
    case 'adminUpdatePayment':
      requireAdmin_(body.adminKey)
      return withLock_(function () {
        return updatePaymentVerification_(body.paymentRef, body.status, body.notes)
      })
    case 'adminUpdateRegistration':
      requireAdmin_(body.adminKey)
      return withLock_(function () {
        return updateRegistrationStatus_(body.registrationId, body.status)
      })
    case 'adminScheduleMatch':
      requireAdmin_(body.adminKey)
      return withLock_(function () {
        return scheduleMatch_(body)
      })
    case 'adminUpdateMatch':
      requireAdmin_(body.adminKey)
      return withLock_(function () {
        return updateMatch_(body.matchId, body.status, body.notes)
      })
    case 'adminPurgeTestRegistration':
      requireAdmin_(body.adminKey)
      return withLock_(function () {
        return purgeTestRegistration_(body.registrationId)
      })
    default:
      throw clientError_('BAD_REQUEST', 'Unknown action.')
  }
}

// ============================================================================
// REGISTRATION HANDLERS
// ============================================================================

function registerIndividual_(data) {
  var clean = validateIndividual_(data)
  assertClientAmount_(data.amount, PAYMENT_CONFIG.FEES.Individual)

  return withLock_(function () {
    var sheet = getSheet_(SHEET_NAMES.INDIVIDUAL)
    var rows = getDataRows_(sheet)

    var duplicate = rows.some(function (r) {
      return String(r[COL.IND.MOBILE]) === clean.mobile && r[COL.IND.REG_STATUS] !== REG_STATUS.CANCELLED
    })
    if (duplicate) {
      throw clientError_(
        'DUPLICATE',
        'A player with this mobile number is already registered. Use "Check Registration / Complete Payment" with your Registration ID, or contact the organizers.',
        { mobileNumber: 'This mobile number is already registered.' }
      )
    }

    var id = generateUniqueId_('NGPL-S1-IND-', rows, COL.IND.ID)
    var ts = nowIst_()
    var fee = PAYMENT_CONFIG.FEES.Individual

    var row = []
    row[COL.IND.ID] = id
    row[COL.IND.TS] = ts
    row[COL.IND.NAME] = clean.fullName
    row[COL.IND.DOB] = clean.dateOfBirth
    row[COL.IND.AGE] = clean.age
    row[COL.IND.MOBILE] = clean.mobile
    row[COL.IND.EMAIL] = clean.email
    row[COL.IND.CITY] = clean.city
    row[COL.IND.ROLE] = clean.role
    row[COL.IND.EXP] = clean.experience
    row[COL.IND.EMERGENCY] = clean.emergency
    row[COL.IND.FEE] = fee
    row[COL.IND.UTR] = ''
    row[COL.IND.PAY_STATUS] = PAYMENT_STATUS.AWAITING
    row[COL.IND.REG_STATUS] = REG_STATUS.PENDING_PAYMENT

    appendRowVerified_(sheet, row, id)

    return {
      ok: true,
      registration: buildReceipt_('Individual', id, clean.fullName, clean.mobile, fee, PAYMENT_STATUS.AWAITING, REG_STATUS.PENDING_PAYMENT, ts, ''),
    }
  })
}

function registerTeam_(data) {
  var clean = validateTeam_(data)
  assertClientAmount_(data.amount, PAYMENT_CONFIG.FEES.Team)

  return withLock_(function () {
    assertTeamRegistrationOpen_()
    var sheet = getSheet_(SHEET_NAMES.TEAM)
    var rows = getDataRows_(sheet)
    var nameKey = normalizeKey_(clean.teamName)

    var nameTaken = false
    var mobileTaken = false
    rows.forEach(function (r) {
      if (r[COL.TEAM.REG_STATUS] === REG_STATUS.CANCELLED) return
      if (normalizeKey_(r[COL.TEAM.TEAM]) === nameKey) nameTaken = true
      if (String(r[COL.TEAM.MOBILE]) === clean.captainMobile) mobileTaken = true
    })
    if (nameTaken || mobileTaken) {
      var fe = {}
      if (nameTaken) fe.teamName = 'This team name is already registered.'
      if (mobileTaken) fe.captainMobile = 'This captain mobile number is already registered.'
      throw clientError_('DUPLICATE', 'A team with this name or captain mobile number is already registered.', fe)
    }

    var id = generateUniqueId_('NGPL-S1-TEAM-', rows, COL.TEAM.ID)
    var ts = nowIst_()
    var fee = PAYMENT_CONFIG.FEES.Team
    var rosterText = clean.roster
      .map(function (p, i) {
        return i + 1 + '. ' + p.name + ' | ' + p.mobile + ' | ' + p.role
      })
      .join('\n')

    var row = []
    row[COL.TEAM.ID] = id
    row[COL.TEAM.TS] = ts
    row[COL.TEAM.TEAM] = clean.teamName
    row[COL.TEAM.CAPTAIN] = clean.captainName
    row[COL.TEAM.MOBILE] = clean.captainMobile
    row[COL.TEAM.EMAIL] = clean.email
    row[COL.TEAM.CITY] = clean.city
    row[COL.TEAM.SQUAD] = clean.roster.length
    row[COL.TEAM.ROSTER] = rosterText
    row[COL.TEAM.FEE] = fee
    row[COL.TEAM.UTR] = ''
    row[COL.TEAM.PAY_STATUS] = PAYMENT_STATUS.AWAITING
    row[COL.TEAM.REG_STATUS] = REG_STATUS.PENDING_PAYMENT

    appendRowVerified_(sheet, row, id)

    return {
      ok: true,
      registration: buildReceipt_('Team', id, clean.teamName, clean.captainMobile, fee, PAYMENT_STATUS.AWAITING, REG_STATUS.PENDING_PAYMENT, ts, ''),
    }
  })
}

// ============================================================================
// PAYMENT REFERENCE SUBMISSION (never marks a payment as successful)
// ============================================================================

function submitPayment_(body) {
  var registrationId = String(body.registrationId || '').trim().toUpperCase()
  var mobile = normalizeMobile_(body.mobile)
  var utr = String(body.utr || '').trim()

  var fe = {}
  if (!registrationId) fe.registrationId = 'Registration ID is required.'
  if (!mobile) fe.mobile = 'Enter the 10-digit mobile number used during registration.'
  if (!utr || !/^[a-zA-Z0-9]+$/.test(utr)) fe.utr = 'Enter a valid UTR / UPI Ref No. (letters and numbers only, no spaces).'
  if (Object.keys(fe).length) throw clientError_('VALIDATION', 'Please correct the highlighted fields.', fe)

  return withLock_(function () {
    var found = findRegistration_(registrationId)
    if (!found || found.mobile !== mobile) {
      throw clientError_('NOT_FOUND', 'No registration matches this Registration ID and mobile number.')
    }
    if (found.regStatus === REG_STATUS.CANCELLED) {
      throw clientError_('INVALID_STATE', 'This registration has been cancelled. Please contact the organizers.')
    }
    if (found.paymentStatus === PAYMENT_STATUS.VERIFIED) {
      throw clientError_('INVALID_STATE', 'Payment for this registration has already been verified.')
    }

    var expected = PAYMENT_CONFIG.FEES[found.type]
    assertClientAmount_(body.amount, expected)
    if (found.type === 'Team' && found.paymentStatus !== PAYMENT_STATUS.PENDING) assertTeamRegistrationOpen_()

    if (found.paymentStatus === PAYMENT_STATUS.PENDING) {
      if (String(found.utr) === utr) {
        // Same UTR re-submitted (e.g. network retry) — return the existing state.
        return { ok: true, registration: receiptFromFound_(found) }
      }
      throw clientError_(
        'INVALID_STATE',
        'A payment reference is already awaiting verification for this registration. Please wait for the organizers to review it.'
      )
    }

    var paySheet = getSheet_(SHEET_NAMES.PAYMENTS)
    var payRows = getDataRows_(paySheet)
    var utrInUse = payRows.some(function (r) {
      return String(r[COL.PAY.UTR]) === utr && r[COL.PAY.STATUS] !== PAYMENT_STATUS.REJECTED
    })
    if (utrInUse) {
      throw clientError_('DUPLICATE', 'This UTR has already been submitted for another registration.', {
        utr: 'This UTR has already been submitted.',
      })
    }

    var paymentRef = generateUniqueId_('PAY-' + Utilities.formatDate(new Date(), RULES.TIMEZONE, 'yyMMdd') + '-', payRows, COL.PAY.REF)
    var ts = nowIst_()

    var payRow = []
    payRow[COL.PAY.REF] = paymentRef
    payRow[COL.PAY.REG_ID] = found.id
    payRow[COL.PAY.TYPE] = found.type
    payRow[COL.PAY.PAYER] = found.name
    payRow[COL.PAY.MOBILE] = found.mobile
    payRow[COL.PAY.AMOUNT] = expected
    payRow[COL.PAY.UPI] = PAYMENT_CONFIG.UPI_ID
    payRow[COL.PAY.UTR] = utr
    payRow[COL.PAY.TS] = ts
    payRow[COL.PAY.STATUS] = PAYMENT_STATUS.PENDING
    payRow[COL.PAY.DECIDED_TS] = ''
    payRow[COL.PAY.NOTES] = ''
    appendRowVerified_(paySheet, payRow, paymentRef)

    var c = found.cols
    found.sheet.getRange(found.rowNumber, c.UTR + 1).setValue(utr)
    found.sheet.getRange(found.rowNumber, c.PAY_STATUS + 1).setValue(PAYMENT_STATUS.PENDING)
    found.sheet.getRange(found.rowNumber, c.REG_STATUS + 1).setValue(REG_STATUS.UNDER_REVIEW)

    var receipt = buildReceipt_(found.type, found.id, found.name, found.mobile, expected, PAYMENT_STATUS.PENDING, REG_STATUS.UNDER_REVIEW, found.ts, utr)
    receipt.paymentRef = paymentRef
    receipt.paymentSubmittedAt = ts
    return { ok: true, registration: receipt }
  })
}

/** Public status lookup — requires BOTH Registration ID and registered mobile. */
function lookupRegistration_(body) {
  var registrationId = String(body.registrationId || '').trim().toUpperCase()
  var mobile = normalizeMobile_(body.mobile)
  if (!registrationId || !mobile) {
    throw clientError_('VALIDATION', 'Enter your Registration ID and the 10-digit mobile number used during registration.')
  }
  var found = findRegistration_(registrationId)
  if (!found || found.mobile !== mobile) {
    throw clientError_('NOT_FOUND', 'No registration matches this Registration ID and mobile number.')
  }
  return { ok: true, registration: receiptFromFound_(found) }
}

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

function adminList_() {
  var ind = getDataRows_(getSheet_(SHEET_NAMES.INDIVIDUAL)).map(function (r) {
    var c = COL.IND
    return {
      registrationId: r[c.ID], submittedAt: r[c.TS], fullName: r[c.NAME], dateOfBirth: r[c.DOB], age: r[c.AGE],
      mobile: String(r[c.MOBILE]), email: r[c.EMAIL], city: r[c.CITY], playingRole: r[c.ROLE],
      experience: r[c.EXP], emergencyContact: String(r[c.EMERGENCY]), fee: Number(r[c.FEE]),
      utr: String(r[c.UTR]), paymentStatus: r[c.PAY_STATUS], registrationStatus: r[c.REG_STATUS],
    }
  })
  var teams = getDataRows_(getSheet_(SHEET_NAMES.TEAM)).map(function (r) {
    var c = COL.TEAM
    return {
      registrationId: r[c.ID], submittedAt: r[c.TS], teamName: r[c.TEAM], captainName: r[c.CAPTAIN],
      captainMobile: String(r[c.MOBILE]), captainEmail: r[c.EMAIL], city: r[c.CITY], squadSize: Number(r[c.SQUAD]),
      roster: r[c.ROSTER], fee: Number(r[c.FEE]), utr: String(r[c.UTR]),
      paymentStatus: r[c.PAY_STATUS], registrationStatus: r[c.REG_STATUS],
    }
  })
  var payments = getDataRows_(getSheet_(SHEET_NAMES.PAYMENTS)).map(function (r) {
    var c = COL.PAY
    return {
      paymentRef: r[c.REF], registrationId: r[c.REG_ID], registrationType: r[c.TYPE], payerName: r[c.PAYER],
      payerMobile: String(r[c.MOBILE]), expectedAmount: Number(r[c.AMOUNT]), upiReceiver: r[c.UPI],
      utr: String(r[c.UTR]), submittedAt: r[c.TS], verificationStatus: r[c.STATUS],
      decidedAt: r[c.DECIDED_TS], adminNotes: r[c.NOTES],
    }
  })
  var matches = getDataRows_(getSheet_(SHEET_NAMES.MATCHES)).map(matchFromRow_)
  return {
    ok: true,
    individuals: ind,
    teams: teams,
    payments: payments,
    matches: matches,
    capacity: teamCapacity_(),
    payment: publicPaymentConfig_(),
  }
}

/**
 * Marks a payment record Verified or Rejected. The administrator must first
 * confirm the UTR + amount + receiver against the actual UPI/bank statement.
 */
function updatePaymentVerification_(paymentRef, status, notes) {
  paymentRef = String(paymentRef || '').trim()
  if (status !== PAYMENT_STATUS.VERIFIED && status !== PAYMENT_STATUS.REJECTED) {
    throw clientError_('VALIDATION', 'Status must be "Verified" or "Rejected".')
  }
  var paySheet = getSheet_(SHEET_NAMES.PAYMENTS)
  var rows = getDataRows_(paySheet)
  var idx = -1
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.PAY.REF] === paymentRef) { idx = i; break }
  }
  if (idx === -1) throw clientError_('NOT_FOUND', 'Payment record not found.')

  if (status === PAYMENT_STATUS.VERIFIED && rows[idx][COL.PAY.TYPE] === 'Team') {
    var teamReg = findRegistration_(rows[idx][COL.PAY.REG_ID])
    if (!teamReg || teamReg.regStatus !== REG_STATUS.CONFIRMED) assertConfirmedTeamSlot_()
  }

  var rowNumber = idx + 2
  var ts = nowIst_()
  var cleanNotes = sanitizeCell_(limit_(String(notes || '').trim(), 500))
  paySheet.getRange(rowNumber, COL.PAY.STATUS + 1).setValue(status)
  paySheet.getRange(rowNumber, COL.PAY.DECIDED_TS + 1).setValue(ts)
  paySheet.getRange(rowNumber, COL.PAY.NOTES + 1).setValue(cleanNotes)

  // Sync to the registration row only if this record is the registration's current UTR.
  var regId = rows[idx][COL.PAY.REG_ID]
  var utr = String(rows[idx][COL.PAY.UTR])
  var found = findRegistration_(regId)
  var synced = false
  if (found && String(found.utr) === utr && found.regStatus !== REG_STATUS.CANCELLED) {
    var c = found.cols
    found.sheet.getRange(found.rowNumber, c.PAY_STATUS + 1).setValue(status)
    found.sheet
      .getRange(found.rowNumber, c.REG_STATUS + 1)
      .setValue(status === PAYMENT_STATUS.VERIFIED ? REG_STATUS.CONFIRMED : REG_STATUS.PAYMENT_REJECTED)
    synced = true
  }
  return { ok: true, paymentRef: paymentRef, status: status, decidedAt: ts, registrationSynced: synced }
}

function updateRegistrationStatus_(registrationId, status) {
  if (REG_STATUS_VALUES.indexOf(status) === -1) {
    throw clientError_('VALIDATION', 'Invalid registration status.')
  }
  var found = findRegistration_(String(registrationId || '').trim().toUpperCase())
  if (!found) throw clientError_('NOT_FOUND', 'Registration not found.')
  if (status === REG_STATUS.CONFIRMED && found.paymentStatus !== PAYMENT_STATUS.VERIFIED) {
    throw clientError_('INVALID_STATE', 'A registration can only be Confirmed after its payment is Verified.')
  }
  if (status === REG_STATUS.CONFIRMED && found.type === 'Team' && found.regStatus !== REG_STATUS.CONFIRMED) {
    assertConfirmedTeamSlot_()
  }
  found.sheet.getRange(found.rowNumber, found.cols.REG_STATUS + 1).setValue(status)
  return { ok: true, registrationId: found.id, status: status }
}

// ============================================================================
// CAPACITY LIMITS & MATCH SCHEDULE
// ============================================================================

/** New team registrations / payments close once confirmed + pending reaches the cap. */
function assertTeamRegistrationOpen_() {
  var cap = teamCapacity_()
  if (!cap.openForRegistration) {
    throw clientError_(
      'TEAM_CAPACITY_REACHED',
      'Team registrations are full: the tournament is limited to ' + RULES.MAX_CONFIRMED_TEAMS +
        ' teams (' + cap.confirmedTeams + ' confirmed, ' + cap.pendingVerificationTeams +
        ' awaiting payment verification). Please do not make a payment. Contact the organizers to join the waitlist.'
    )
  }
}

/** Hard limit: never more than MAX_CONFIRMED_TEAMS confirmed teams. */
function assertConfirmedTeamSlot_() {
  var cap = teamCapacity_()
  if (cap.confirmedTeams >= RULES.MAX_CONFIRMED_TEAMS) {
    throw clientError_(
      'TEAM_CAPACITY_REACHED',
      'Cannot confirm another team: ' + RULES.MAX_CONFIRMED_TEAMS + ' teams are already confirmed. Reject/refund this payment or cancel another team first.'
    )
  }
}

function matchFromRow_(r) {
  var c = COL.MATCH
  return {
    matchId: r[c.ID], date: String(r[c.DATE]), time: String(r[c.TIME]),
    teamAId: r[c.A_ID], teamAName: r[c.A_NAME], teamBId: r[c.B_ID], teamBName: r[c.B_NAME],
    venue: r[c.VENUE], status: r[c.STATUS], createdAt: r[c.TS], adminNotes: r[c.NOTES],
  }
}

function activeMatchesOn_(rows, date, excludeIdx) {
  return rows.filter(function (r, i) {
    return i !== excludeIdx && String(r[COL.MATCH.DATE]) === date && r[COL.MATCH.STATUS] !== MATCH_STATUS.CANCELLED
  })
}

function scheduleMatch_(body) {
  var fe = {}
  var date = str_(body.date)
  var time = str_(body.time)
  var teamAId = str_(body.teamAId).toUpperCase()
  var teamBId = str_(body.teamBId).toUpperCase()
  var venue = sanitizeCell_(limit_(str_(body.venue), 80))
  var notes = sanitizeCell_(limit_(str_(body.notes), 300))

  var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  var validDate = false
  if (dm) {
    var d = new Date(Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3])))
    validDate = d.getUTCFullYear() === Number(dm[1]) && d.getUTCMonth() === Number(dm[2]) - 1 && d.getUTCDate() === Number(dm[3])
  }
  if (!validDate) fe.date = 'Enter a valid match date (YYYY-MM-DD).'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) fe.time = 'Enter a valid start time (HH:MM, 24-hour).'
  if (!teamAId) fe.teamAId = 'Select Team A.'
  if (!teamBId) fe.teamBId = 'Select Team B.'
  if (teamAId && teamAId === teamBId) fe.teamBId = 'A team cannot play itself.'
  if (Object.keys(fe).length) throw clientError_('VALIDATION', 'Please correct the highlighted fields.', fe)

  var teamA = findRegistration_(teamAId)
  var teamB = findRegistration_(teamBId)
  if (!teamA || teamA.type !== 'Team') fe.teamAId = 'Team A registration not found.'
  else if (teamA.regStatus !== REG_STATUS.CONFIRMED) fe.teamAId = 'Team A is not Confirmed.'
  if (!teamB || teamB.type !== 'Team') fe.teamBId = 'Team B registration not found.'
  else if (teamB.regStatus !== REG_STATUS.CONFIRMED) fe.teamBId = 'Team B is not Confirmed.'
  if (Object.keys(fe).length) throw clientError_('VALIDATION', 'Only Confirmed teams can be scheduled.', fe)

  var sheet = getSheet_(SHEET_NAMES.MATCHES)
  var rows = getDataRows_(sheet)
  var sameDay = activeMatchesOn_(rows, date, -1)
  if (sameDay.length >= RULES.MAX_MATCHES_PER_DAY) {
    throw clientError_('MATCH_LIMIT_REACHED', 'A maximum of ' + RULES.MAX_MATCHES_PER_DAY + ' matches can be scheduled per day. ' + date + ' is full.', { date: 'This day already has ' + sameDay.length + ' matches.' })
  }
  var clash = sameDay.some(function (r) { return String(r[COL.MATCH.TIME]) === time })
  if (clash) throw clientError_('VALIDATION', 'Another match is already scheduled at ' + time + ' on ' + date + '.', { time: 'Time slot already taken.' })
  var teamBusy = sameDay.some(function (r) {
    return [r[COL.MATCH.A_ID], r[COL.MATCH.B_ID]].some(function (x) { return x === teamAId || x === teamBId })
  })
  if (teamBusy) throw clientError_('VALIDATION', 'One of these teams already has a match on ' + date + '.')

  var id = generateUniqueId_('MATCH-', rows, COL.MATCH.ID)
  var row = []
  row[COL.MATCH.ID] = id
  row[COL.MATCH.DATE] = date
  row[COL.MATCH.TIME] = time
  row[COL.MATCH.A_ID] = teamA.id
  row[COL.MATCH.A_NAME] = teamA.name
  row[COL.MATCH.B_ID] = teamB.id
  row[COL.MATCH.B_NAME] = teamB.name
  row[COL.MATCH.VENUE] = venue
  row[COL.MATCH.STATUS] = MATCH_STATUS.SCHEDULED
  row[COL.MATCH.TS] = nowIst_()
  row[COL.MATCH.NOTES] = notes
  appendRowVerified_(sheet, row, id)
  return { ok: true, match: matchFromRow_(row), matchesOnDate: sameDay.length + 1, maxMatchesPerDay: RULES.MAX_MATCHES_PER_DAY }
}

function updateMatch_(matchId, status, notes) {
  matchId = String(matchId || '').trim().toUpperCase()
  if (MATCH_STATUS_VALUES.indexOf(status) === -1) throw clientError_('VALIDATION', 'Invalid match status.')
  var sheet = getSheet_(SHEET_NAMES.MATCHES)
  var rows = getDataRows_(sheet)
  var idx = -1
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][COL.MATCH.ID] === matchId) { idx = i; break }
  }
  if (idx === -1) throw clientError_('NOT_FOUND', 'Match not found.')
  var current = rows[idx]
  if (current[COL.MATCH.STATUS] === MATCH_STATUS.CANCELLED && status !== MATCH_STATUS.CANCELLED) {
    var date = String(current[COL.MATCH.DATE])
    if (activeMatchesOn_(rows, date, idx).length >= RULES.MAX_MATCHES_PER_DAY) {
      throw clientError_('MATCH_LIMIT_REACHED', 'Cannot restore this match: ' + date + ' already has ' + RULES.MAX_MATCHES_PER_DAY + ' matches.')
    }
  }
  sheet.getRange(idx + 2, COL.MATCH.STATUS + 1).setValue(status)
  if (notes !== undefined && notes !== null) {
    sheet.getRange(idx + 2, COL.MATCH.NOTES + 1).setValue(sanitizeCell_(limit_(str_(notes), 300)))
  }
  current[COL.MATCH.STATUS] = status
  return { ok: true, match: matchFromRow_(current) }
}

function requireAdmin_(providedKey) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY')
  if (!expected || expected.length < 12) {
    throw clientError_('ADMIN_NOT_CONFIGURED', 'Admin access is not configured on the server (set ADMIN_KEY in Script Properties).')
  }
  var cache = CacheService.getScriptCache()
  var failures = Number(cache.get('admin_failures') || 0)
  if (failures >= ADMIN_MAX_FAILURES) {
    throw clientError_('LOCKED', 'Too many failed attempts. Admin access is locked for 15 minutes.')
  }
  if (!constantTimeEquals_(String(providedKey || ''), expected)) {
    cache.put('admin_failures', String(failures + 1), ADMIN_LOCKOUT_SECONDS)
    throw clientError_('UNAUTHORIZED', 'Invalid admin key.')
  }
}

// ============================================================================
// SPREADSHEET MENU (admin-only method inside the private Google Sheet)
// ============================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('NGPL Admin')
    .addItem('Set up / repair tabs', 'setup')
    .addItem('Set admin key (stored in Script Properties)', 'menuSetAdminKey')
    .addSeparator()
    .addItem('Verify selected payment', 'menuVerifySelectedPayment')
    .addItem('Reject selected payment', 'menuRejectSelectedPayment')
    .addToUi()
}

/** Stores ADMIN_KEY in Script Properties so the secret never lives in code. */
function menuSetAdminKey() {
  var ui = SpreadsheetApp.getUi()
  var res = ui.prompt('Set NGPL admin key', 'Enter a new admin key (at least 12 characters). It is stored in Script Properties only.', ui.ButtonSet.OK_CANCEL)
  if (res.getSelectedButton() !== ui.Button.OK) return
  var key = String(res.getResponseText() || '').trim()
  if (key.length < 12) { ui.alert('Admin key must be at least 12 characters. Nothing was changed.'); return }
  PropertiesService.getScriptProperties().setProperty('ADMIN_KEY', key)
  ui.alert('Admin key saved.')
}

function menuVerifySelectedPayment() { menuDecideSelected_(PAYMENT_STATUS.VERIFIED) }
function menuRejectSelectedPayment() { menuDecideSelected_(PAYMENT_STATUS.REJECTED) }

function menuDecideSelected_(status) {
  var ui = SpreadsheetApp.getUi()
  var sheet = SpreadsheetApp.getActiveSheet()
  if (sheet.getName() !== SHEET_NAMES.PAYMENTS) {
    ui.alert('Open the "' + SHEET_NAMES.PAYMENTS + '" tab and select a row first.')
    return
  }
  var row = sheet.getActiveRange().getRow()
  if (row < 2) { ui.alert('Select a payment record row (not the header).'); return }
  var ref = sheet.getRange(row, COL.PAY.REF + 1).getValue()
  var utr = sheet.getRange(row, COL.PAY.UTR + 1).getValue()
  var amount = sheet.getRange(row, COL.PAY.AMOUNT + 1).getValue()
  var confirm = ui.prompt(
    status + ' payment ' + ref,
    'Confirm you checked UTR ' + utr + ' for INR ' + amount + ' received at ' + PAYMENT_CONFIG.UPI_ID +
      ' in your actual UPI/bank records.\nOptional admin notes:',
    ui.ButtonSet.OK_CANCEL
  )
  if (confirm.getSelectedButton() !== ui.Button.OK) return
  withLock_(function () {
    return updatePaymentVerification_(ref, status, confirm.getResponseText())
  })
  ui.alert('Payment ' + ref + ' marked ' + status + '.')
}

/**
 * Creates any missing tabs / header columns and refreshes the Tournament
 * Settings tab. NON-DESTRUCTIVE: never deletes rows, never overwrites an existing
 * header row that differs (it stops and explains instead). Safe to run repeatedly.
 */
function setup() {
  dataTabs_().forEach(function (t) {
    ensureSheet_(t.name, t.headers, t.numeric)
  })
  writeSettings_()
  var msg = 'NGPL tabs ready in spreadsheet "' + getSpreadsheet_().getName() + '": ' +
    dataTabs_().map(function (t) { return t.name }).join(', ')
  console.log(msg)
  return msg
}

/** Run from the editor to confirm the sheet is writable. Writes nothing permanent. */
function selfTest() {
  setup()
  var diag = diagnostics_()
  var tabIssues = diag.problems.filter(function (p) { return p.indexOf('ADMIN_KEY') !== 0 })
  if (tabIssues.length) throw new Error(tabIssues.join(' | '))
  var msg = 'OK — spreadsheet reachable, tabs and headers present. UPI receiver: ' + PAYMENT_CONFIG.UPI_ID +
    (diag.problems.length ? ' | Note: ' + diag.problems.join(' | ') : '')
  console.log(msg)
  return msg
}

/**
 * Mirrors the backend's authoritative settings into the "Tournament Settings"
 * tab for organizers to see. Values come from this file; editing the tab does
 * not change backend behaviour (prevents tampering with the UPI receiver/fees).
 * Rows are upserted by Setting name; other rows in the tab are left untouched.
 */
function writeSettings_() {
  var sheet = getSheet_(SHEET_NAMES.SETTINGS)
  var managed = 'Managed by backend (Code.gs). Edits here are ignored and reset by setup.'
  var settings = [
    ['Tournament Name', PAYMENT_CONFIG.TOURNAMENT_NAME, managed],
    ['Payment Receiver UPI ID', PAYMENT_CONFIG.UPI_ID, 'The ONLY UPI ID used for payments. ' + managed],
    ['Payee Name', PAYMENT_CONFIG.PAYEE_NAME, managed],
    ['Individual Registration Fee (INR)', PAYMENT_CONFIG.FEES.Individual, managed],
    ['Team Entry Fee (INR)', PAYMENT_CONFIG.FEES.Team, managed],
    ['Maximum Confirmed Teams', RULES.MAX_CONFIRMED_TEAMS, 'Enforced on registration, payment submission and verification. ' + managed],
    ['Maximum Matches Per Calendar Day', RULES.MAX_MATCHES_PER_DAY, 'Enforced when scheduling matches. ' + managed],
    ['Squad Size (min-max)', RULES.MIN_SQUAD + '-' + RULES.MAX_SQUAD, managed],
    ['Player Age (min-max)', RULES.MIN_AGE + '-' + RULES.MAX_AGE, managed],
    ['Payment Verification', 'Manual by admin only', 'A UPI launch or submitted UTR is never treated as proof of payment.'],
    ['Settings Last Synced', nowIst_(), 'Updated each time setup runs.'],
  ]
  var rows = getDataRows_(sheet)
  var index = {}
  rows.forEach(function (r, i) { index[String(r[0])] = i + 2 })
  settings.forEach(function (s) {
    var rowNumber = index[s[0]]
    if (rowNumber) sheet.getRange(rowNumber, 1, 1, 3).setValues([[s[0], String(s[1]), s[2]]])
    else sheet.appendRow([s[0], String(s[1]), s[2]])
  })
}

/**
 * Admin-only: removes an integration-test registration (name must start with
 * "[TEST]") and its payment records. Refuses anything else.
 */
function purgeTestRegistration_(registrationId) {
  var found = findRegistration_(String(registrationId || '').trim().toUpperCase())
  if (!found) throw clientError_('NOT_FOUND', 'Registration not found.')
  if (String(found.name).indexOf(TEST_LABEL) !== 0) {
    throw clientError_('FORBIDDEN', 'Only registrations whose name starts with ' + TEST_LABEL + ' can be removed this way.')
  }
  var paySheet = getSheet_(SHEET_NAMES.PAYMENTS)
  var payRows = getDataRows_(paySheet)
  var removedPayments = 0
  for (var i = payRows.length - 1; i >= 0; i--) {
    if (payRows[i][COL.PAY.REG_ID] === found.id) {
      paySheet.deleteRow(i + 2)
      removedPayments++
    }
  }
  found.sheet.deleteRow(found.rowNumber)
  return { ok: true, registrationId: found.id, removedPayments: removedPayments }
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateIndividual_(d) {
  var fe = {}
  var fullName = limit_(str_(d.fullName), 80)
  if (fullName.length < 3) fe.fullName = 'Full name must be at least 3 characters.'

  var dob = str_(d.dateOfBirth)
  var age = computeAge_(dob)
  if (age === null) fe.dateOfBirth = 'Enter a valid date of birth (YYYY-MM-DD).'
  else if (age < RULES.MIN_AGE) fe.dateOfBirth = 'Minimum age is ' + RULES.MIN_AGE + ' years.'
  else if (age > RULES.MAX_AGE) fe.dateOfBirth = 'Maximum age is ' + RULES.MAX_AGE + ' years.'

  var mobile = normalizeMobile_(d.mobileNumber)
  if (!mobile) fe.mobileNumber = 'Enter a valid 10-digit Indian mobile number.'

  var email = limit_(str_(d.emailAddress), 120)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fe.emailAddress = 'Invalid email address.'

  var city = limit_(str_(d.city), 60)
  if (!city) fe.city = 'City is required.'

  var role = str_(d.playingRole)
  if (RULES.ROLES.indexOf(role) === -1) fe.playingRole = 'Select a valid playing role.'

  var experience = limit_(str_(d.cricketExperience), 500)

  var emergency = normalizeMobile_(d.emergencyContact)
  if (!emergency) fe.emergencyContact = 'Enter a valid 10-digit emergency contact number.'
  else if (emergency === mobile) fe.emergencyContact = 'Emergency contact must differ from your mobile number.'

  if (d.consentAgreed !== true) fe.consentAgreed = 'You must accept the tournament terms.'

  if (Object.keys(fe).length) throw clientError_('VALIDATION', 'Please correct the highlighted fields.', fe)

  return {
    fullName: sanitizeCell_(fullName),
    dateOfBirth: dob,
    age: age,
    mobile: mobile,
    email: sanitizeCell_(email),
    city: sanitizeCell_(city),
    role: role,
    experience: sanitizeCell_(experience),
    emergency: emergency,
  }
}

function validateTeam_(d) {
  var fe = {}
  var teamName = limit_(str_(d.teamName), 60)
  if (teamName.length < 3) fe.teamName = 'Team name must be at least 3 characters.'

  var captainName = limit_(str_(d.captainName), 80)
  if (captainName.length < 3) fe.captainName = 'Captain name must be at least 3 characters.'

  var captainMobile = normalizeMobile_(d.captainMobile)
  if (!captainMobile) fe.captainMobile = 'Enter a valid 10-digit captain mobile number.'

  var email = limit_(str_(d.emailAddress), 120)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fe.emailAddress = 'Invalid email address.'

  var city = limit_(str_(d.city), 60)
  if (!city) fe.city = 'City is required.'

  var rosterIn = Object.prototype.toString.call(d.roster) === '[object Array]' ? d.roster : []
  var roster = []
  if (rosterIn.length < RULES.MIN_SQUAD || rosterIn.length > RULES.MAX_SQUAD) {
    fe.roster = 'Squad must have between ' + RULES.MIN_SQUAD + ' and ' + RULES.MAX_SQUAD + ' players.'
  } else {
    var seen = {}
    rosterIn.forEach(function (p, i) {
      p = p || {}
      var name = limit_(str_(p.name), 80)
      var mob = normalizeMobile_(p.mobileNumber)
      var role = str_(p.playingRole)
      if (name.length < 2) fe['player_' + i + '_name'] = 'Player #' + (i + 1) + ' name is required.'
      if (!mob) fe['player_' + i + '_mobileNumber'] = 'Player #' + (i + 1) + ' mobile is invalid.'
      else if (seen[mob]) fe['player_' + i + '_mobileNumber'] = 'Player #' + (i + 1) + ' mobile is duplicated in the squad.'
      if (RULES.ROLES.indexOf(role) === -1) fe['player_' + i + '_playingRole'] = 'Player #' + (i + 1) + ' role is invalid.'
      if (mob) seen[mob] = true
      roster.push({ name: sanitizeCell_(name), mobile: mob, role: role })
    })
  }
  if (d.numberOfPlayers !== undefined && Number(d.numberOfPlayers) !== rosterIn.length) {
    fe.roster = 'Squad size does not match the number of players listed.'
  }

  if (d.consentAgreed !== true) fe.consentAgreed = 'Captain must accept the tournament terms.'

  if (Object.keys(fe).length) throw clientError_('VALIDATION', 'Please correct the highlighted fields.', fe)

  return {
    teamName: sanitizeCell_(teamName),
    captainName: sanitizeCell_(captainName),
    captainMobile: captainMobile,
    email: sanitizeCell_(email),
    city: sanitizeCell_(city),
    roster: roster,
  }
}

/** Client-sent amount is optional; if sent it must equal the server fee. */
function assertClientAmount_(clientAmount, expected) {
  if (clientAmount === undefined || clientAmount === null || clientAmount === '') return
  if (Number(clientAmount) !== expected) {
    throw clientError_('AMOUNT_MISMATCH', 'Payment amount mismatch. The fee for this registration is INR ' + expected + '.')
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function publicPaymentConfig_() {
  return {
    upiId: PAYMENT_CONFIG.UPI_ID,
    payeeName: PAYMENT_CONFIG.PAYEE_NAME,
    tournamentName: PAYMENT_CONFIG.TOURNAMENT_NAME,
    currency: PAYMENT_CONFIG.CURRENCY,
    fees: { Individual: PAYMENT_CONFIG.FEES.Individual, Team: PAYMENT_CONFIG.FEES.Team },
  }
}

function buildReceipt_(type, id, name, mobile, amount, paymentStatus, regStatus, submittedAt, utr) {
  return {
    registrationId: id,
    type: type,
    displayName: name,
    mobileLast4: String(mobile).slice(-4),
    amount: amount,
    paymentStatus: paymentStatus,
    registrationStatus: regStatus,
    submittedAt: submittedAt,
    utr: utr || '',
    payment: {
      upiId: PAYMENT_CONFIG.UPI_ID,
      payeeName: PAYMENT_CONFIG.PAYEE_NAME,
      tournamentName: PAYMENT_CONFIG.TOURNAMENT_NAME,
      amount: amount,
      currency: PAYMENT_CONFIG.CURRENCY,
      note: 'NGPL S1 ' + id,
      reference: id,
    },
  }
}

function receiptFromFound_(f) {
  return buildReceipt_(f.type, f.id, f.name, f.mobile, PAYMENT_CONFIG.FEES[f.type], f.paymentStatus, f.regStatus, f.ts, f.utr)
}

function findRegistration_(registrationId) {
  if (!registrationId) return null
  var isTeam = registrationId.indexOf('NGPL-S1-TEAM-') === 0
  var isInd = registrationId.indexOf('NGPL-S1-IND-') === 0
  if (!isTeam && !isInd) return null
  var sheet = getSheet_(isTeam ? SHEET_NAMES.TEAM : SHEET_NAMES.INDIVIDUAL)
  var c = isTeam ? COL.TEAM : COL.IND
  var rows = getDataRows_(sheet)
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][c.ID] === registrationId) {
      var r = rows[i]
      return {
        sheet: sheet,
        rowNumber: i + 2,
        cols: c,
        type: isTeam ? 'Team' : 'Individual',
        id: r[c.ID],
        ts: r[c.TS],
        name: isTeam ? r[c.TEAM] : r[c.NAME],
        mobile: String(r[c.MOBILE]),
        utr: String(r[c.UTR] || ''),
        paymentStatus: r[c.PAY_STATUS],
        regStatus: r[c.REG_STATUS],
      }
    }
  }
  return null
}

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID
  if (id) return SpreadsheetApp.openById(id)
  var active = SpreadsheetApp.getActiveSpreadsheet()
  if (!active) throw new Error('No spreadsheet configured. Set SPREADSHEET_ID in Script Properties or bind the script to a sheet.')
  return active
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name)
  if (!sheet) {
    setup()
    sheet = getSpreadsheet_().getSheetByName(name)
  }
  return sheet
}

function readHeaderRow_(sheet) {
  var lastCol = sheet.getLastColumn()
  if (lastCol < 1) return []
  var row = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (v) { return String(v).trim() })
  while (row.length && row[row.length - 1] === '') row.pop()
  return row
}

/** Returns a human-readable problem if the tab's header row is incompatible, else null. */
function headerProblem_(sheet, headers) {
  var name = sheet.getName()
  var existing = readHeaderRow_(sheet)
  if (!existing.length) {
    return sheet.getLastRow() > 1 ? 'Tab "' + name + '" has data but no header row (rename it, then run setup).' : 'Tab "' + name + '" has no header row (run setup).'
  }
  for (var i = 0; i < existing.length; i++) {
    if (i >= headers.length || existing[i] !== headers[i]) {
      return 'Tab "' + name + '" has unexpected header in column ' + (i + 1) + ': "' + existing[i] + '" (expected "' +
        (headers[i] || '(no column)') + '"). Rename that tab (e.g. "' + name + ' (old)") and run setup; existing data is never overwritten.'
    }
  }
  if (existing.length < headers.length) return 'Tab "' + name + '" is missing columns: ' + headers.slice(existing.length).join(', ') + ' (run setup).'
  return null
}

/**
 * Creates the tab if missing and writes headers ONLY into an empty tab or as
 * missing trailing columns. Never overwrites existing cells or deletes data.
 */
function ensureSheet_(name, headers, numericCols) {
  var ss = getSpreadsheet_()
  var sheet = ss.getSheetByName(name)
  if (!sheet) sheet = ss.insertSheet(name)
  var existing = readHeaderRow_(sheet)

  if (!existing.length) {
    if (sheet.getLastRow() > 1) {
      throw new Error('Tab "' + name + '" contains data but no header row. Nothing was changed. Rename that tab and run setup again.')
    }
    // Brand-new/empty tab: store as plain text (keeps phone numbers intact,
    // blocks formula interpretation); numeric columns stay numeric.
    sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).setNumberFormat('@')
    ;(numericCols || []).forEach(function (c) {
      sheet.getRange(2, c + 1, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('0')
    })
    styleHeader_(sheet.getRange(1, 1, 1, headers.length).setValues([headers]))
    sheet.setFrozenRows(1)
    return sheet
  }

  var problem = headerProblem_(sheet, headers)
  if (problem && problem.indexOf('is missing columns') === -1) {
    throw new Error(problem + ' Nothing was changed.')
  }
  if (existing.length < headers.length) {
    var add = headers.slice(existing.length)
    var startCol = existing.length + 1
    sheet.getRange(1, startCol, sheet.getMaxRows(), add.length).setNumberFormat('@')
    styleHeader_(sheet.getRange(1, startCol, 1, add.length).setValues([add]))
  }
  return sheet
}

function styleHeader_(range) {
  range.setFontWeight('bold').setBackground('#0b1220').setFontColor('#fbbf24')
}

function getDataRows_(sheet) {
  var last = sheet.getLastRow()
  if (last < 2) return []
  return sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues()
}

/** Appends a row and reads it back to confirm the write actually persisted. */
function appendRowVerified_(sheet, row, id) {
  sheet.appendRow(row)
  SpreadsheetApp.flush()
  var last = sheet.getLastRow()
  var written = sheet.getRange(last, 1).getValue()
  if (written !== id) {
    throw new Error('Write verification failed for ' + id)
  }
}

function generateUniqueId_(prefix, rows, col) {
  var existing = {}
  rows.forEach(function (r) { existing[r[col]] = true })
  for (var attempt = 0; attempt < 20; attempt++) {
    var uuid = Utilities.getUuid().replace(/-/g, '')
    var suffix = ''
    for (var i = 0; i < 6; i++) {
      suffix += ID_ALPHABET.charAt(parseInt(uuid.substr(i * 2, 2), 16) % ID_ALPHABET.length)
    }
    var id = prefix + suffix
    if (!existing[id]) return id
  }
  throw new Error('Could not generate a unique ID')
}

function withLock_(fn) {
  var lock = LockService.getScriptLock()
  if (!lock.tryLock(25000)) {
    throw clientError_('BUSY', 'The registration server is busy. Please try again in a moment.')
  }
  try {
    return fn()
  } finally {
    lock.releaseLock()
  }
}

/** Prevents double submissions (double-clicks / retries) using a client request ID. */
function withIdempotency_(requestId, fn) {
  var key = requestId && /^[A-Za-z0-9-]{8,64}$/.test(String(requestId)) ? 'req_' + requestId : null
  var cache = CacheService.getScriptCache()
  if (key) {
    var cached = cache.get(key)
    if (cached) return JSON.parse(cached)
  }
  var result = fn()
  if (key && result && result.ok) cache.put(key, JSON.stringify(result), IDEMPOTENCY_TTL_SECONDS)
  return result
}

function computeAge_(dob) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob || '')
  if (!m) return null
  var y = Number(m[1]), mo = Number(m[2]), d = Number(m[3])
  var check = new Date(Date.UTC(y, mo - 1, d))
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null
  var today = Utilities.formatDate(new Date(), RULES.TIMEZONE, 'yyyy-MM-dd').split('-').map(Number)
  var age = today[0] - y
  if (today[1] < mo || (today[1] === mo && today[2] < d)) age--
  if (age < 0 || age > 120) return null
  return age
}

function normalizeMobile_(v) {
  var digits = String(v === undefined || v === null ? '' : v).replace(/\D/g, '')
  if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.substring(2)
  else if (digits.length === 11 && digits.charAt(0) === '0') digits = digits.substring(1)
  return /^[6-9]\d{9}$/.test(digits) ? digits : ''
}

function normalizeKey_(v) {
  return String(v || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function str_(v) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : ''
}

function limit_(s, n) {
  return s.length > n ? s.substring(0, n) : s
}

/** Neutralises spreadsheet formula injection. */
function sanitizeCell_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s
}

function nowIst_() {
  return Utilities.formatDate(new Date(), RULES.TIMEZONE, 'yyyy-MM-dd HH:mm:ss') + ' IST'
}

function constantTimeEquals_(a, b) {
  var diff = a.length ^ b.length
  for (var i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

function clientError_(code, message, fieldErrors) {
  var err = new Error(message)
  err.isClientError = true
  err.code = code
  err.fieldErrors = fieldErrors
  return err
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function logError_(msg, err) {
  console.error(msg + ': ' + (err && err.stack ? err.stack : err))
}
