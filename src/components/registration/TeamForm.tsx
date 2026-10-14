import React, { useRef, useState } from 'react'
import { X, Users, AlertCircle, Plus, Trash2, Sparkles, UserCheck, Loader2 } from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'
import type { TeamFormData, TeamRosterPlayer, PlayingRole, TeamCapacity } from '../../types/registration'
import { RegistrationService } from '../../services/registrationService'
import { newRequestId } from '../../services/apiClient'
import type { FormSubmitOutcome } from './PlayerForm'

interface TeamFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (formData: TeamFormData, requestId: string) => Promise<FormSubmitOutcome>
  /** Live slot info from the backend health check (display only; enforced server-side). */
  capacity?: TeamCapacity | null
}

export const TeamForm: React.FC<TeamFormProps> = ({ isOpen, onClose, onSuccess, capacity }) => {
  const minSize = TOURNAMENT_CONFIG.rules.minSquadSize
  const maxSize = TOURNAMENT_CONFIG.rules.maxSquadSize
  const defaultSize = TOURNAMENT_CONFIG.rules.defaultSquadSize

  // Generate initial roster
  const initialRoster: TeamRosterPlayer[] = Array.from({ length: defaultSize }).map((_, index) => ({
    id: `p-${index + 1}`,
    name: index === 0 ? '' : '',
    mobileNumber: '',
    playingRole: index === 0 ? 'All-Rounder' : (index % 2 === 0 ? 'Batsman' : 'Bowler'),
  }))

  const [formData, setFormData] = useState<TeamFormData>({
    teamName: '',
    captainName: '',
    captainMobile: '',
    emailAddress: '',
    city: 'Visakhapatnam',
    numberOfPlayers: defaultSize,
    roster: initialRoster,
    consentAgreed: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const requestIdRef = useRef<string>(newRequestId())

  if (!isOpen) return null

  const handleSquadSizeChange = (newSize: number) => {
    if (newSize < minSize || newSize > maxSize) return

    setFormData((prev) => {
      let updatedRoster = [...prev.roster]
      if (newSize > updatedRoster.length) {
        // Add slots
        const addedSlots: TeamRosterPlayer[] = Array.from({
          length: newSize - updatedRoster.length,
        }).map((_, i) => ({
          id: `p-${updatedRoster.length + i + 1}`,
          name: '',
          mobileNumber: '',
          playingRole: 'All-Rounder',
        }))
        updatedRoster = [...updatedRoster, ...addedSlots]
      } else if (newSize < updatedRoster.length) {
        // Truncate to new size
        updatedRoster = updatedRoster.slice(0, newSize)
      }

      return {
        ...prev,
        numberOfPlayers: newSize,
        roster: updatedRoster,
      }
    })
  }

  const handleCaptainChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }
      // Sync Captain to Roster Player 1
      if (name === 'captainName' && updated.roster.length > 0) {
        updated.roster[0].name = value
      }
      if (name === 'captainMobile' && updated.roster.length > 0) {
        updated.roster[0].mobileNumber = value
      }
      return updated
    })

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleRosterPlayerChange = (
    index: number,
    field: keyof TeamRosterPlayer,
    value: string
  ) => {
    setFormData((prev) => {
      const updatedRoster = [...prev.roster]
      updatedRoster[index] = {
        ...updatedRoster[index],
        [field]: value,
      }
      const updatedForm = { ...prev, roster: updatedRoster }

      // If Player 1 changed, sync to Captain fields
      if (index === 0) {
        if (field === 'name') updatedForm.captainName = value
        if (field === 'mobileNumber') updatedForm.captainMobile = value
      }

      return updatedForm
    })

    const errorKey = `player_${index}_${field}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[errorKey]
        return next
      })
    }
  }

  const handleAddPlayerSlot = () => {
    if (formData.roster.length < maxSize) {
      handleSquadSizeChange(formData.roster.length + 1)
    }
  }

  const handleRemovePlayerSlot = (index: number) => {
    if (formData.roster.length <= minSize) {
      alert(`Minimum squad size allowed is ${minSize} players.`)
      return
    }
    setFormData((prev) => {
      const filtered = prev.roster.filter((_, i) => i !== index)
      return {
        ...prev,
        numberOfPlayers: filtered.length,
        roster: filtered,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    const validation = RegistrationService.validateTeamForm(formData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      setFormError('Please fix the highlighted fields (check every roster row).')
      return
    }

    setFormError('')
    setIsSubmitting(true)
    const outcome = await onSuccess(formData, requestIdRef.current)
    setIsSubmitting(false)
    if (outcome.ok) {
      requestIdRef.current = newRequestId()
    } else {
      setFormError(outcome.error || 'Team registration could not be saved. Please try again.')
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
      <div className="relative w-full max-w-4xl bg-[#080d1a] border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/90 z-10 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0d162d] to-[#0a1020] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 p-[1.5px] flex items-center justify-center">
              <div className="w-full h-full bg-[#080d1a] rounded-[9px] flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wider">
                Full Team Entry Registration
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                {TOURNAMENT_CONFIG.title} • {TOURNAMENT_CONFIG.edition}
              </p>
              {capacity && (
                <p
                  id="team-slots-remaining"
                  className={`mt-1 text-[11px] font-semibold ${capacity.openForRegistration ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {capacity.openForRegistration
                    ? `${capacity.confirmedTeams}/${capacity.maxConfirmedTeams} teams confirmed • ${Math.max(0, capacity.maxConfirmedTeams - capacity.confirmedTeams - capacity.pendingVerificationTeams)} slots open`
                    : `Team registrations are full (${capacity.maxConfirmedTeams} teams). Please do not pay; contact the organizers.`}
                </p>
              )}
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

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Team Entry Fee Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wide">
                  Official Team Slot Entry Fee
                </div>
                <div className="text-[11px] text-amber-300">
                  Includes full squad slot ({formData.numberOfPlayers} players), tournament fixtures & official match balls
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-heading text-3xl font-black text-amber-400">
                {TOURNAMENT_CONFIG.fees.team.formatted}
              </div>
              <div className="text-[10px] text-slate-400">Fixed Entry</div>
            </div>
          </div>

          <form id="team-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Team & Captain Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Official Team Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={(e) => {
                    setFormData({ ...formData, teamName: e.target.value })
                    if (errors.teamName) {
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.teamName
                        return next
                      })
                    }
                  }}
                  placeholder="e.g. Vizag Strikers XI"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900/90 border text-white text-sm focus:outline-none transition-colors ${
                    errors.teamName
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />
                {errors.teamName && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.teamName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Team City / Base Location <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Visakhapatnam"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Captain's Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="captainName"
                  value={formData.captainName}
                  onChange={handleCaptainChange}
                  placeholder="e.g. Virat Kumar"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900/90 border text-white text-sm focus:outline-none transition-colors ${
                    errors.captainName
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />
                {errors.captainName && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.captainName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Captain's Mobile Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-semibold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="captainMobile"
                    maxLength={10}
                    value={formData.captainMobile}
                    onChange={handleCaptainChange}
                    placeholder="9876543210"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/90 border text-white text-sm focus:outline-none transition-colors ${
                      errors.captainMobile
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-slate-700 focus:border-amber-400'
                    }`}
                  />
                </div>
                {errors.captainMobile && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.captainMobile}
                  </p>
                )}
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Captain / Manager Email <span className="text-slate-500 text-[10px]">(Optional)</span>
              </label>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                placeholder="captain@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Configurable Squad Size Selector */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
                  Configurable Squad Roster Size
                </h4>
                <p className="text-xs text-slate-400">
                  Select how many players to nominate ({minSize} to {maxSize} players)
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[11, 12, 13, 14, 15, 16].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSquadSizeChange(size)}
                    className={`w-9 h-9 rounded-lg font-heading text-sm font-bold transition-all cursor-pointer ${
                      formData.numberOfPlayers === size
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Squad Roster Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-heading text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  Player Roster ({formData.roster.length} Players)
                </h4>
                <div className="flex items-center gap-2">
                  {formData.roster.length < maxSize && (
                    <button
                      type="button"
                      onClick={handleAddPlayerSlot}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Player
                    </button>
                  )}
                </div>
              </div>

              {errors.roster && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.roster}
                </p>
              )}

              {/* Roster Players List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {formData.roster.map((player, idx) => (
                  <div
                    key={player.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-1 text-center font-heading text-xs font-black text-amber-400">
                      #{idx + 1}
                    </div>

                    <div className="col-span-4">
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) =>
                          handleRosterPlayerChange(idx, 'name', e.target.value)
                        }
                        placeholder={idx === 0 ? "Captain's Name" : `Player ${idx + 1} Name`}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      {errors[`player_${idx}_name`] && (
                        <p className="text-[10px] text-red-400 mt-0.5">
                          {errors[`player_${idx}_name`]}
                        </p>
                      )}
                    </div>

                    <div className="col-span-4">
                      <input
                        type="tel"
                        maxLength={10}
                        value={player.mobileNumber}
                        onChange={(e) =>
                          handleRosterPlayerChange(idx, 'mobileNumber', e.target.value)
                        }
                        placeholder="10-digit mobile"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      {errors[`player_${idx}_mobileNumber`] && (
                        <p className="text-[10px] text-red-400 mt-0.5 truncate">
                          {errors[`player_${idx}_mobileNumber`]}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <select
                        value={player.playingRole}
                        onChange={(e) =>
                          handleRosterPlayerChange(
                            idx,
                            'playingRole',
                            e.target.value as PlayingRole
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Batsman">Batsman</option>
                        <option value="Bowler">Bowler</option>
                        <option value="All-Rounder">All-Rounder</option>
                        <option value="Wicket Keeper-Batsman">WK-Bat</option>
                      </select>
                    </div>

                    <div className="col-span-1 text-right">
                      {idx >= minSize && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerSlot(idx)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 cursor-pointer"
                          title="Remove slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.consentAgreed}
                  onChange={(e) =>
                    setFormData({ ...formData, consentAgreed: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  As Team Captain/Representative, I confirm that all listed squad members have
                  consented to participate, are physically fit, and will abide by the official rules,
                  umpire decisions, and code of conduct of NGPL Season 1 in Visakhapatnam.
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
                id="team-form-error"
                role="alert"
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-300 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="block text-red-200">Team registration not saved</strong>
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
            id="team-form-submit"
            type="submit"
            form="team-form"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-heading shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving team registration...</span>
              </>
            ) : (
              <span>Save &amp; Continue to Payment ({TOURNAMENT_CONFIG.fees.team.formatted})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
