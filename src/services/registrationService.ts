import { TOURNAMENT_CONFIG } from '../config/tournamentConfig'
import type {
  ApiResult,
  PlayerFormData,
  TeamFormData,
  RegistrationReceipt,
} from '../types/registration'
import { callBackend, newRequestId } from './apiClient'
import { UpiService } from './upiService'

type ReceiptResponse = { registration: RegistrationReceipt }

export class RegistrationService {
  /**
   * Calculates age in completed years from Date of Birth string (YYYY-MM-DD)
   */
  static calculateAge(dobString: string): number {
    if (!dobString) return 0
    const birthDate = new Date(dobString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return Math.max(0, age)
  }

  /**
   * Validates Indian mobile number format (10 digits starting with 6,7,8,9)
   */
  static isValidIndianMobile(mobile: string): boolean {
    const cleaned = mobile.replace(/[\s\-+]/g, '')
    // Allow either 10 digits or 91 + 10 digits
    if (cleaned.length === 10) {
      return /^[6-9]\d{9}$/.test(cleaned)
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return /^[6-9]\d{9}$/.test(cleaned.substring(2))
    }
    return false
  }

  /**
   * Validates Player Form fields and eligibility rules
   */
  static validatePlayerForm(data: PlayerFormData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    if (!data.fullName.trim()) {
      errors.fullName = 'Full Name is required'
    } else if (data.fullName.trim().length < 3) {
      errors.fullName = 'Name must be at least 3 characters'
    }

    if (!data.dateOfBirth) {
      errors.dateOfBirth = 'Date of Birth is required'
    } else {
      const calculatedAge = this.calculateAge(data.dateOfBirth)
      if (calculatedAge < TOURNAMENT_CONFIG.rules.minPlayerAge) {
        errors.dateOfBirth = `Minimum age is ${TOURNAMENT_CONFIG.rules.minPlayerAge} years. Current calculated age: ${calculatedAge}`
      } else if (calculatedAge > TOURNAMENT_CONFIG.rules.maxPlayerAge) {
        errors.dateOfBirth = `Maximum allowed age is ${TOURNAMENT_CONFIG.rules.maxPlayerAge} years.`
      }
    }

    if (!data.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required'
    } else if (!this.isValidIndianMobile(data.mobileNumber)) {
      errors.mobileNumber = 'Enter a valid 10-digit mobile number'
    }

    if (data.emailAddress && data.emailAddress.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.emailAddress.trim())) {
        errors.emailAddress = 'Invalid email address format'
      }
    }

    if (!data.city.trim()) {
      errors.city = 'City / Town is required'
    }

    if (!data.playingRole) {
      errors.playingRole = 'Please select your primary playing role'
    }

    if (!data.emergencyContact.trim()) {
      errors.emergencyContact = 'Emergency contact number is required'
    } else if (!this.isValidIndianMobile(data.emergencyContact)) {
      errors.emergencyContact = 'Enter a valid 10-digit emergency number'
    } else if (data.emergencyContact.trim() === data.mobileNumber.trim()) {
      errors.emergencyContact = 'Emergency contact should be different from your mobile number'
    }

    if (!data.consentAgreed) {
      errors.consentAgreed = 'You must agree to tournament rules & player terms'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Validates Team Form fields and Roster
   */
  static validateTeamForm(data: TeamFormData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    if (!data.teamName.trim()) {
      errors.teamName = 'Team Name is required'
    } else if (data.teamName.trim().length < 3) {
      errors.teamName = 'Team Name must be at least 3 characters'
    }

    if (!data.captainName.trim()) {
      errors.captainName = "Captain's Full Name is required"
    }

    if (!data.captainMobile.trim()) {
      errors.captainMobile = "Captain's Mobile Number is required"
    } else if (!this.isValidIndianMobile(data.captainMobile)) {
      errors.captainMobile = 'Enter a valid 10-digit mobile number for Captain'
    }

    if (data.emailAddress && data.emailAddress.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.emailAddress.trim())) {
        errors.emailAddress = 'Invalid email address'
      }
    }

    if (!data.city.trim()) {
      errors.city = 'Team City / Location is required'
    }

