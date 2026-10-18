/**
 * Automated tests for apps-script/Code.gs (run: npm run test:backend)
 * Uses the in-memory harness — validates server logic, NOT the live Google Sheet.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBackend } from './apps-script-harness.mjs'

const UPI = '7989318524-2@ybl'
const ADMIN = 'test-admin-key-123456'

function dobForAge(age) {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear() - age}-${pad(d.getMonth() + 1)}-${pad(Math.min(d.getDate(), 28))}`
}

const player = (over = {}) => ({
  fullName: 'Ravi Kumar',
  dateOfBirth: dobForAge(22),
  mobileNumber: '9876543210',
  emailAddress: 'ravi@example.com',
  city: 'Visakhapatnam',
  playingRole: 'Batsman',
  cricketExperience: '3 years club cricket',
  emergencyContact: '9123456780',
  consentAgreed: true,
  ...over,
})

const team = (over = {}) => {
  const roster = Array.from({ length: 11 }, (_, i) => ({
    name: i === 0 ? 'Suresh Captain' : `Player ${i + 1}`,
    mobileNumber: i === 0 ? '9000000001' : `90000001${String(i).padStart(2, '0')}`,
    playingRole: 'All-Rounder',
  }))
  return {
    teamName: 'Vizag Warriors',
    captainName: 'Suresh Captain',
    captainMobile: '9000000001',
    emailAddress: '',
    city: 'Visakhapatnam',
    numberOfPlayers: roster.length,
    roster,
    consentAgreed: true,
    ...over,
  }
}

test('health endpoint exposes the exact UPI receiver and fees', () => {
  const b = createBackend()
  const res = b.get({ action: 'health' })
  assert.equal(res.ok, true)
  assert.equal(res.payment.upiId, UPI)
  assert.deepEqual(res.payment.fees, { Individual: 149, Team: 12000 })
})

test('individual registration writes to Individual Registrations tab with correct columns', () => {
  const b = createBackend()
  const res = b.post({ action: 'registerIndividual', data: player(), requestId: 'req-ind-0001' })
  assert.equal(res.ok, true, JSON.stringify(res))
  const reg = res.registration
  assert.match(reg.registrationId, /^NGPL-S1-IND-[A-Z2-9]{6}$/)
  assert.equal(reg.amount, 149)
  assert.equal(reg.payment.upiId, UPI)
  assert.equal(reg.payment.amount, 149)
  assert.equal(reg.paymentStatus, 'Awaiting Payment')

  const rows = b.sheet('Individual Registrations').toObjects()
  assert.equal(rows.length, 1)
  const row = rows[0]
  assert.equal(row['Registration ID'], reg.registrationId)
  assert.equal(row['Full Name'], 'Ravi Kumar')
  assert.equal(row['Age'], 22)
  assert.equal(row['Mobile Number'], '9876543210')
  assert.equal(row['Registration Fee (INR)'], 149)
  assert.equal(row['Payment Status'], 'Awaiting Payment')
  assert.equal(row['Registration Status'], 'Pending Payment')
  assert.match(row['Submission Timestamp'], /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} IST$/)
  // Header row matches spec exactly
  assert.deepEqual(b.sheet('Individual Registrations').data[0].slice(0, 3), ['Registration ID', 'Submission Timestamp', 'Full Name'])
  // All tabs exist in the same spreadsheet
  assert.deepEqual([...b.spreadsheet.sheets.keys()].sort(), [
    'Individual Registrations',
    'Match Schedule',
    'Payment Records',
    'Team Registrations',
    'Tournament Settings',
  ])
})

test('server computes age itself and ignores client-sent age', () => {
  const b = createBackend()
  const res = b.post({ action: 'registerIndividual', data: { ...player(), age: 99 } })
  assert.equal(res.ok, true)
  assert.equal(b.sheet('Individual Registrations').toObjects()[0]['Age'], 22)
})

test('server-side validation rejects bad fields without writing', () => {
  const b = createBackend()
  const res = b.post({
    action: 'registerIndividual',
    data: player({ fullName: 'A', mobileNumber: '12345', dateOfBirth: dobForAge(10), playingRole: 'Captain', consentAgreed: false }),
  })
  assert.equal(res.ok, false)
  assert.equal(res.code, 'VALIDATION')
  for (const f of ['fullName', 'mobileNumber', 'dateOfBirth', 'playingRole', 'consentAgreed']) {
    assert.ok(res.fieldErrors[f], `expected error for ${f}`)
  }
  assert.equal(b.sheet('Individual Registrations')?.toObjects().length ?? 0, 0)
})

test('tampered amount is rejected', () => {
  const b = createBackend()
  const res = b.post({ action: 'registerIndividual', data: { ...player(), amount: 1 } })
  assert.equal(res.ok, false)
  assert.equal(res.code, 'AMOUNT_MISMATCH')
})

test('formula injection is neutralised', () => {
  const b = createBackend()
  const res = b.post({ action: 'registerIndividual', data: player({ fullName: '=HYPERLINK("x")', city: '+cmd' }) })
  assert.equal(res.ok, true)
  const row = b.sheet('Individual Registrations').toObjects()[0]
  assert.ok(row['Full Name'].startsWith("'="))
  assert.ok(row['City'].startsWith("'+"))
})

test('duplicate individual (same mobile) is blocked; same requestId is idempotent', () => {
  const b = createBackend()
  const first = b.post({ action: 'registerIndividual', data: player(), requestId: 'req-dup-0001' })
  const retry = b.post({ action: 'registerIndividual', data: player(), requestId: 'req-dup-0001' })
  assert.equal(retry.registration.registrationId, first.registration.registrationId)
  const dup = b.post({ action: 'registerIndividual', data: player({ fullName: 'Other Name' }), requestId: 'req-dup-0002' })
  assert.equal(dup.ok, false)
  assert.equal(dup.code, 'DUPLICATE')
  assert.equal(b.sheet('Individual Registrations').toObjects().length, 1)
})

test('team registration writes roster into Team Registrations tab', () => {
  const b = createBackend()
  const res = b.post({ action: 'registerTeam', data: team() })
  assert.equal(res.ok, true, JSON.stringify(res))
  assert.match(res.registration.registrationId, /^NGPL-S1-TEAM-[A-Z2-9]{6}$/)
  assert.equal(res.registration.payment.amount, 12000)
  assert.equal(res.registration.payment.upiId, UPI)
  const row = b.sheet('Team Registrations').toObjects()[0]
  assert.equal(row['Team Name'], 'Vizag Warriors')
  assert.equal(row['Squad Size'], 11)
  assert.equal(row['Team Entry Fee (INR)'], 12000)
  const roster = row['Player Roster (Name | Mobile | Role)'].split('\n')
  assert.equal(roster.length, 11)
  assert.equal(roster[0], '1. Suresh Captain | 9000000001 | All-Rounder')
})

test('team validation: squad size, duplicate mobiles, duplicate team name', () => {
  const b = createBackend()
  const small = team()
  small.roster = small.roster.slice(0, 5)
  small.numberOfPlayers = 5
  assert.equal(b.post({ action: 'registerTeam', data: small }).code, 'VALIDATION')

  const dupMob = team()
  dupMob.roster[3].mobileNumber = dupMob.roster[2].mobileNumber
  const r = b.post({ action: 'registerTeam', data: dupMob })
  assert.equal(r.code, 'VALIDATION')
  assert.ok(r.fieldErrors.player_3_mobileNumber)

  assert.equal(b.post({ action: 'registerTeam', data: team() }).ok, true)
  const dupName = team({ teamName: '  vizag   WARRIORS ', captainMobile: '9555555555' })
  dupName.roster[0].mobileNumber = '9555555555'
  assert.equal(b.post({ action: 'registerTeam', data: dupName }).code, 'DUPLICATE')
})

test('UTR submission creates Pending Verification payment record — never Verified', () => {
  const b = createBackend()
  const reg = b.post({ action: 'registerIndividual', data: player() }).registration
  const pay = b.post({ action: 'submitPayment', registrationId: reg.registrationId, mobile: '98765 43210', utr: '412345678901', amount: 149 })
  assert.equal(pay.ok, true, JSON.stringify(pay))
  assert.equal(pay.registration.paymentStatus, 'Pending Verification')
  assert.equal(pay.registration.registrationStatus, 'Under Review')
  assert.match(pay.registration.paymentRef, /^PAY-\d{6}-[A-Z2-9]{6}$/)

  const p = b.sheet('Payment Records').toObjects()[0]
  assert.equal(p['Registration ID'], reg.registrationId)
  assert.equal(p['Registration Type'], 'Individual')
  assert.equal(p['Payer Name'], 'Ravi Kumar')
  assert.equal(p['Payer Mobile Number'], '9876543210')
  assert.equal(p['Expected Amount (INR)'], 149)
  assert.equal(p['UPI Receiver'], UPI)
  assert.equal(p['UTR/Transaction Reference'], '412345678901')
  assert.equal(p['Verification Status'], 'Pending Verification')
  assert.equal(p['Verified/Rejected Timestamp'], '')

  const row = b.sheet('Individual Registrations').toObjects()[0]
  assert.equal(row['Payment UTR/Reference'], '412345678901')
  assert.equal(row['Payment Status'], 'Pending Verification')
})

test('UTR submission guards: format, wrong mobile, double submit, reused UTR', () => {
  const b = createBackend()
  const a = b.post({ action: 'registerIndividual', data: player() }).registration
  const c = b.post({ action: 'registerIndividual', data: player({ mobileNumber: '9988776655' }) }).registration

  assert.equal(b.post({ action: 'submitPayment', registrationId: a.registrationId, mobile: '9876543210', utr: 'INVALID UTR!' }).code, 'VALIDATION')
  assert.equal(b.post({ action: 'submitPayment', registrationId: a.registrationId, mobile: '9000000000', utr: '412345678901' }).code, 'NOT_FOUND')
  assert.equal(b.post({ action: 'submitPayment', registrationId: a.registrationId, mobile: '9876543210', utr: '412345678901' }).ok, true)
  // same UTR retry is idempotent
  assert.equal(b.post({ action: 'submitPayment', registrationId: a.registrationId, mobile: '9876543210', utr: '412345678901' }).ok, true)
  // different UTR while pending is blocked
  assert.equal(b.post({ action: 'submitPayment', registrationId: a.registrationId, mobile: '9876543210', utr: '499999999999' }).code, 'INVALID_STATE')
  // UTR reused on another registration is blocked
  assert.equal(b.post({ action: 'submitPayment', registrationId: c.registrationId, mobile: '9988776655', utr: '412345678901' }).code, 'DUPLICATE')
  assert.equal(b.sheet('Payment Records').toObjects().length, 1)
})

test('admin endpoints require the server-side ADMIN_KEY and lock out brute force', () => {
  const b = createBackend()
  assert.equal(b.post({ action: 'adminList' }).code, 'UNAUTHORIZED')
  assert.equal(b.post({ action: 'adminList', adminKey: 'wrong' }).code, 'UNAUTHORIZED')
  assert.equal(b.post({ action: 'adminLogin', adminKey: ADMIN }).ok, true)
  for (let i = 0; i < 10; i++) b.post({ action: 'adminLogin', adminKey: 'bad' })
  assert.equal(b.post({ action: 'adminLogin', adminKey: ADMIN }).code, 'LOCKED')
})

test('admin verify / reject flow syncs Payment Records and registration tabs', () => {
  const b = createBackend()
  const reg = b.post({ action: 'registerTeam', data: team() }).registration
  const ref = b.post({ action: 'submitPayment', registrationId: reg.registrationId, mobile: '9000000001', utr: '512345678901' }).registration.paymentRef

  // Cannot confirm a registration before payment is verified
  assert.equal(b.post({ action: 'adminUpdateRegistration', adminKey: ADMIN, registrationId: reg.registrationId, status: 'Confirmed' }).code, 'INVALID_STATE')

  const rej = b.post({ action: 'adminUpdatePayment', adminKey: ADMIN, paymentRef: ref, status: 'Rejected', notes: 'Not found in statement' })
  assert.equal(rej.ok, true)
  let p = b.sheet('Payment Records').toObjects()[0]
  assert.equal(p['Verification Status'], 'Rejected')
  assert.equal(p['Admin Notes'], 'Not found in statement')
  assert.ok(p['Verified/Rejected Timestamp'])
  let t = b.sheet('Team Registrations').toObjects()[0]
  assert.equal(t['Payment Status'], 'Rejected')
  assert.equal(t['Registration Status'], 'Payment Rejected')

  // After rejection the captain can submit a corrected UTR
  const ref2 = b.post({ action: 'submitPayment', registrationId: reg.registrationId, mobile: '9000000001', utr: '512345678902' }).registration.paymentRef
  assert.notEqual(ref2, ref)
  const ok = b.post({ action: 'adminUpdatePayment', adminKey: ADMIN, paymentRef: ref2, status: 'Verified', notes: 'Matched in PhonePe business statement' })
  assert.equal(ok.ok, true)
  t = b.sheet('Team Registrations').toObjects()[0]
  assert.equal(t['Payment Status'], 'Verified')
  assert.equal(t['Registration Status'], 'Confirmed')

  const list = b.post({ action: 'adminList', adminKey: ADMIN })
  assert.equal(list.teams.length, 1)
  assert.equal(list.payments.length, 2)
  assert.ok(list.payments.every((x) => x.upiReceiver === UPI))
})

test('lookup requires both registration ID and matching mobile', () => {
  const b = createBackend()
  const reg = b.post({ action: 'registerIndividual', data: player() }).registration
  assert.equal(b.post({ action: 'lookupRegistration', registrationId: reg.registrationId, mobile: '9000000000' }).code, 'NOT_FOUND')
  const ok = b.post({ action: 'lookupRegistration', registrationId: reg.registrationId.toLowerCase(), mobile: '+91 98765 43210' })
  assert.equal(ok.ok, true)
  assert.equal(ok.registration.payment.upiId, UPI)
})

test('spreadsheet failure returns a clear error and never claims success', () => {
  const b = createBackend()
  b.context.setup()
  b.env.failWrites = true
  const res = b.post({ action: 'registerIndividual', data: player() })
  assert.equal(res.ok, false)
  assert.equal(res.code, 'SERVER_ERROR')
  assert.match(res.error, /Nothing was recorded/)
  assert.equal(res.registration, undefined)
})

test('malformed JSON and unknown actions are rejected', () => {
  const b = createBackend()
  const out = JSON.parse(b.context.doPost({ postData: { contents: '{not json' } }).getContent())
  assert.equal(out.code, 'BAD_REQUEST')
  assert.equal(b.post({ action: 'dropTables' }).code, 'BAD_REQUEST')
})

// ---------------------------------------------------------------------------
// Capacity: 25 confirmed teams, 4 matches per day
// ---------------------------------------------------------------------------

function registerTeamN(b, i) {
  const cap = `91000000${String(i).padStart(2, '0')}`
  const t = team({ teamName: `Team Number ${i}`, captainName: `Captain ${i}`, captainMobile: cap })
  t.roster[0].mobileNumber = cap
  const res = b.post({ action: 'registerTeam', data: t })
  return { res, cap }
}

function payTeam(b, reg, cap, i) {
  return b.post({ action: 'submitPayment', registrationId: reg.registrationId, mobile: cap, utr: `6${String(i).padStart(11, '0')}` })
}

function confirmedTeam(b, i) {
  const { res, cap } = registerTeamN(b, i)
  assert.equal(res.ok, true, JSON.stringify(res))
  const pay = payTeam(b, res.registration, cap, i)
  assert.equal(pay.ok, true, JSON.stringify(pay))
  const v = b.post({ action: 'adminUpdatePayment', adminKey: ADMIN, paymentRef: pay.registration.paymentRef, status: 'Verified' })
  assert.equal(v.ok, true, JSON.stringify(v))
  return res.registration.registrationId
}

test('team registration closes when 25 teams are confirmed or awaiting verification', () => {
  const b = createBackend()
  const refs = []
  for (let i = 1; i <= 25; i++) {
    const { res, cap } = registerTeamN(b, i)
    assert.equal(res.ok, true, JSON.stringify(res))
    refs.push(payTeam(b, res.registration, cap, i).registration.paymentRef)
  }
  const health = b.get({ action: 'health' })
  assert.equal(health.capacity.pendingVerificationTeams, 25)
  assert.equal(health.capacity.openForRegistration, false)

  const full = registerTeamN(b, 26).res
  assert.equal(full.ok, false)
  assert.equal(full.code, 'TEAM_CAPACITY_REACHED')
  assert.equal(b.sheet('Team Registrations').toObjects().length, 25)

  // Rejecting one payment frees a provisional slot
  assert.equal(b.post({ action: 'adminUpdatePayment', adminKey: ADMIN, paymentRef: refs[0], status: 'Rejected' }).ok, true)
  assert.equal(registerTeamN(b, 27).res.ok, true)
})

test('backend never allows more than 25 confirmed teams', () => {
  const b = createBackend()
  const ids = []
  for (let i = 1; i <= 25; i++) ids.push(confirmedTeam(b, i))
  assert.equal(b.get({ action: 'health' }).capacity.confirmedTeams, 25)
  assert.equal(b.get({ action: 'health' }).capacity.slotsRemaining, 0)

  // New registrations blocked
  assert.equal(registerTeamN(b, 26).res.code, 'TEAM_CAPACITY_REACHED')

  // Free a slot, let team 26 register + pay, then refill the slot
  assert.equal(b.post({ action: 'adminUpdateRegistration', adminKey: ADMIN, registrationId: ids[0], status: 'Cancelled' }).ok, true)
  const { res, cap } = registerTeamN(b, 26)
  assert.equal(res.ok, true, JSON.stringify(res))
  const pay = payTeam(b, res.registration, cap, 26)
  assert.equal(pay.ok, true, JSON.stringify(pay))
  assert.equal(b.post({ action: 'adminUpdateRegistration', adminKey: ADMIN, registrationId: ids[0], status: 'Confirmed' }).ok, true)

  // Now 25 confirmed again: verifying team 26 must be refused
  const v = b.post({ action: 'adminUpdatePayment', adminKey: ADMIN, paymentRef: pay.registration.paymentRef, status: 'Verified' })
  assert.equal(v.ok, false)
  assert.equal(v.code, 'TEAM_CAPACITY_REACHED')
  const confirmed = b.sheet('Team Registrations').toObjects().filter((r) => r['Registration Status'] === 'Confirmed')
  assert.equal(confirmed.length, 25)
  // Payment record stays Pending Verification (not silently verified)
  const p = b.sheet('Payment Records').toObjects().find((r) => r['Payment Reference ID'] === pay.registration.paymentRef)
  assert.equal(p['Verification Status'], 'Pending Verification')
})

test('match scheduling: confirmed teams only, max 4 matches per day', () => {
  const b = createBackend()
  const ids = []
  for (let i = 1; i <= 10; i++) ids.push(confirmedTeam(b, i))
  const pending = registerTeamN(b, 11).res.registration.registrationId
  const date = '2026-11-15'
  const sched = (a, c, time, d = date) =>
    b.post({ action: 'adminScheduleMatch', adminKey: ADMIN, date: d, time, teamAId: a, teamBId: c, venue: 'Main Ground' })

  assert.equal(b.post({ action: 'adminScheduleMatch', date, time: '08:00', teamAId: ids[0], teamBId: ids[1] }).code, 'UNAUTHORIZED')
  assert.equal(sched(ids[0], pending, '08:00').code, 'VALIDATION')
  assert.equal(sched(ids[0], ids[0], '08:00').code, 'VALIDATION')
  assert.equal(sched(ids[0], ids[1], '25:00').code, 'VALIDATION')

  const m1 = sched(ids[0], ids[1], '07:00')
  assert.equal(m1.ok, true, JSON.stringify(m1))
  assert.match(m1.match.matchId, /^MATCH-[A-Z2-9]{6}$/)
  assert.equal(sched(ids[2], ids[3], '07:00').code, 'VALIDATION') // time clash
  assert.equal(sched(ids[0], ids[2], '10:00').code, 'VALIDATION') // team already plays that day
  assert.equal(sched(ids[2], ids[3], '10:00').ok, true)
  assert.equal(sched(ids[4], ids[5], '13:00').ok, true)
  assert.equal(sched(ids[6], ids[7], '16:00').ok, true)

  const fifth = sched(ids[8], ids[9], '19:00')
  assert.equal(fifth.ok, false)
  assert.equal(fifth.code, 'MATCH_LIMIT_REACHED')
  assert.equal(sched(ids[8], ids[9], '07:00', '2026-11-16').ok, true) // next day is fine

  // Cancelling frees a slot; restoring the cancelled match is then blocked
  assert.equal(b.post({ action: 'adminUpdateMatch', adminKey: ADMIN, matchId: m1.match.matchId, status: 'Cancelled' }).ok, true)
  assert.equal(sched(ids[8], ids[9], '19:00').ok, true)
  const restore = b.post({ action: 'adminUpdateMatch', adminKey: ADMIN, matchId: m1.match.matchId, status: 'Scheduled' })
  assert.equal(restore.code, 'MATCH_LIMIT_REACHED')

  const rows = b.sheet('Match Schedule').toObjects()
  assert.equal(rows.length, 6)
  assert.equal(rows.filter((r) => r['Match Date'] === date && r['Match Status'] !== 'Cancelled').length, 4)
  const list = b.post({ action: 'adminList', adminKey: ADMIN })
  assert.equal(list.matches.length, 6)
  assert.equal(list.capacity.confirmedTeams, 10)
})

// ---------------------------------------------------------------------------
// Existing spreadsheet safety, Tournament Settings, test cleanup
// ---------------------------------------------------------------------------

test('setup never overwrites existing data; appends missing header columns only', () => {
  const b = createBackend()
  // Pre-existing unrelated tab and an older Individual tab missing trailing columns
  const other = b.spreadsheet.insertSheet('Sheet1')
  other.data = [['Organizer notes'], ['keep me']]
  const ind = b.spreadsheet.insertSheet('Individual Registrations')
  const oldHeaders = ['Registration ID', 'Submission Timestamp', 'Full Name', 'Date of Birth', 'Age', 'Mobile Number', 'Email', 'City', 'Playing Role', 'Cricket Experience', 'Emergency Contact', 'Registration Fee (INR)', 'Payment UTR/Reference']
  ind.data = [oldHeaders.slice(), ['NGPL-S1-IND-OLD001', '2026-10-01 10:00:00 IST', 'Existing Player', '2000-01-01', 26, '9811111111', '', 'Vizag', 'Batsman', '', '9822222222', 149, '']]

  b.context.setup()
  assert.deepEqual(other.data, [['Organizer notes'], ['keep me']])
  assert.equal(ind.data[0].length, 15)
  assert.deepEqual(ind.data[0].slice(13), ['Payment Status', 'Registration Status'])
  assert.equal(ind.data[1][2], 'Existing Player')
  assert.equal(b.get({ action: 'health' }).ready, true)

  // Existing player's mobile is still treated as a duplicate
  assert.equal(b.post({ action: 'registerIndividual', data: player({ mobileNumber: '9811111111' }) }).code, 'DUPLICATE')
})

test('a tab with conflicting headers is reported and left untouched', () => {
  const b = createBackend()
  const team = b.spreadsheet.insertSheet('Team Registrations')
  team.data = [['Name', 'Phone'], ['Someone', '9000000000']]
  assert.throws(() => b.context.setup(), /unexpected header.*Nothing was changed/)
  assert.deepEqual(team.data, [['Name', 'Phone'], ['Someone', '9000000000']])
  const h = b.get({ action: 'health' })
  assert.equal(h.ready, false)
  assert.ok(h.problems.some((p) => p.includes('Team Registrations') && p.includes('unexpected header')))
})

test('Tournament Settings tab mirrors UPI, fees and limits (upsert, no duplicates)', () => {
  const b = createBackend()
  b.context.setup()
  b.context.setup()
  const rows = b.sheet('Tournament Settings').toObjects()
  const get = (k) => rows.filter((r) => r.Setting === k)
  assert.equal(get('Payment Receiver UPI ID').length, 1)
  assert.equal(get('Payment Receiver UPI ID')[0].Value, UPI)
  assert.equal(get('Individual Registration Fee (INR)')[0].Value, '149')
  assert.equal(get('Team Entry Fee (INR)')[0].Value, '12000')
  assert.equal(get('Maximum Confirmed Teams')[0].Value, '25')
  assert.equal(get('Maximum Matches Per Calendar Day')[0].Value, '4')
})

test('admin purge removes only [TEST]-labelled registrations and their payments', () => {
  const b = createBackend()
  const real = b.post({ action: 'registerIndividual', data: player() }).registration
  const t = b.post({ action: 'registerIndividual', data: player({ fullName: '[TEST] Integration Check', mobileNumber: '9988776655' }) }).registration
  b.post({ action: 'submitPayment', registrationId: t.registrationId, mobile: '9988776655', utr: '700000000001' })

  assert.equal(b.post({ action: 'adminPurgeTestRegistration', registrationId: t.registrationId }).code, 'UNAUTHORIZED')
  assert.equal(b.post({ action: 'adminPurgeTestRegistration', adminKey: ADMIN, registrationId: real.registrationId }).code, 'FORBIDDEN')
  const res = b.post({ action: 'adminPurgeTestRegistration', adminKey: ADMIN, registrationId: t.registrationId })
  assert.equal(res.ok, true, JSON.stringify(res))
  assert.equal(res.removedPayments, 1)
  const left = b.sheet('Individual Registrations').toObjects()
  assert.equal(left.length, 1)
  assert.equal(left[0]['Registration ID'], real.registrationId)
  assert.equal(b.sheet('Payment Records').toObjects().length, 0)
})
