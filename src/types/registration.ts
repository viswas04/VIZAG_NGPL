export type PlayingRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper-Batsman'

export type RegistrationType = 'player' | 'team'
/** Registration type as stored in the Google Sheet */
export type SheetRegistrationType = 'Individual' | 'Team'

/** Verification status of a payment record (Payment Records tab) */
export type PaymentVerificationStatus = 'Pending Verification' | 'Verified' | 'Rejected'
/** Payment status on a registration row. "Awaiting Payment" = no UTR submitted yet. */
export type RegistrationPaymentStatus = 'Awaiting Payment' | PaymentVerificationStatus
export type RegistrationStatus =
  | 'Pending Payment'
  | 'Under Review'
  | 'Confirmed'
  | 'Payment Rejected'
  | 'Cancelled'

export interface PlayerFormData {
  fullName: string
  dateOfBirth: string // YYYY-MM-DD
  age: number
  mobileNumber: string
  emailAddress?: string
  city: string
  playingRole: PlayingRole
  cricketExperience?: string
  emergencyContact: string
  consentAgreed: boolean
}

export interface TeamRosterPlayer {
  id: string
  name: string
  mobileNumber: string
  playingRole: PlayingRole
}

export interface TeamFormData {
  teamName: string
  captainName: string
  captainMobile: string
  emailAddress?: string
  city: string
  numberOfPlayers: number
  roster: TeamRosterPlayer[]
  consentAgreed: boolean
}

/** Payment instructions issued by the backend (UPI receiver comes ONLY from the server). */
export interface PaymentInstructions {
  upiId: string
  payeeName: string
  tournamentName: string
  amount: number
  currency: string
  note: string
  reference: string
}

/** Server-confirmed registration state returned by the backend. */
export interface RegistrationReceipt {
  registrationId: string
  type: SheetRegistrationType
  displayName: string
  mobileLast4: string
  amount: number
  paymentStatus: RegistrationPaymentStatus
  registrationStatus: RegistrationStatus
  submittedAt: string
  utr: string
  paymentRef?: string
  paymentSubmittedAt?: string
  payment: PaymentInstructions
}

export interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
  code?: string
  fieldErrors?: Record<string, string>
}

// ---------- Admin data (as returned by adminList) ----------
export interface AdminIndividualRow {
  registrationId: string
  submittedAt: string
  fullName: string
  dateOfBirth: string
  age: number
  mobile: string
  email: string
  city: string
  playingRole: string
  experience: string
  emergencyContact: string
  fee: number
  utr: string
  paymentStatus: RegistrationPaymentStatus
  registrationStatus: RegistrationStatus
}

export interface AdminTeamRow {
  registrationId: string
  submittedAt: string
  teamName: string
  captainName: string
  captainMobile: string
  captainEmail: string
  city: string
  squadSize: number
  roster: string
  fee: number
  utr: string
  paymentStatus: RegistrationPaymentStatus
  registrationStatus: RegistrationStatus
}

export interface AdminPaymentRow {
  paymentRef: string
  registrationId: string
  registrationType: SheetRegistrationType
  payerName: string
  payerMobile: string
  expectedAmount: number
  upiReceiver: string
  utr: string
  submittedAt: string
  verificationStatus: PaymentVerificationStatus
  decidedAt: string
  adminNotes: string
}

export type MatchStatus = 'Scheduled' | 'Completed' | 'Cancelled'

export interface AdminMatchRow {
  matchId: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  teamAId: string
  teamAName: string
  teamBId: string
  teamBName: string
  venue: string
  status: MatchStatus
  createdAt: string
  adminNotes: string
}

/** Team slot usage computed by the backend (limit enforced server-side). */
export interface TeamCapacity {
  maxConfirmedTeams: number
  confirmedTeams: number
  pendingVerificationTeams: number
  slotsRemaining: number
  openForRegistration: boolean
  maxMatchesPerDay: number
}

/** GET ?action=health response. Never contains secrets. */
export interface BackendHealth {
  ok: boolean
  service: string
  ready: boolean
  problems: string[]
  capacity: TeamCapacity | null
  payment?: { upiId: string; fees: { Individual: number; Team: number } }
}

export interface AdminData {
  individuals: AdminIndividualRow[]
  teams: AdminTeamRow[]
  payments: AdminPaymentRow[]
  matches: AdminMatchRow[]
  capacity: TeamCapacity
}
