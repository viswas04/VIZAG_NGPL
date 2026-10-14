/**
 * Admin API — every call carries the admin key typed by the organizer. The key is
 * verified ONLY on the server (Apps Script Script Properties: ADMIN_KEY). It is
 * kept in memory for the current session and never persisted or bundled.
 */
import type {
  AdminData,
  AdminMatchRow,
  ApiResult,
  MatchStatus,
  PaymentVerificationStatus,
  RegistrationStatus,
} from '../types/registration'
import { callBackend } from './apiClient'

export class AdminService {
  static login(adminKey: string) {
    return callBackend<{ ok: true }>('adminLogin', { adminKey })
  }

  static async list(adminKey: string): Promise<ApiResult<AdminData>> {
    return callBackend<AdminData>('adminList', { adminKey })
  }

  static updatePayment(
    adminKey: string,
    paymentRef: string,
    status: Exclude<PaymentVerificationStatus, 'Pending Verification'>,
    notes: string
  ) {
    return callBackend<{ status: string; decidedAt: string; registrationSynced: boolean }>('adminUpdatePayment', {
      adminKey,
      paymentRef,
      status,
      notes,
    })
  }

  static updateRegistration(adminKey: string, registrationId: string, status: RegistrationStatus) {
    return callBackend<{ status: string }>('adminUpdateRegistration', { adminKey, registrationId, status })
  }

  /** Server enforces: confirmed teams only, max matches per day, no time/team clashes. */
  static scheduleMatch(
    adminKey: string,
    match: { date: string; time: string; teamAId: string; teamBId: string; venue: string; notes: string }
  ) {
    return callBackend<{ match: AdminMatchRow; matchesOnDate: number; maxMatchesPerDay: number }>('adminScheduleMatch', {
      adminKey,
      ...match,
    })
  }

  static updateMatch(adminKey: string, matchId: string, status: MatchStatus, notes?: string) {
    return callBackend<{ match: AdminMatchRow }>('adminUpdateMatch', { adminKey, matchId, status, notes })
  }
}
