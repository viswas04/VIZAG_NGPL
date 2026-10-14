// HTTP-level smoke test against a running backend (mock or real Apps Script URL).
// Usage: node scripts/http-smoke.mjs [backendUrl] [adminKey]
// WARNING: against a real deployment this writes TEST rows to the live sheet.
const URL_ = process.argv[2] || 'http://localhost:8787'
const ADMIN = process.argv[3] || 'local-admin-key-0000'
const rnd = () => String(Math.floor(Math.random() * 1e9)).padStart(9, '0')

async function call(action, payload = {}) {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // same as frontend (no CORS preflight)
    body: JSON.stringify({ action, ...payload }),
    redirect: 'follow',
  })
  return { cors: res.headers.get('access-control-allow-origin'), json: await res.json() }
}

const mob = '9' + rnd().slice(0, 9)
const capMob = '8' + rnd().slice(0, 9)
const ok = (c, m) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`)
  if (!c) process.exitCode = 1
}

const ind = await call('registerIndividual', {
  requestId: crypto.randomUUID(),
  data: { fullName: 'HTTP Smoke Test Player', dateOfBirth: '2000-06-15', age: 0, mobileNumber: mob, emailAddress: '', city: 'Visakhapatnam', playingRole: 'Bowler', cricketExperience: '', emergencyContact: '9' + rnd().slice(0, 9), consentAgreed: true, amount: 149 },
})
ok(ind.json.ok, `individual registered ${ind.json.registration?.registrationId || ind.json.error}`)
ok(ind.cors === '*' || URL_.includes('script.google'), `CORS header present (${ind.cors})`)
ok(ind.json.registration?.payment.upiId === '79893318524@ybl', `UPI receiver = ${ind.json.registration?.payment.upiId}`)
ok(ind.json.registration?.payment.amount === 149, 'individual amount 149')

const roster = Array.from({ length: 11 }, (_, i) => ({ name: i ? `Smoke Player ${i + 1}` : 'Smoke Captain', mobileNumber: i ? '7' + rnd().slice(0, 9) : capMob, playingRole: 'All-Rounder' }))
const team = await call('registerTeam', {
  requestId: crypto.randomUUID(),
  data: { teamName: `Smoke XI ${rnd()}`, captainName: 'Smoke Captain', captainMobile: capMob, emailAddress: '', city: 'Visakhapatnam', numberOfPlayers: 11, roster, consentAgreed: true, amount: 12000 },
})
ok(team.json.ok, `team registered ${team.json.registration?.registrationId || team.json.error}`)
ok(team.json.registration?.payment.amount === 12000, 'team amount 12000')

const utr = '4' + rnd() + '12'
const pay = await call('submitPayment', { requestId: crypto.randomUUID(), registrationId: ind.json.registration?.registrationId, mobile: mob, utr, amount: 149 })
ok(pay.json.ok && pay.json.registration.paymentStatus === 'Pending Verification', `UTR recorded as ${pay.json.registration?.paymentStatus || pay.json.error}`)

const dup = await call('registerIndividual', { data: { ...JSON.parse('{}'), fullName: 'Dup', dateOfBirth: '2000-01-01', mobileNumber: mob, city: 'X', playingRole: 'Batsman', emergencyContact: '9111111111', consentAgreed: true } })
ok(!dup.json.ok && dup.json.code === 'DUPLICATE', `duplicate blocked (${dup.json.code})`)

const noAuth = await call('adminList', { adminKey: 'nope' })
ok(!noAuth.json.ok, `admin list without key rejected (${noAuth.json.code})`)

const list = await call('adminList', { adminKey: ADMIN })
ok(list.json.ok, 'admin list with key')
const p = list.json.payments?.find((x) => x.utr === utr)
ok(p?.verificationStatus === 'Pending Verification', 'payment record pending')
const ver = await call('adminUpdatePayment', { adminKey: ADMIN, paymentRef: p?.paymentRef, status: 'Verified', notes: 'HTTP smoke test - not a real payment' })
ok(ver.json.ok && ver.json.registrationSynced, 'admin verified + synced registration row')
