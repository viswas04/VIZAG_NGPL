import React, { useMemo, useState } from 'react'
import { CalendarPlus, Loader2, AlertCircle } from 'lucide-react'
import type { AdminMatchRow, AdminTeamRow, MatchStatus } from '../../types/registration'
import { AdminService } from '../../services/adminService'

interface Props {
  adminKey: string
  matches: AdminMatchRow[]
  teams: AdminTeamRow[]
  maxMatchesPerDay: number
  onChanged: (message: string) => void
}

const pill = (s: string) =>
  s === 'Scheduled'
    ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
    : s === 'Completed'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : 'bg-red-500/10 text-red-400 border-red-500/30'

/**
 * Admin match scheduling. The per-day limit, confirmed-team requirement and
 * clash checks are enforced by the backend; the counts shown here are a guide.
 */
export const MatchSchedulePanel: React.FC<Props> = ({ adminKey, matches, teams, maxMatchesPerDay, onChanged }) => {
  const [form, setForm] = useState({ date: '', time: '', teamAId: '', teamBId: '', venue: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const confirmedTeams = useMemo(() => teams.filter((t) => t.registrationStatus === 'Confirmed'), [teams])
  const perDay = useMemo(() => {
    const m = new Map<string, number>()
    matches.filter((x) => x.status !== 'Cancelled').forEach((x) => m.set(x.date, (m.get(x.date) || 0) + 1))
    return m
  }, [matches])
  const sorted = useMemo(() => matches.slice().sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)), [matches])
  const dayCount = form.date ? perDay.get(form.date) || 0 : 0
  const dayFull = dayCount >= maxMatchesPerDay

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setFieldErrors((fe) => {
      const n = { ...fe }
      delete n[k]
      return n
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await AdminService.scheduleMatch(adminKey, form)
    setBusy(false)
    if (res.ok && res.data) {
      onChanged(`Match ${res.data.match.matchId} scheduled (${res.data.matchesOnDate}/${res.data.maxMatchesPerDay} on ${res.data.match.date}).`)
      setForm((f) => ({ ...f, time: '', teamAId: '', teamBId: '', notes: '' }))
    } else {
      setError(res.error || 'Could not schedule the match.')
      setFieldErrors(res.fieldErrors || {})
    }
  }

  const update = async (m: AdminMatchRow, status: MatchStatus) => {
    setBusy(true)
    const res = await AdminService.updateMatch(adminKey, m.matchId, status)
    setBusy(false)
    if (res.ok) onChanged(`${m.matchId} set to ${status}.`)
    else setError(res.error || 'Update failed.')
  }

  const input = 'w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400'
  const label = 'text-[10px] font-bold uppercase tracking-wider text-slate-400'
  const fe = (k: string) => fieldErrors[k] && <p className="text-[10px] text-red-400 mt-0.5">{fieldErrors[k]}</p>
  const th = 'py-3 px-3 text-left whitespace-nowrap'
  const td = 'py-2.5 px-3 align-top'

  return (
    <div className="space-y-4 p-4">
      <form id="schedule-match-form" onSubmit={submit} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-amber-400" /> Schedule a match
          </h4>
          <span className="text-[10px] text-slate-400">
            Confirmed teams only • max {maxMatchesPerDay} matches per day (enforced by server)
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className={label} htmlFor="match-date">Date</label>
            <input id="match-date" type="date" required value={form.date} onChange={set('date')} className={input} />
            {form.date && (
              <p className={`text-[10px] mt-0.5 ${dayFull ? 'text-red-400' : 'text-slate-400'}`}>
                {dayCount}/{maxMatchesPerDay} scheduled{dayFull ? ' — day full' : ''}
              </p>
            )}
            {fe('date')}
          </div>
          <div>
            <label className={label} htmlFor="match-time">Start time</label>
            <input id="match-time" type="time" required value={form.time} onChange={set('time')} className={input} />
            {fe('time')}
          </div>
          <div>
            <label className={label} htmlFor="match-team-a">Team A</label>
            <select id="match-team-a" required value={form.teamAId} onChange={set('teamAId')} className={input}>
              <option value="">Select…</option>
              {confirmedTeams.map((t) => <option key={t.registrationId} value={t.registrationId}>{t.teamName}</option>)}
            </select>
            {fe('teamAId')}
          </div>
          <div>
            <label className={label} htmlFor="match-team-b">Team B</label>
            <select id="match-team-b" required value={form.teamBId} onChange={set('teamBId')} className={input}>
              <option value="">Select…</option>
              {confirmedTeams.filter((t) => t.registrationId !== form.teamAId).map((t) => (
                <option key={t.registrationId} value={t.registrationId}>{t.teamName}</option>
              ))}
            </select>
            {fe('teamBId')}
          </div>
          <div>
            <label className={label} htmlFor="match-venue">Venue</label>
            <input id="match-venue" value={form.venue} onChange={set('venue')} maxLength={80} placeholder="Main ground" className={input} />
          </div>
          <div className="flex items-end">
            <button
              id="schedule-match-submit"
              type="submit"
              disabled={busy || dayFull || confirmedTeams.length < 2}
              className="w-full py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Schedule
            </button>
          </div>
        </div>
        {confirmedTeams.length < 2 && <p className="text-[11px] text-slate-400">At least two Confirmed teams are needed to schedule a match.</p>}
        {error && (
          <p id="schedule-match-error" className="text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className={th}>Match ID</th><th className={th}>Date / Time</th><th className={th}>Team A</th><th className={th}>Team B</th>
              <th className={th}>Venue</th><th className={th}>Status</th><th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {sorted.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-500">No matches scheduled.</td></tr>
            ) : (
              sorted.map((m) => (
                <tr key={m.matchId} className="hover:bg-slate-900/50">
                  <td className={`${td} font-mono text-amber-300 font-bold whitespace-nowrap`}>{m.matchId}</td>
                  <td className={`${td} whitespace-nowrap`}>{m.date} • {m.time}</td>
                  <td className={`${td} text-white`}>{m.teamAName}</td>
                  <td className={`${td} text-white`}>{m.teamBName}</td>
                  <td className={td}>{m.venue}</td>
                  <td className={td}>
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${pill(m.status)}`}>{m.status}</span>
                  </td>
                  <td className={`${td} text-right whitespace-nowrap space-x-2`}>
                    {m.status === 'Scheduled' && (
                      <>
                        <button disabled={busy} onClick={() => update(m, 'Completed')} className="text-[10px] text-emerald-300 hover:text-emerald-200 underline cursor-pointer">Complete</button>
                        <button disabled={busy} onClick={() => update(m, 'Cancelled')} className="text-[10px] text-red-300 hover:text-red-200 underline cursor-pointer">Cancel</button>
                      </>
                    )}
                    {m.status === 'Cancelled' && (
                      <button disabled={busy} onClick={() => update(m, 'Scheduled')} className="text-[10px] text-slate-300 hover:text-white underline cursor-pointer">Restore</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
