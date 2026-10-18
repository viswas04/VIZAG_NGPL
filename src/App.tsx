import { useEffect, useState } from 'react'
import { Navbar } from './components/layout/Navbar'
import { HeroSection } from './components/home/HeroSection'
import { PrizeHighlights } from './components/home/PrizeHighlights'
import { IndividualAwards } from './components/home/IndividualAwards'
import { FacilitiesSection } from './components/home/FacilitiesSection'
import { RegistrationCards } from './components/home/RegistrationCards'
import { ContactLocation } from './components/home/ContactLocation'
import { FinalCta } from './components/home/FinalCta'
import { Footer } from './components/layout/Footer'
import { PlayerForm, type FormSubmitOutcome } from './components/registration/PlayerForm'
import { TeamForm } from './components/registration/TeamForm'
import { PaymentModal } from './components/registration/PaymentModal'
import { RegistrationSuccessModal } from './components/registration/RegistrationSuccessModal'
import { StatusLookupModal } from './components/registration/StatusLookupModal'
import { AdminPortal } from './components/admin/AdminPortal'
import type { PlayerFormData, TeamFormData, RegistrationReceipt, ApiResult } from './types/registration'
import { RegistrationService } from './services/registrationService'
import { checkBackendHealth, type HealthCheck } from './services/apiClient'
import { MessageCircle, Shield, AlertCircle } from 'lucide-react'
import { TOURNAMENT_CONFIG } from './config/tournamentConfig'

const ADMIN_HASH = '#admin'

