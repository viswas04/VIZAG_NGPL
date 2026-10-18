/**
 * NGPL Tennis Ball Cricket Tournament - Central Configuration
 * All tournament metadata, fees, prizes, UPI parameters, and rules are centralized here.
 * You can override environment variables via .env or deploy settings.
 */

export interface PrizeItem {
  id: string
  title: string
  category: 'championship' | 'individual'
  amount: number
  formattedAmount: string
  trophyIncluded: boolean
  description: string
  icon: string
  accentColor: 'gold' | 'red' | 'blue' | 'yellow'
}

export interface FacilityItem {
  id: string
  title: string
  description: string
  icon: string
  highlight: string
}

export const TOURNAMENT_CONFIG = {
  // Brand & Identity
  title: 'NGPL Tennis Ball Cricket Tournament',
  leagueName: 'Next Gen Premier League',
  shortName: 'NGPL',
  edition: 'Season 1',
  tagline: 'PLAY • COMPETE • BE THE NEXT GEN STAR',
  heroTagline: 'YOUR GAME. YOUR MOMENT.',
  finalCtaHeading: 'SHOWCASE YOUR TALENT • COMPETE WITH THE BEST • WIN BIG',

  // Location & Venue
  location: {
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    country: 'India',
    displayString: 'Visakhapatnam, Andhra Pradesh, India',
    venueNotice: 'Official venue details will be announced and communicated to registered participants via SMS/WhatsApp.',
  },

  // Contact Information
  contacts: [
    {
      label: 'Organizer Helpline 1',
      displayNumber: '96188 96939',
      rawNumber: '+919618896939',
      telLink: 'tel:+919618896939',
      whatsappUrl: 'https://wa.me/919618896939?text=Hi%20NGPL%20Team,%20I%20have%20an%20inquiry%20regarding%20Season%201%20Tennis%20Ball%20Cricket%20Tournament',
    },
    {
      label: 'Organizer Helpline 2',
      displayNumber: '79893 18524',
      rawNumber: '+917989318524',
      telLink: 'tel:+917989318524',
      whatsappUrl: 'https://wa.me/917989318524?text=Hi%20NGPL%20Team,%20I%20have%20an%20inquiry%20regarding%20Season%201%20Tennis%20Ball%20Cricket%20Tournament',
    },
  ],

  // Primary WhatsApp number for quick float button
  primaryWhatsApp: {
    number: '9618896939',
    url: 'https://wa.me/919618896939?text=Hello%20NGPL%20Team,%20I%20want%20to%20know%20more%20about%20the%20Season%201%20Cricket%20Tournament%20in%20Visakhapatnam.',
  },

  // Central Payment Defaults (authoritative values are served dynamically by the Apps Script backend)
  payment: {
    upiId: '7989318524-2@ybl',
    payeeName: 'NGPL Cricket Tournament',
    tournamentName: 'NGPL Tennis Ball Cricket Tournament - Season 1',
    currency: 'INR',
    /** Known stale/legacy UPI IDs from previous deployments/cache that must never be displayed */
    staleUpiIds: ['79893318524@ybl'],
  },

  // Registration Fees (in INR)
  fees: {
    player: {
      amount: 149,
      formatted: '₹149',
      label: 'Individual Player Registration',
      subtitle: 'Draft / Individual Entry Pool',
    },
    team: {
      amount: 12000,
      formatted: '₹12,000',
      label: 'Full Team Entry',
      subtitle: 'Guaranteed Squad Slot',
    },
  },

  // Prize Money & Awards Breakdown
  prizes: {
    totalPool: '₹1,10,500',
    championship: [
      {
        id: 'first-prize',
        title: 'First Prize (Champions)',
        category: 'championship',
        amount: 70000,
        formattedAmount: '₹70,000',
        trophyIncluded: true,
        description: 'Magnificent Champion Trophy + Gold Medals + Mega Cash Prize',
        icon: 'Trophy',
        accentColor: 'gold',
      },
      {
        id: 'runner-up',
        title: 'Runner-up Prize',
        category: 'championship',
        amount: 30000,
        formattedAmount: '₹30,000',
        trophyIncluded: true,
        description: 'Prestige Runners Trophy + Silver Medals + Cash Prize',
        icon: 'Medal',
        accentColor: 'blue',
      },
    ] as PrizeItem[],
    individual: [
      {
        id: 'best-batsman',
        title: 'Best Batsman',
        category: 'individual',
        amount: 3500,
        formattedAmount: '₹3,500',
        trophyIncluded: true,
        description: 'Awarded to the tournament leading run-scorer with highest impact strike rate.',
        icon: 'Flame',
        accentColor: 'gold',
      },
      {
        id: 'best-bowler',
        title: 'Best Bowler',
        category: 'individual',
        amount: 3500,
        formattedAmount: '₹3,500',
        trophyIncluded: true,
        description: 'Awarded to the top wicket-taker with best bowling economy and strike rate.',
        icon: 'Target',
        accentColor: 'red',
      },
      {
        id: 'best-fielder',
        title: 'Best Fielder',
        category: 'individual',
        amount: 3500,
        formattedAmount: '₹3,500',
        trophyIncluded: true,
        description: 'Awarded for extraordinary catches, direct hits, and electric ground fielding.',
        icon: 'ShieldCheck',
        accentColor: 'blue',
      },
    ] as PrizeItem[],
  },

  // Tournament Facilities (strictly as specified by organizer)
  facilities: [
    {
      id: 'live-telecast',
      title: 'Live Telecasting',
      description: 'Multi-camera live broadcast with professional graphics, ball-by-ball score updates, and YouTube streaming.',
      icon: 'Tv',
      highlight: 'Broadcasted Live',
    },
    {
      id: 'official-umpires',
      title: 'Official Umpires',
      description: 'Certified, unbiased match officials and third umpire review mechanism for fair and professional gameplay.',
      icon: 'Award',
      highlight: 'Certified Officials',
    },
    {
      id: 'refreshments',
      title: 'Snacks & Energy Drinks Provided',
      description: 'Complimentary energy beverages, bottled mineral water, and energizing nutritious snacks for participating squads.',
      icon: 'Coffee',
      highlight: 'Complimentary',
    },
    {
      id: 'tennis-ball',
      title: 'Tennis Ball Cricket',
      description: 'Heavy professional-grade tournament tennis balls engineered for true bounce, pace, and thrilling sixes.',
      icon: 'CircleDot',
      highlight: 'Official Heavy Ball',
    },
  ] as FacilityItem[],

  // UPI PAYMENT RECEIVER
  // The UPI ID is intentionally NOT configured in the frontend. Its single
  // configurable location is PAYMENT_CONFIG.UPI_ID in apps-script/Code.gs.
  // The website receives it from the backend with every registration, so QR codes,
  // UPI links and sheet records always use the same receiver.
  // The fees above are display values; the backend enforces the real amounts and
  // the site refuses to show a payment request if they ever disagree.

  // Configurable Eligibility & Squad Rules
  rules: {
    minPlayerAge: 14,
    maxPlayerAge: 55,
    minSquadSize: 11,
    maxSquadSize: 16,
    defaultSquadSize: 12,
  },

  // Roles available
  playingRoles: [
    { value: 'Batsman', label: 'Batsman (Top/Middle Order)' },
    { value: 'Bowler', label: 'Bowler (Pacer/Spinner)' },
    { value: 'All-Rounder', label: 'All-Rounder' },
    { value: 'Wicket Keeper-Batsman', label: 'Wicket Keeper-Batsman' },
  ] as const,

  // Admin access: verified server-side only (ADMIN_KEY Script Property).
  // The admin portal is opened via the private URL hash "#admin" (not linked publicly).
}