    // Validate squad roster
    if (!data.roster || data.roster.length < TOURNAMENT_CONFIG.rules.minSquadSize) {
      errors.roster = `A minimum squad of ${TOURNAMENT_CONFIG.rules.minSquadSize} players is required.`
    } else {
      // Validate each player in roster. Player #1 is the captain (synced from the
      // captain fields), so uniqueness is checked within the roster only.
      const seenMobiles = new Set<string>()

      for (let i = 0; i < data.roster.length; i++) {
        const player = data.roster[i]
        if (!player.name.trim()) {
          errors[`player_${i}_name`] = `Player #${i + 1} name is required`
        }
        if (!player.mobileNumber.trim()) {
          errors[`player_${i}_mobileNumber`] = `Player #${i + 1} mobile is required`
        } else if (!this.isValidIndianMobile(player.mobileNumber)) {
          errors[`player_${i}_mobileNumber`] = `Player #${i + 1} mobile is invalid`
        } else {
          const cleanMob = player.mobileNumber.replace(/\D/g, '').slice(-10)
          if (seenMobiles.has(cleanMob)) {
            errors[`player_${i}_mobileNumber`] = `Duplicate mobile number in team: ${cleanMob}`
          }
          seenMobiles.add(cleanMob)
        }
      }
    }

    if (!data.consentAgreed) {
      errors.consentAgreed = 'Captain must agree to tournament terms on behalf of the squad'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Ensures the server-issued payment request matches the published fee for this
   * registration type before we show a QR code / UPI link to the user.
   */
  private static checkReceipt(
    result: ApiResult<ReceiptResponse>,
    expectedAmount: number
  ): ApiResult<RegistrationReceipt> {
    if (!result.ok || !result.data?.registration) {
      return { ok: false, error: result.error, code: result.code, fieldErrors: result.fieldErrors }
    }
    const reg = result.data.registration
    if (reg.payment.amount !== expectedAmount || reg.amount !== expectedAmount) {
      return {
        ok: false,
        code: 'AMOUNT_MISMATCH',
        error: 'Payment amount from the server does not match the published fee. Please contact the organizers before paying.',
      }
    }
    return { ok: true, data: reg }
  }

  static expectedFee(type: 'Individual' | 'Team'): number {
    return type === 'Team' ? TOURNAMENT_CONFIG.fees.team.amount : TOURNAMENT_CONFIG.fees.player.amount
  }

  /**
   * Saves an individual registration to the Google Sheet via the backend.
   * Resolves ok:true ONLY after the backend confirms the row was written.
   */
  static async registerPlayer(data: PlayerFormData, requestId = newRequestId()) {
    const result = await callBackend<ReceiptResponse>('registerIndividual', {
      requestId,
      data: { ...data, amount: TOURNAMENT_CONFIG.fees.player.amount },
    })
    return this.checkReceipt(result, TOURNAMENT_CONFIG.fees.player.amount)
  }

  /** Saves a team registration to the Google Sheet via the backend. */
  static async registerTeam(data: TeamFormData, requestId = newRequestId()) {
    const result = await callBackend<ReceiptResponse>('registerTeam', {
      requestId,
      data: {
        ...data,
        roster: data.roster.map(({ name, mobileNumber, playingRole }) => ({ name, mobileNumber, playingRole })),
        amount: TOURNAMENT_CONFIG.fees.team.amount,
      },
    })
    return this.checkReceipt(result, TOURNAMENT_CONFIG.fees.team.amount)
  }

  /**
   * Submits a UTR for MANUAL verification. This never marks the payment as
   * successful - the backend records it as "Pending Verification".
   */
  static async submitPaymentReference(
    receipt: RegistrationReceipt,
    mobile: string,
    utr: string,
    requestId = newRequestId()
  ): Promise<ApiResult<RegistrationReceipt>> {
    const utrCheck = UpiService.validateUtr(utr)
    if (!utrCheck.isValid) {
      return { ok: false, error: utrCheck.error, fieldErrors: { utr: utrCheck.error || '' } }
    }
    const result = await callBackend<ReceiptResponse>('submitPayment', {
      requestId,
      registrationId: receipt.registrationId,
      mobile,
      utr: UpiService.normalizeUtr(utr),
      amount: receipt.amount,
    })
    return this.checkReceipt(result, this.expectedFee(receipt.type))
  }

  /** Looks up a registration (requires ID + registered mobile). */
  static async lookupRegistration(registrationId: string, mobile: string) {
    const result = await callBackend<ReceiptResponse>('lookupRegistration', {
      registrationId: registrationId.trim().toUpperCase(),
      mobile,
    })
    if (!result.ok || !result.data) return result as ApiResult<never>
    return this.checkReceipt(result, this.expectedFee(result.data.registration.type))
  }
}
