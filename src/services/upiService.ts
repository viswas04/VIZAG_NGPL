import QRCode from 'qrcode'
import type { PaymentInstructions } from '../types/registration'

/**
 * UPI helpers.
 *
 * The UPI receiver (pa), payee name, amount and reference are taken ONLY from the
 * PaymentInstructions issued by the backend (apps-script/Code.gs -> PAYMENT_CONFIG),
 * which is the single configurable location for the UPI ID.
 */
export class UpiService {
  /**
   * Builds an NPCI UPI deep link: upi://pay?pa=&pn=&am=&cu=INR&tn=
   *
   * The unique registration reference is carried in `tn` (transaction note), which
   * every UPI app supports and which appears in both payer and payee history.
   * `tr` is intentionally NOT set: it is meant for merchant VPAs, and several apps
   * decline or flag P2P payments to personal VPAs (e.g. @ybl) when `tr` is present.
   */
  static buildPaymentUri(payment: PaymentInstructions): string {
    const params = [
      `pa=${encodeURIComponent(payment.upiId)}`,
      `pn=${encodeURIComponent(payment.payeeName)}`,
      `am=${payment.amount.toFixed(2)}`,
      `cu=${encodeURIComponent(payment.currency || 'INR')}`,
      `tn=${encodeURIComponent(payment.note)}`,
    ]
    // encodeURIComponent turns "@" into %40; UPI apps accept both, but keep VPA readable.
    return `upi://pay?${params.join('&').replace('%40', '@')}`
  }

  /** Generates a Data URL QR Code image from a UPI URI string */
  static async generateQrCodeDataUrl(uri: string): Promise<string> {
    try {
      return await QRCode.toDataURL(uri, {
        width: 320,
        margin: 2,
        color: { dark: '#050811', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      })
    } catch (err) {
      console.error('Failed to generate UPI QR code:', err)
      return ''
    }
  }

  static normalizeUtr(utr: string): string {
    return utr.replace(/\s+/g, '')
  }

  /**
   * UPI UTR / "UPI Ref No." is a 12-digit number shown in GPay, PhonePe, Paytm,
   * BHIM and bank statements. It is what the admin matches against bank records.
   */
  static validateUtr(utr: string): { isValid: boolean; error?: string } {
    const v = this.normalizeUtr(utr)
    if (!v) return { isValid: false, error: 'UPI transaction reference (UTR) is required' }
    if (!/^\d{12}$/.test(v)) {
      return { isValid: false, error: 'Enter the 12-digit UPI Ref No. / UTR exactly as shown in your UPI app' }
    }
    return { isValid: true }
  }

  /** Checks if current browser environment is likely a mobile device supporting direct UPI apps */
  static isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
}
