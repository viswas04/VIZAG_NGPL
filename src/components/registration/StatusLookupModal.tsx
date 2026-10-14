import React, { useState } from 'react'
import { X, Search, AlertCircle, Loader2 } from 'lucide-react'
import type { RegistrationReceipt } from '../../types/registration'
import { RegistrationService } from '../../services/registrationService'

interface StatusLookupModalProps {
  isOpen: boolean
  onClose: () => void
  onFound: (receipt: RegistrationReceipt, mobile: string) => void
}

/** Lets a registrant check status / complete payment using Registration ID + registered mobile. */
export const StatusLookupModal: React.FC<StatusLookupModalProps> = ({ isOpen, onClose, onFound }) => {
  const [registrationId, setRegistrationId] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!registrationId.trim() || !RegistrationService.isValidIndianMobile(mobile)) {
      setError('Enter your Registration ID and the 10-digit mobile number used during registration.')
      return
    }
    setError('')
    setLoading(true)
    const res = await RegistrationService.lookupRegistration(registrationId, mobile)
    setLoading(false)
    if (res.ok && res.data) onFound(res.data, mobile)
    else setError(res.error || 'Registration not found.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="lookup-title">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md bg-[#090e1c] border border-amber-500/30 rounded-3xl shadow-2xl z-10 p-6 space-y-4 animate-fade-in"
      >
        <div className="flex items-center justify-between">
          <h3 id="lookup-title" className="font-heading text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            Check Registration
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-400">View your status or complete a pending payment.</p>

        <div className="space-y-1">
          <label htmlFor="lookup-reg-id" className="text-xs font-semibold text-slate-300">Registration ID</label>
          <input
            id="lookup-reg-id"
            value={registrationId}
            onChange={(e) => setRegistrationId(e.target.value)}
            placeholder="NGPL-S1-IND-XXXXXX"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono uppercase focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="lookup-mobile" className="text-xs font-semibold text-slate-300">Registered mobile number</label>
          <input
            id="lookup-mobile"
            type="tel"
            inputMode="numeric"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="10-digit mobile"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        {error && (
          <p id="lookup-error" role="alert" className="text-xs text-red-400 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {error}
          </p>
        )}

        <button
          id="lookup-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-heading font-black text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </form>
    </div>
  )
}