export function App() {
  const [playerModalOpen, setPlayerModalOpen] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [lookupModalOpen, setLookupModalOpen] = useState(false)
  const [adminModalOpen, setAdminModalOpen] = useState(
    typeof window !== 'undefined' && window.location.hash === ADMIN_HASH
  )

  const [activeReceipt, setActiveReceipt] = useState<RegistrationReceipt | null>(null)
  const [activeMobile, setActiveMobile] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Admin portal is reachable only via the private URL hash, not from public navigation.
  useEffect(() => {
    const onHash = () => setAdminModalOpen(window.location.hash === ADMIN_HASH)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Verify the backend + Google Sheet configuration on load (no secrets returned).
  const [health, setHealth] = useState<HealthCheck | null>(null)
  useEffect(() => {
    let cancelled = false
    checkBackendHealth().then((h) => {
      if (cancelled) return
      setHealth(h)
      if (h.state !== 'ready') console.error('[NGPL] Registration backend problem:', h.problems.join(' | '))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const closeAdmin = () => {
    setAdminModalOpen(false)
    if (window.location.hash === ADMIN_HASH) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4500)
  }

  /** Opens payment only after the backend has confirmed the registration was saved. */
  const afterRegistration = (
    result: ApiResult<RegistrationReceipt>,
    mobile: string,
    closeForm: () => void
  ): FormSubmitOutcome => {
    if (!result.ok || !result.data) {
      return { ok: false, error: result.error, fieldErrors: result.fieldErrors }
    }
    closeForm()
    setActiveReceipt(result.data)
    setActiveMobile(mobile)
    setPaymentModalOpen(true)
    showToast(`Registration saved: ${result.data.registrationId}. Payment pending.`)
    return { ok: true }
  }

  const handlePlayerFormSuccess = async (formData: PlayerFormData, requestId: string) => {
    const result = await RegistrationService.registerPlayer(formData, requestId)
    return afterRegistration(result, formData.mobileNumber, () => setPlayerModalOpen(false))
  }

  const handleTeamFormSuccess = async (formData: TeamFormData, requestId: string) => {
    const result = await RegistrationService.registerTeam(formData, requestId)
    return afterRegistration(result, formData.captainMobile, () => setTeamModalOpen(false))
  }

  // UTR recorded by backend -> status is Pending Verification (never "paid")
  const handlePaymentSubmitted = (receipt: RegistrationReceipt) => {
    setPaymentModalOpen(false)
    setActiveReceipt(receipt)
    setSuccessModalOpen(true)
    showToast('Payment reference recorded. Status: Pending Verification.')
  }

  const handleLookupFound = (receipt: RegistrationReceipt, mobile: string) => {
    setLookupModalOpen(false)
    setActiveReceipt(receipt)
    setActiveMobile(mobile)
    setSuccessModalOpen(true)
  }

  const backendProblem = health !== null && health.state !== 'ready'
  const teamCapacity = health && 'health' in health ? health.health.capacity : null
  const backendPaymentConfig = health && 'health' in health ? health.health.payment : null

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {backendProblem && (
        <div
          id="backend-not-configured-banner"
          role="alert"
          className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-center text-xs text-red-300 font-medium relative z-50"
        >
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>
              <strong>Online registration is temporarily unavailable.</strong> Submissions cannot be saved until the
              registration server is configured. Please contact {TOURNAMENT_CONFIG.contacts[0].displayNumber}.
            </span>
          </div>
          {import.meta.env.DEV && (
            <ul id="backend-config-problems" className="mt-1 text-[11px] text-red-200/90 list-disc list-inside text-left max-w-3xl mx-auto">
              {health.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Navigation */}
      <Navbar
        onOpenPlayerModal={() => setPlayerModalOpen(true)}
        onOpenTeamModal={() => setTeamModalOpen(true)}
        onOpenLookupModal={() => setLookupModalOpen(true)}
      />

      {/* Main Content Homepage Sections */}
      <main className="flex-1">
        {/* B. Hero */}
        <HeroSection
          onOpenPlayerModal={() => setPlayerModalOpen(true)}
          onOpenTeamModal={() => setTeamModalOpen(true)}
        />

        {/* C. Tournament Highlights & Prizes */}
        <PrizeHighlights onOpenTeamModal={() => setTeamModalOpen(true)} />

        {/* D. Individual Awards */}
        <IndividualAwards />

        {/* E. Tournament Facilities */}
        <FacilitiesSection />

        {/* F. Registration Options */}
        <RegistrationCards
          onOpenPlayerModal={() => setPlayerModalOpen(true)}
          onOpenTeamModal={() => setTeamModalOpen(true)}
        />

        {/* G. Contact and Location */}
        <ContactLocation />

        {/* H. Final CTA */}
        <FinalCta
          onOpenPlayerModal={() => setPlayerModalOpen(true)}
          onOpenTeamModal={() => setTeamModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenPlayerModal={() => setPlayerModalOpen(true)}
        onOpenTeamModal={() => setTeamModalOpen(true)}
        onOpenLookupModal={() => setLookupModalOpen(true)}
      />

      {/* Floating Quick WhatsApp Button */}
      <a
        href={TOURNAMENT_CONFIG.primaryWhatsApp.url}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-2xl shadow-emerald-500/40 hover:scale-110 transition-transform flex items-center justify-center group"
        aria-label="Chat with tournament organizer on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 text-slate-950 fill-current" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out px-0 group-hover:px-2 text-xs font-bold text-slate-950 uppercase tracking-wider font-heading">
          Chat With Us
        </span>
      </a>

      {/* Player Registration Modal Form */}
      <PlayerForm
        isOpen={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        onSuccess={handlePlayerFormSuccess}
      />

      {/* Team Registration Modal Form */}
      <TeamForm
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        onSuccess={handleTeamFormSuccess}
        capacity={teamCapacity}
      />

      {/* UPI Payment Modal (amount + receiver issued by backend) */}
      <PaymentModal
        key={activeReceipt ? `${activeReceipt.registrationId}:${activeReceipt.paymentStatus}` : 'none'}
        isOpen={paymentModalOpen}
        receipt={activeReceipt}
        mobile={activeMobile}
        paymentConfig={backendPaymentConfig}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSubmitted={handlePaymentSubmitted}
      />

      {/* Registration / Payment Status Modal */}
      <RegistrationSuccessModal
        isOpen={successModalOpen}
        record={activeReceipt}
        onClose={() => setSuccessModalOpen(false)}
        onPayNow={() => {
          setSuccessModalOpen(false)
          setPaymentModalOpen(true)
        }}
      />

      <StatusLookupModal
        isOpen={lookupModalOpen}
        onClose={() => setLookupModalOpen(false)}
        onFound={handleLookupFound}
      />

      {/* Organizer Admin Portal (private: open via /#admin) */}
      <AdminPortal isOpen={adminModalOpen} onClose={closeAdmin} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-2xl shadow-black/80 animate-fade-in flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default App
