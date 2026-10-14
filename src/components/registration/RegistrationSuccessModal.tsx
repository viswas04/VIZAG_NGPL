import React from 'react'
import { X, CheckCircle2, Clock, Download, Share2, ShieldCheck, XCircle, Wallet } from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'
import type { RegistrationReceipt } from '../../types/registration'

interface RegistrationSuccessModalProps {
  isOpen: boolean
  record: RegistrationReceipt | null
  onClose: () => void
  /** Opens the payment screen (for Awaiting Payment / Rejected registrations) */
  onPayNow?: () => void
}

const STATUS_COPY: Record<RegistrationReceipt['paymentStatus'], { title: string; body: string }> = {
  'Awaiting Payment': {
    title: 'Registration Saved — Payment Pending',
    body: 'Your details are saved, but no payment reference has been submitted yet. Your slot is not confirmed until payment is verified.',
  },
  'Pending Verification': {
    title: 'Payment Reference Submitted — Pending Verification',
    body: 'Your UTR has been recorded. This does not yet confirm payment: the organizers will match it against actual UPI records before confirming your registration.',
  },
  Verified: {
    title: 'Payment Verified — Registration Confirmed',
    body: 'The organizers have verified your payment against UPI records. See you on the field!',
  },
  Rejected: {
    title: 'Payment Reference Rejected',
    body: 'The organizers could not match your payment reference. If you have paid, submit the correct UTR or contact the helpline.',
  },
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({ isOpen, record, onClose, onPayNow }) => {
  if (!isOpen || !record) return null

  const isPlayer = record.type === 'Individual'
  const status = record.paymentStatus
  const copy = STATUS_COPY[status] || STATUS_COPY['Awaiting Payment']
  const canPay = status === 'Awaiting Payment' || status === 'Rejected'

  const shareText = `I have registered for ${TOURNAMENT_CONFIG.title} (${TOURNAMENT_CONFIG.edition}) in Visakhapatnam! Registration ID: ${record.registrationId}`
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  const badgeClass =
    status === 'Verified'
      ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
      : status === 'Rejected'
        ? 'bg-red-500/10 border-red-400/30 text-red-300'
        : 'bg-amber-400/10 border-amber-400/30 text-amber-300'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#090e1c] border border-amber-500/40 rounded-3xl shadow-2xl shadow-black/90 z-10 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-fade-in">
        <div className="px-6 py-6 bg-gradient-to-b from-[#0d1836] to-[#090e1c] text-center border-b border-amber-500/20 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
            {status === 'Verified' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : status === 'Rejected' ? (
              <XCircle className="w-8 h-8 text-red-400" />
            ) : (
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            )}
          </div>

          <div id="status-badge" className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-2 ${badgeClass}`}>
            Payment: {status}
          </div>

          <h3 id="status-modal-title" className="font-heading text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
            {copy.title}
          </h3>
          <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">{copy.body}</p>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c1630] to-[#070b16] border border-amber-500/20 space-y-3 text-xs">
            <Row label="Registration ID" value={<span id="status-registration-id" className="font-mono font-bold text-amber-400 text-sm tracking-wider">{record.registrationId}</span>} />
            <Row label="Entry Type" value={<span className="font-bold text-white uppercase">{isPlayer ? 'Individual Player' : 'Team Entry'}</span>} />
            <Row label={isPlayer ? 'Player Name' : 'Team Name'} value={<span className="font-bold text-white">{record.displayName}</span>} />
            <Row label="Registered Mobile" value={<span className="font-mono text-slate-200">••••••{record.mobileLast4}</span>} />
            <Row label="Fee" value={<span className="text-sm font-black text-amber-400 font-heading">₹{record.amount.toLocaleString('en-IN')}</span>} />
            <Row label="Payment Status" value={<span className="font-semibold text-white">{record.paymentStatus}</span>} />
            <Row label="Registration Status" value={<span className="font-semibold text-white">{record.registrationStatus}</span>} />
            {record.utr && <Row label="Submitted UTR" value={<span className="font-mono font-bold text-sky-400">{record.utr}</span>} />}
            {record.paymentRef && <Row label="Payment Ref" value={<span className="font-mono text-slate-200">{record.paymentRef}</span>} />}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Keep your Registration ID</span>
            </div>
            <p className="leading-relaxed">
              Use “Check Registration / Pay” in the footer with your Registration ID and mobile number to see status updates
              or complete payment later.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white uppercase">Questions?</div>
              <div className="text-[11px] text-slate-400">
                Call: {TOURNAMENT_CONFIG.contacts[0].displayNumber} / {TOURNAMENT_CONFIG.contacts[1].displayNumber}
              </div>
            </div>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </a>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#070b16] border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          {canPay && onPayNow ? (
            <button
              id="status-pay-now"
              onClick={onPayNow}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider font-heading transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Wallet className="w-4 h-4" />
              {status === 'Rejected' ? 'Resubmit Payment' : 'Pay Now'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider font-heading transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center gap-3">
    <span className="text-slate-400">{label}</span>
    <span className="text-right">{value}</span>
  </div>
)
