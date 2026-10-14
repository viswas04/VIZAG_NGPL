import React, { useMemo, useState } from 'react'
import {
  X,
  Lock,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  LogOut,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'
import type {
  AdminData,
  AdminPaymentRow,
  RegistrationStatus,
} from '../../types/registration'
import { AdminService } from '../../services/adminService'
import { MatchSchedulePanel } from './MatchSchedulePanel'

interface AdminPortalProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'payments' | 'individuals' | 'teams' | 'matches'
const REG_STATUSES: RegistrationStatus[] = ['Pending Payment', 'Under Review', 'Confirmed', 'Payment Rejected', 'Cancelled']

const statusPill = (s: string) =>
  s === 'Verified' || s === 'Confirmed'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : s === 'Pending Verification' || s === 'Under Review'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : s === 'Rejected' || s === 'Payment Rejected' || s === 'Cancelled'
        ? 'bg-red-500/10 text-red-400 border-red-500/30'
        : 'bg-slate-800 text-slate-400 border-slate-700'

const Pill = ({ s }: { s: string }) => (
  <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${statusPill(s)}`}>{s || '—'}</span>
)

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose }) => {
  // Admin key held in memory only for this session — never persisted, never bundled.
  const [adminKey, setAdminKey] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [data, setData] = useState<AdminData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('payments')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const [decision, setDecision] = useState<{ row: AdminPaymentRow; status: 'Verified' | 'Rejected' } | null>(null)
  const [decisionNotes, setDecisionNotes] = useState('')
  const [decisionConfirmed, setDecisionConfirmed] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const load = async (key = adminKey) => {
    setIsLoading(true)
    setLoadError('')
    const res = await AdminService.list(key)
    setIsLoading(false)
    if (res.ok && res.data) setData(res.data)
    else {
      setLoadError(res.error || 'Failed to load registrations.')
      if (res.code === 'UNAUTHORIZED' || res.code === 'LOCKED') setAdminKey('')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyInput.trim()) return
    setAuthLoading(true)
    setAuthError('')
    const res = await AdminService.login(keyInput.trim())
    setAuthLoading(false)
    if (res.ok) {
      const k = keyInput.trim()
      setAdminKey(k)
      setKeyInput('')
      load(k)
    } else {
      setAuthError(res.error || 'Access denied.')
    }
  }

  const logout = () => {
    setAdminKey('')
    setData(null)
    setDecision(null)
  }

  const submitDecision = async () => {
    if (!decision || !decisionConfirmed) return
    setActionBusy(true)
    const res = await AdminService.updatePayment(adminKey, decision.row.paymentRef, decision.status, decisionNotes)
    setActionBusy(false)
    if (res.ok) {
      setActionMsg(`Payment ${decision.row.paymentRef} marked ${decision.status}.`)
      setDecision(null)
      setDecisionNotes('')
      setDecisionConfirmed(false)
      load()
    } else {
      setActionMsg(res.error || 'Update failed.')
    }
  }

  const changeRegStatus = async (registrationId: string, status: RegistrationStatus) => {
    setActionBusy(true)
    const res = await AdminService.updateRegistration(adminKey, registrationId, status)
    setActionBusy(false)
    setActionMsg(res.ok ? `${registrationId} set to ${status}.` : res.error || 'Update failed.')
    if (res.ok) load()
  }

  const q = search.toLowerCase().trim()
  const match = (...vals: (string | number | undefined)[]) => !q || vals.some((v) => String(v ?? '').toLowerCase().includes(q))

  const payments = useMemo(
    () =>
      (data?.payments || [])
        .filter((p) => statusFilter === 'all' || p.verificationStatus === statusFilter)
        .filter((p) => match(p.paymentRef, p.registrationId, p.payerName, p.payerMobile, p.utr))
        .slice()
        .reverse(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, statusFilter, q]
  )
  const individuals = useMemo(
    () =>
      (data?.individuals || [])
        .filter((r) => statusFilter === 'all' || r.paymentStatus === statusFilter)
        .filter((r) => match(r.registrationId, r.fullName, r.mobile, r.city, r.utr))
        .slice()
        .reverse(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, statusFilter, q]
  )
  const teams = useMemo(
    () =>
      (data?.teams || [])
        .filter((r) => statusFilter === 'all' || r.paymentStatus === statusFilter)
        .filter((r) => match(r.registrationId, r.teamName, r.captainName, r.captainMobile, r.utr))
        .slice()
        .reverse(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, statusFilter, q]
  )

  if (!isOpen) return null

  const pendingCount = (data?.payments || []).filter((p) => p.verificationStatus === 'Pending Verification').length
  const verifiedTotal = (data?.payments || [])
    .filter((p) => p.verificationStatus === 'Verified')
    .reduce((s, p) => s + p.expectedAmount, 0)
  const awaitingCount = [...(data?.individuals || []), ...(data?.teams || [])].filter((r) => r.paymentStatus === 'Awaiting Payment').length

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = (tab === 'payments' ? payments : tab === 'individuals' ? individuals : tab === 'teams' ? teams : data?.matches || []) as unknown as Record<string, unknown>[]
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.map(esc).join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `NGPL_${tab}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filterOptions =
    tab === 'payments'
      ? ['Pending Verification', 'Verified', 'Rejected']
      : ['Awaiting Payment', 'Pending Verification', 'Verified', 'Rejected']

  const th = 'py-3 px-3 text-left whitespace-nowrap'
  const td = 'py-2.5 px-3 align-top'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-7xl bg-[#080d1b] border border-amber-500/40 rounded-3xl shadow-2xl shadow-black/90 z-10 overflow-hidden my-4 max-h-[95vh] flex flex-col">
        <div className="px-6 py-4 bg-gradient-to-r from-[#0d162d] to-[#0a1020] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wider">Payment Verification & Admin</h3>
              <p className="text-xs text-amber-400 font-medium">{TOURNAMENT_CONFIG.title} • Private</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {adminKey && (
              <button onClick={logout} className="px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer" aria-label="Close dialog">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!adminKey ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-heading text-2xl font-black text-white uppercase tracking-wide">Organizer Sign-in</h4>
              <p className="text-xs text-slate-400 mt-1">The admin key is verified by the registration server. It is not stored in this browser.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                id="admin-key-input"
                type="password"
                autoComplete="current-password"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value)
                  setAuthError('')
                }}
                placeholder="Admin key"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-mono tracking-widest focus:outline-none focus:border-amber-400"
                autoFocus
              />
              {(authError || loadError) && <p id="admin-auth-error" className="text-xs text-red-400">{authError || loadError}</p>}
              <button
                id="admin-login-submit"
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-heading font-black text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign in
              </button>
            </form>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Metric label="Pending Verification" value={pendingCount} tone="amber" sub="Payments to check" />
              <Metric label="Verified Collections" value={`₹${verifiedTotal.toLocaleString('en-IN')}`} tone="emerald" sub="Admin-verified only" />
              <Metric label="Registrations" value={(data?.individuals.length || 0) + (data?.teams.length || 0)} tone="sky" sub={`${data?.individuals.length || 0} players • ${data?.teams.length || 0} teams`} />
              <Metric
                label="Confirmed Teams"
                value={`${data?.capacity?.confirmedTeams ?? 0}/${data?.capacity?.maxConfirmedTeams ?? 25}`}
                tone={data?.capacity && data.capacity.slotsRemaining === 0 ? 'amber' : 'emerald'}
                sub={`${data?.capacity?.pendingVerificationTeams ?? 0} awaiting verification`}
              />
              <Metric label="Awaiting Payment" value={awaitingCount} tone="slate" sub="No UTR submitted" />
            </div>

            {actionMsg && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center justify-between">
                <span id="admin-action-msg">{actionMsg}</span>
                <button onClick={() => setActionMsg('')} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            )}
            {loadError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {loadError}
              </div>
            )}

            {/* Tabs + controls */}
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
              <div className="flex gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
                {(
                  [
                    ['payments', `Payment Records (${data?.payments.length || 0})`],
                    ['individuals', `Individuals (${data?.individuals.length || 0})`],
                    ['teams', `Teams (${data?.teams.length || 0})`],
                    ['matches', `Match Schedule (${(data?.matches || []).filter((m) => m.status !== 'Cancelled').length})`],
                  ] as [Tab, string][]
                ).map(([k, label]) => (
                  <button
                    key={k}
                    id={`admin-tab-${k}`}
                    onClick={() => {
                      setTab(k)
                      setStatusFilter('all')
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                      tab === k ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ID, name, mobile, UTR"
                    className="pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 w-60"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All payment statuses</option>
                  {filterOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <button onClick={() => load()} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={exportCsv} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold uppercase border border-amber-500/30 flex items-center gap-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            {/* Verify / reject confirmation */}
            {decision && (
              <div id="admin-decision-panel" className={`p-5 rounded-2xl border space-y-3 ${decision.status === 'Verified' ? 'bg-emerald-500/5 border-emerald-500/40' : 'bg-red-500/5 border-red-500/40'}`}>
                <h4 className="font-heading text-base font-bold text-white uppercase tracking-wider">
                  Mark {decision.row.paymentRef} as {decision.status}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <Info label="UTR" value={decision.row.utr} mono />
                  <Info label="Expected amount" value={`₹${decision.row.expectedAmount.toLocaleString('en-IN')}`} />
                  <Info label="Receiver" value={decision.row.upiReceiver} mono />
                  <Info label="Payer" value={`${decision.row.payerName} (${decision.row.payerMobile})`} />
                </div>
                <label className="flex items-start gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    id="admin-decision-confirm"
                    type="checkbox"
                    checked={decisionConfirmed}
                    onChange={(e) => setDecisionConfirmed(e.target.checked)}
                    className="mt-0.5"
                  />
                  {decision.status === 'Verified'
                    ? `I checked the actual UPI/bank statement for ${decision.row.upiReceiver} and found UTR ${decision.row.utr} for exactly ₹${decision.row.expectedAmount}.`
                    : `I checked the actual UPI/bank records and could not match this payment.`}
                </label>
                <textarea
                  id="admin-decision-notes"
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Admin notes (e.g. matched in PhonePe statement 14 Oct, 2:41 PM)"
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setDecision(null)} className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer">Cancel</button>
                  <button
                    id="admin-decision-submit"
                    onClick={submitDecision}
                    disabled={!decisionConfirmed || actionBusy}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                      decision.status === 'Verified' ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                    }`}
                  >
                    {actionBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirm {decision.status}
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
              <div className="overflow-x-auto">
                {tab === 'payments' && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className={th}>Payment Ref</th><th className={th}>Registration</th><th className={th}>Payer</th>
                        <th className={th}>Amount</th><th className={th}>UPI Receiver</th><th className={th}>UTR</th>
                        <th className={th}>Submitted</th><th className={th}>Status</th><th className={th}>Decided / Notes</th><th className={`${th} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {payments.length === 0 ? (
                        <tr><td colSpan={10} className="py-8 text-center text-slate-500">{isLoading ? 'Loading…' : 'No payment records.'}</td></tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.paymentRef} className="hover:bg-slate-900/50">
                            <td className={`${td} font-mono text-amber-300 font-bold whitespace-nowrap`}>{p.paymentRef}</td>
                            <td className={td}><div className="font-mono whitespace-nowrap">{p.registrationId}</div><div className="text-[10px] text-slate-500">{p.registrationType}</div></td>
                            <td className={td}><div className="text-white font-semibold">{p.payerName}</div><div className="font-mono text-[10px] text-slate-400">{p.payerMobile}</div></td>
                            <td className={`${td} font-mono font-bold text-white whitespace-nowrap`}>₹{p.expectedAmount.toLocaleString('en-IN')}</td>
                            <td className={`${td} font-mono text-[10px]`}>{p.upiReceiver}</td>
                            <td className={`${td} font-mono text-sky-400 font-bold`}>{p.utr}</td>
                            <td className={`${td} text-[10px] whitespace-nowrap`}>{p.submittedAt}</td>
                            <td className={td}><Pill s={p.verificationStatus} /></td>
                            <td className={`${td} text-[10px] max-w-[180px]`}><div className="whitespace-nowrap">{p.decidedAt}</div><div className="text-slate-400 break-words">{p.adminNotes}</div></td>
                            <td className={`${td} text-right whitespace-nowrap`}>
                              {p.verificationStatus === 'Pending Verification' ? (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    id={`verify-${p.paymentRef}`}
                                    onClick={() => { setDecision({ row: p, status: 'Verified' }); setDecisionConfirmed(false); setDecisionNotes('') }}
                                    className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                                  </button>
                                  <button
                                    id={`reject-${p.paymentRef}`}
                                    onClick={() => { setDecision({ row: p, status: 'Rejected' }); setDecisionConfirmed(false); setDecisionNotes('') }}
                                    className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setDecision({ row: p, status: p.verificationStatus === 'Verified' ? 'Rejected' : 'Verified' }); setDecisionConfirmed(false); setDecisionNotes(p.adminNotes) }}
                                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                                >
                                  Change
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {tab === 'individuals' && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className={th}>Registration ID</th><th className={th}>Submitted</th><th className={th}>Player</th><th className={th}>DOB / Age</th>
                        <th className={th}>Mobile / Email</th><th className={th}>City / Role</th><th className={th}>Experience</th><th className={th}>Emergency</th>
                        <th className={th}>Fee</th><th className={th}>UTR</th><th className={th}>Payment</th><th className={th}>Registration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {individuals.length === 0 ? (
                        <tr><td colSpan={12} className="py-8 text-center text-slate-500">No individual registrations.</td></tr>
                      ) : (
                        individuals.map((r) => (
                          <tr key={r.registrationId} className="hover:bg-slate-900/50">
                            <td className={`${td} font-mono text-amber-300 font-bold whitespace-nowrap`}>{r.registrationId}</td>
                            <td className={`${td} text-[10px] whitespace-nowrap`}>{r.submittedAt}</td>
                            <td className={`${td} text-white font-semibold`}>{r.fullName}</td>
                            <td className={`${td} whitespace-nowrap`}>{r.dateOfBirth} ({r.age})</td>
                            <td className={td}><div className="font-mono">{r.mobile}</div><div className="text-[10px] text-slate-400">{r.email}</div></td>
                            <td className={td}><div>{r.city}</div><div className="text-[10px] text-slate-400">{r.playingRole}</div></td>
                            <td className={`${td} text-[10px] max-w-[160px] break-words`}>{r.experience}</td>
                            <td className={`${td} font-mono`}>{r.emergencyContact}</td>
                            <td className={`${td} font-mono`}>₹{r.fee}</td>
                            <td className={`${td} font-mono text-sky-400`}>{r.utr}</td>
                            <td className={td}><Pill s={r.paymentStatus} /></td>
                            <td className={td}><RegStatusSelect value={r.registrationStatus} disabled={actionBusy} onChange={(s) => changeRegStatus(r.registrationId, s)} /></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {tab === 'teams' && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className={th}>Team Reg ID</th><th className={th}>Submitted</th><th className={th}>Team</th><th className={th}>Captain</th>
                        <th className={th}>City</th><th className={th}>Squad</th><th className={th}>Fee</th><th className={th}>UTR</th>
                        <th className={th}>Payment</th><th className={th}>Registration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {teams.length === 0 ? (
                        <tr><td colSpan={10} className="py-8 text-center text-slate-500">No team registrations.</td></tr>
                      ) : (
                        teams.map((r) => (
                          <React.Fragment key={r.registrationId}>
                            <tr className="hover:bg-slate-900/50">
                              <td className={`${td} font-mono text-amber-300 font-bold whitespace-nowrap`}>{r.registrationId}</td>
                              <td className={`${td} text-[10px] whitespace-nowrap`}>{r.submittedAt}</td>
                              <td className={`${td} text-white font-semibold`}>{r.teamName}</td>
                              <td className={td}><div>{r.captainName}</div><div className="font-mono text-[10px] text-slate-400">{r.captainMobile}</div><div className="text-[10px] text-slate-500">{r.captainEmail}</div></td>
                              <td className={td}>{r.city}</td>
                              <td className={td}>
                                <button onClick={() => setExpanded(expanded === r.registrationId ? null : r.registrationId)} className="flex items-center gap-1 text-amber-300 hover:text-amber-200 cursor-pointer">
                                  {r.squadSize} players {expanded === r.registrationId ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </td>
                              <td className={`${td} font-mono`}>₹{r.fee.toLocaleString('en-IN')}</td>
                              <td className={`${td} font-mono text-sky-400`}>{r.utr}</td>
                              <td className={td}><Pill s={r.paymentStatus} /></td>
                              <td className={td}><RegStatusSelect value={r.registrationStatus} disabled={actionBusy} onChange={(s) => changeRegStatus(r.registrationId, s)} /></td>
                            </tr>
                            {expanded === r.registrationId && (
                              <tr className="bg-slate-950">
                                <td colSpan={10} className="px-4 py-3">
                                  <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-mono">{r.roster}</pre>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {tab === 'matches' && data && (
                  <MatchSchedulePanel
                    adminKey={adminKey}
                    matches={data.matches || []}
                    teams={data.teams}
                    maxMatchesPerDay={data.capacity?.maxMatchesPerDay ?? 4}
                    onChanged={(msg) => {
                      setActionMsg(msg)
                      load()
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const Metric = ({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub: string; tone: 'amber' | 'emerald' | 'sky' | 'slate' }) => {
  const tones = {
    amber: 'border-amber-500/30 text-amber-400',
    emerald: 'border-emerald-500/30 text-emerald-400',
    sky: 'border-sky-500/30 text-sky-400',
    slate: 'border-slate-700 text-slate-300',
  }[tone]
  return (
    <div className={`p-4 rounded-2xl bg-slate-900/90 border ${tones}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <div className="font-heading text-2xl font-black mt-1">{value}</div>
      <span className="text-[10px] text-slate-400">{sub}</span>
    </div>
  )
}

const Info = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
    <div className="text-[10px] uppercase text-slate-500 font-bold">{label}</div>
    <div className={`text-white break-all ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
)

const RegStatusSelect = ({ value, onChange, disabled }: { value: RegistrationStatus; onChange: (s: RegistrationStatus) => void; disabled?: boolean }) => (
  <select
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value as RegistrationStatus)}
    className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase bg-slate-950 focus:outline-none ${statusPill(value)}`}
  >
    {REG_STATUSES.map((s) => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
  </select>
)
