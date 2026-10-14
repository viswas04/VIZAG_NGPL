/**
 * LIVE integration test against the deployed Apps Script web app.
 *
 *   node scripts/live-integration-test.mjs <WEB_APP_URL> [ADMIN_KEY] [--keep]
 *
 * 1. GET ?action=health — confirms the backend is ready and targets the expected
 *    spreadsheet (checks the last 6 chars of the spreadsheet ID only).
 * 2. Registers one clearly labelled "[TEST]" individual and one "[TEST]" team.
 * 3. Reads both back through lookupRegistration (served from the live sheet).
 * 4. With ADMIN_KEY: confirms the rows via adminList, then removes them with
 *    adminPurgeTestRegistration (only "[TEST]" rows can be purged) unless --keep.
 *
 * Writes real rows to Google Sheets. Never prints the admin key.
 */
const [, , url, adminKeyArg, ...flags] = process.argv
const keep = flags.includes('--keep') || adminKeyArg === '--keep'
const adminKey = adminKeyArg && adminKeyArg !== '--keep' ? adminKeyArg : ''
const EXPECTED_SHEET_SUFFIX = 'mnyPMo' // 1Jjgpb8ZGkleAi0JoMQAHZxuCa9aHUF5AQ51bXmnyPMo

if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) {
  console.error('Usage: node scripts/live-integration-test.mjs https://script.google.com/macros/s/<ID>/exec [ADMIN_KEY] [--keep]')
  process.exit(2)
}

let failures = 0
const check = (ok, label, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`)
  if (!ok) failures++
  return ok
}
const post = async (body) => {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { ok: false, code: 'BAD_RESPONSE', error: text.slice(0, 200) } }
}

const stamp = Date.now().toString().slice(-6)
const mobile = () => '9' + String(Math.floor(Math.random() * 1e9)).padStart(9, '0')
const dob = `${new Date().getFullYear() - 25}-01-15`

const health = await (await fetch(`${url}?action=health`, { redirect: 'follow' })).json().catch(() => null)
check(health?.service === 'ngpl-registration-backend', 'health endpoint reachable')
check(health?.ready === true, 'backend ready', (health?.problems || []).join(' | '))
check(health?.spreadsheetIdSuffix === EXPECTED_SHEET_SUFFIX, 'targets the expected spreadsheet', `suffix=${health?.spreadsheetIdSuffix}`)
check(health?.payment?.upiId === '79893318524@ybl', 'UPI receiver 79893318524@ybl')
check(health?.capacity?.maxConfirmedTeams === 25 && health?.capacity?.maxMatchesPerDay === 4, 'limits 25 teams / 4 matches per day')
if (!health?.ready) {
  console.error('\nBackend not ready; aborting before writing anything.')
  process.exit(1)
}

const indMobile = mobile()
const ind = await post({
  action: 'registerIndividual',
  requestId: `live-test-ind-${stamp}`,
  data: {
    fullName: `[TEST] Integration Check ${stamp}`, dateOfBirth: dob, mobileNumber: indMobile, emailAddress: '',
    city: 'Visakhapatnam', playingRole: 'All-Rounder', cricketExperience: 'Automated integration test - delete',
    emergencyContact: mobile(), consentAgreed: true, amount: 149,
  },
})
check(ind.ok && /^NGPL-S1-IND-/.test(ind.registration?.registrationId || ''), 'individual saved', ind.registration?.registrationId || `${ind.code}: ${ind.error}`)
check(ind.registration?.payment?.amount === 149, 'individual fee 149')

const capMobile = mobile()
const roster = Array.from({ length: 11 }, (_, i) => ({
  name: i === 0 ? `[TEST] Captain ${stamp}` : `[TEST] Player ${i + 1}`,
  mobileNumber: i === 0 ? capMobile : mobile(),
  playingRole: 'All-Rounder',
}))
const team = await post({
  action: 'registerTeam',
  requestId: `live-test-team-${stamp}`,
  data: {
    teamName: `[TEST] Integration XI ${stamp}`, captainName: roster[0].name, captainMobile: capMobile, emailAddress: '',
    city: 'Visakhapatnam', numberOfPlayers: 11, roster, consentAgreed: true, amount: 12000,
  },
})
check(team.ok && /^NGPL-S1-TEAM-/.test(team.registration?.registrationId || ''), 'team saved', team.registration?.registrationId || `${team.code}: ${team.error}`)
check(team.registration?.payment?.amount === 12000, 'team fee 12000')

if (ind.ok) {
  const l = await post({ action: 'lookupRegistration', registrationId: ind.registration.registrationId, mobile: indMobile })
  check(l.ok && l.registration?.registrationId === ind.registration.registrationId, 'individual row read back from sheet', l.registration?.paymentStatus)
}
if (team.ok) {
  const l = await post({ action: 'lookupRegistration', registrationId: team.registration.registrationId, mobile: capMobile })
  check(l.ok && l.registration?.registrationId === team.registration.registrationId, 'team row read back from sheet', l.registration?.paymentStatus)
}

if (adminKey) {
  const list = await post({ action: 'adminList', adminKey })
  check(list.ok, 'admin list', list.ok ? '' : `${list.code}: ${list.error}`)
  if (list.ok) {
    check(list.individuals.some((r) => r.registrationId === ind.registration?.registrationId), 'individual present in Individual Registrations tab')
    check(list.teams.some((r) => r.registrationId === team.registration?.registrationId && r.squadSize === 11), 'team + roster present in Team Registrations tab')
  }
  if (!keep) {
    for (const r of [ind, team]) {
      if (!r.ok) continue
      const p = await post({ action: 'adminPurgeTestRegistration', adminKey, registrationId: r.registration.registrationId })
      check(p.ok, `removed test row ${r.registration.registrationId}`, p.ok ? '' : `${p.code}: ${p.error}`)
    }
  } else {
    console.log('(--keep) Test rows left in the sheet for visual inspection.')
  }
} else {
  console.log('\nNo ADMIN_KEY given: test rows were left in the sheet. Delete the rows whose names start with "[TEST]" after checking them.')
}

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll live checks passed')
process.exit(failures ? 1 : 0)
