import React, { useEffect, useState } from 'react'
import {
  X,
  QrCode,
  Smartphone,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'
import type { BackendPaymentConfig, PaymentInstructions, RegistrationReceipt } from '../../types/registration'
import { UpiService } from '../../services/upiService'
import { RegistrationService } from '../../services/registrationService'
import { getLatestPaymentConfig, newRequestId } from '../../services/apiClient'

type CopyKey = 'upi' | 'amount' | 'ref'

const CopyButton = ({
  value,
  k,
  label,
  copied,
  onCopy,
}: {
  value: string
  k: CopyKey
  label: string
  copied: CopyKey | ''
  onCopy: (value: string, k: CopyKey) => void
}) => (
  <button
    type="button"
    onClick={() => onCopy(value, k)}
    aria-label={label}
    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-white flex items-center gap-1 cursor-pointer transition-colors shrink-0"
  >
    {copied === k ? (
      <>
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-emerald-400">Copied</span>
      </>
    ) : (
      <>
        <Copy className="w-3.5 h-3.5 text-slate-300" />
        <span>Copy</span>
      </>
    )}
  </button>
)

interface PaymentModalProps {
  isOpen: boolean
  receipt: RegistrationReceipt | null
  /** Registered mobile number (needed by the server to accept a UTR for this registration) */
  mobile: string
  /** Authoritative backend payment config from health endpoint / backend */
  paymentConfig?: BackendPaymentConfig | null
  onClose: () => void
  onPaymentSubmitted: (receipt: RegistrationReceipt) => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  receipt,
  mobile,
  paymentConfig,
  onClose,
  onPaymentSubmitted,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [copied, setCopied] = useState<CopyKey | ''>('')
  const [utrNumber, setUtrNumber] = useState('')
  const [utrError, setUtrError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile] = useState(() => UpiService.isMobileDevice())
  // Stable per payment attempt; the parent remounts this modal (via `key`) for a new receipt.
  const [requestId] = useState(() => newRequestId())

  // Ensure displayed UPI ID, QR code, and "Pay" button all use the same latest backend configuration
  const latestConfig = paymentConfig || getLatestPaymentConfig()
  const targetUpiId =
    latestConfig?.upiId ||
    (receipt?.payment.upiId && !TOURNAMENT_CONFIG.payment.staleUpiIds.includes(receipt.payment.upiId)
      ? receipt.payment.upiId
      : TOURNAMENT_CONFIG.payment.upiId)

  const payment: PaymentInstructions = receipt
    ? {
        ...receipt.payment,
        upiId: targetUpiId,
        payeeName: latestConfig?.payeeName || receipt.payment.payeeName || TOURNAMENT_CONFIG.payment.payeeName,
        tournamentName: latestConfig?.tournamentName || receipt.payment.tournamentName || TOURNAMENT_CONFIG.payment.tournamentName,
        currency: latestConfig?.currency || receipt.payment.currency || TOURNAMENT_CONFIG.payment.currency,
      }
    : ({} as PaymentInstructions)

  const paymentUri = receipt ? UpiService.buildPaymentUri(payment) : ''

  useEffect(() => {
    let cancelled = false
    if (paymentUri) {
      UpiService.generateQrCodeDataUrl(paymentUri).then((url) => {
        if (!cancelled) setQrCodeDataUrl(url)
      })
    }
    return () => {
      cancelled = true
    }
  }, [paymentUri])

  if (!isOpen || !receipt) return null

  const isPlayer = receipt.type === 'Individual'
  const wasRejected = receipt.paymentStatus === 'Rejected'

  const copy = (value: string, key: CopyKey) => {
    navigator.clipboard?.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    const check = UpiService.validateUtr(utrNumber)
    if (!check.isValid) {
      setUtrError(check.error || 'Enter the UTR / UPI Ref No.')
      return
    }
    setUtrError('')
    setIsSubmitting(true)
    const result = await RegistrationService.submitPaymentReference(receipt, mobile, utrNumber, requestId)
    setIsSubmitting(false)
    if (result.ok && result.data) {
      onPaymentSubmitted(result.data)
    } else {
      setUtrError(result.fieldErrors?.utr || result.error || 'Could not submit the payment reference. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#090e1c] border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/90 z-10 overflow-hidden my-6 max-h-[94vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0d162d] to-[#0a1020] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 id="payment-modal-title" className="font-heading text-xl font-bold text-white uppercase tracking-wider">
                Complete UPI Payment
              </h3>
              <p className="text-xs text-amber-400 font-mono">Ref: {receipt.registrationId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Server-confirmed save banner */}
          {wasRejected ? (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Your previous payment reference was rejected by the organizers.</span> If you have paid,
                submit the correct UTR / UPI Ref No. below, or contact the helpline.
              </div>
            </div>
          ) : (
            <div id="registration-saved-banner" className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Registration details saved</span> (ID{' '}
                <code className="font-mono bg-black/40 px-1 py-0.5 rounded">{receipt.registrationId}</code>). Your
                payment is <strong>not yet received or verified</strong>. Status: {receipt.paymentStatus}.
              </div>
            </div>
          )}

          {/* Amount + tournament (shown clearly BEFORE payment) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c152e] to-[#080d1c] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {payment.tournamentName}
              </span>
              <h4 className="text-lg font-bold text-white mt-0.5 truncate">{receipt.displayName}</h4>
              <p className="text-xs text-slate-400">
                {isPlayer ? 'Individual Player Registration Fee' : 'Team Entry Fee'}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Amount Payable</span>
              <div id="payment-amount" className="font-heading text-4xl sm:text-5xl font-black text-white">
                <span className="gold-gradient-text">₹{payment.amount.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{payment.currency} • via UPI</span>
            </div>
          </div>

          {/* Pay */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Scan with any UPI App</span>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-lg my-2 inline-block">
                {qrCodeDataUrl ? (
                  <img id="upi-qr-code" src={qrCodeDataUrl} alt={`UPI QR to pay ₹${payment.amount} to ${payment.upiId}`} className="w-44 h-44 object-contain" />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-500 text-xs">Generating QR...</div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">GPay, PhonePe, Paytm, BHIM or bank app</p>
            </div>

            <div className="space-y-3">
              <a
                id="open-upi-app"
                href={paymentUri}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all font-heading"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay ₹{payment.amount.toLocaleString('en-IN')} {isMobile ? 'in UPI App' : '(on phone)'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Pay to UPI ID</span>
                    <span id="payment-upi-id" className="font-mono text-sm font-bold text-amber-300 break-all">{payment.upiId}</span>
                  </div>
                  <CopyButton value={payment.upiId} k="upi" label="Copy UPI ID" copied={copied} onCopy={copy} />
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Exact amount</span>
                    <span className="font-mono font-bold text-white">₹{payment.amount.toFixed(2)}</span>
                  </div>
                  <CopyButton value={String(payment.amount)} k="amount" label="Copy amount" copied={copied} onCopy={copy} />
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment note / reference</span>
                    <span className="font-mono text-slate-200 break-all">{payment.note}</span>
                  </div>
                  <CopyButton value={payment.note} k="ref" label="Copy payment reference" copied={copied} onCopy={copy} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-sky-200 bg-sky-500/5 p-3 rounded-xl border border-sky-500/20">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Opening a UPI app or tapping “Pay” does <strong>not</strong> confirm payment. After paying, enter the UTR below.
              Organizers verify every payment against actual UPI records before confirming your registration. If paying
              manually, add the reference above in the payment note.
            </span>
          </div>

          {/* UTR */}
          <div className="pt-4 border-t border-slate-800">
            <div className="mb-3">
              <h4 className="font-heading text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Submit Payment Reference (UTR)
              </h4>
              <p className="text-xs text-slate-400">
                Find the 12-digit “UPI Ref No.” / “UTR” in your UPI app's transaction details.
              </p>
            </div>

            <form onSubmit={handleSubmitUtr} className="space-y-3" noValidate>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label htmlFor="utr-input" className="sr-only">UTR / UPI Ref No.</label>
                  <input
                    id="utr-input"
                    type="text"
                    autoComplete="off"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value)
                      if (utrError) setUtrError('')
                    }}
                    placeholder="e.g. 412345678901 or T2412AB3456"
                    className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white text-sm font-mono tracking-wider focus:outline-none transition-colors ${
                      utrError ? 'border-red-500 focus:border-red-400' : 'border-amber-500/40 focus:border-amber-400'
                    }`}
                  />
                  {utrError && (
                    <p id="utr-error" role="alert" className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {utrError}
                    </p>
                  )}
                </div>
                <button
                  id="submit-utr"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-heading shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-[#070b16] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>Help: {TOURNAMENT_CONFIG.contacts[0].displayNumber}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white underline cursor-pointer">
            Pay later (keep ID {receipt.registrationId})
          </button>
        </div>
      </div>
    </div>
  )
}
