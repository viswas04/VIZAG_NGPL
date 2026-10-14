import React, { useRef, useState } from 'react'
import { X, UserCheck, AlertCircle, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'
import type { PlayerFormData } from '../../types/registration'
import { RegistrationService } from '../../services/registrationService'
import { newRequestId } from '../../services/apiClient'

export interface FormSubmitOutcome {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

interface PlayerFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (formData: PlayerFormData, requestId: string) => Promise<FormSubmitOutcome>
}

export const PlayerForm: React.FC<PlayerFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<PlayerFormData>({
    fullName: '',
    dateOfBirth: '',
    age: 0,
    mobileNumber: '',
    emailAddress: '',
    city: 'Visakhapatnam',
    playingRole: 'All-Rounder',
    cricketExperience: '',
    emergencyContact: '',
    consentAgreed: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const requestIdRef = useRef<string>(newRequestId())

  if (!isOpen) return null

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value
    const calculatedAge = RegistrationService.calculateAge(dob)
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: dob,
      age: calculatedAge,
    }))
    if (errors.dateOfBirth) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.dateOfBirth
        return next
      })
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    const validation = RegistrationService.validatePlayerForm(formData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setFormError('')
    setIsSubmitting(true)
    // Parent saves to the backend; we only proceed once the server confirms.
    const outcome = await onSuccess(formData, requestIdRef.current)
    setIsSubmitting(false)
    if (outcome.ok) {
      requestIdRef.current = newRequestId()
    } else {
      setFormError(outcome.error || 'Registration could not be saved. Please try again.')
      if (outcome.fieldErrors) setErrors(outcome.fieldErrors)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#090e1c] border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/90 z-10 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0d162d] to-[#0a1020] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wider">
                Individual Player Registration
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                {TOURNAMENT_CONFIG.title} • {TOURNAMENT_CONFIG.edition}
              </p>
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

        {/* Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Fee Notice Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white uppercase">Player Nomination Fee</div>
                <div className="text-[11px] text-amber-300">
                  Individual entry into draft pool & franchise matching
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-heading text-2xl font-black text-amber-400">
                {TOURNAMENT_CONFIG.fees.player.formatted}
              </div>
              <div className="text-[10px] text-slate-400">Fixed Fee</div>
            </div>
          </div>

          <form id="player-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Rohit Sharma"
                className={`w-full px-4 py-3 rounded-xl bg-slate-900/90 border text-white text-sm focus:outline-none transition-colors ${
                  errors.fullName
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-slate-700 focus:border-amber-400'
                }`}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* DOB & Age Calculated */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Date of Birth <span className="text-amber-400">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleDobChange}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900/90 border text-white text-sm focus:outline-none transition-colors ${
                    errors.dateOfBirth
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Calculated Age
                </label>
                <div className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {formData.dateOfBirth
                      ? `${formData.age} Years Old`
                      : 'Select Date of Birth'}
                  </span>
                  {formData.age >= TOURNAMENT_CONFIG.rules.minPlayerAge && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Minimum age: {TOURNAMENT_CONFIG.rules.minPlayerAge} years
                </p>
              </div>
            </div>

            {/* Mobile & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mobile Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-semibold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="mobileNumber"
                    maxLength={10}
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/90 border text-white text-sm focus:outline-none transition-colors ${
                      errors.mobileNumber
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-slate-700 focus:border-amber-400'
                    }`}
                  />
                </div>
                {errors.mobileNumber && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.mobileNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address <span className="text-slate-500 text-[10px]">(Optional)</span>
                </label>
                <input
                  type="email"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  placeholder="player@gmail.com"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900/90 border text-white text-sm focus:outline-none transition-colors ${
                    errors.emailAddress
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />
                {errors.emailAddress && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.emailAddress}
                  </p>
                )}
              </div>
            </div>

            {/* City & Playing Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  City / Location <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Visakhapatnam"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900/90 border text-white text-sm focus:outline-none transition-colors ${
                    errors.city
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.city}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Primary Playing Role <span className="text-amber-400">*</span>
                </label>
                <select
                  name="playingRole"
                  value={formData.playingRole}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                >
                  {TOURNAMENT_CONFIG.playingRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cricket Experience & Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Cricket Experience <span className="text-slate-500 text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="cricketExperience"
                  value={formData.cricketExperience}
                  onChange={handleChange}
                  placeholder="e.g. 4 years club tennis ball, opener"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Emergency Contact Number <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  name="emergencyContact"
                  maxLength={10}
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Parent / Guardian number"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900/90 border text-white text-sm focus:outline-none transition-colors ${
                    errors.emergencyContact
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />
                {errors.emergencyContact && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.emergencyContact}
                  </p>
                )}
              </div>
            </div>

            {/* Required Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="consentAgreed"
                  checked={formData.consentAgreed}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  I agree to abide by all official NGPL Season 1 tournament guidelines, match timing,
                  and umpire rulings. I confirm the details provided are accurate and authorize NGPL to
                  contact me.
                </span>
              </label>
              {errors.consentAgreed && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.consentAgreed}
                </p>
              )}
            </div>

            {formError && (
              <div
                id="player-form-error"
                role="alert"
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-300 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="block text-red-200">Registration not saved</strong>
                  {formError}
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            id="player-form-submit"
            type="submit"
            form="player-form"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-heading shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving registration...</span>
              </>
            ) : (
              <span>Save &amp; Continue to Payment ({TOURNAMENT_CONFIG.fees.player.formatted})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
