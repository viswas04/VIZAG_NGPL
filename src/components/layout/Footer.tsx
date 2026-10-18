import React from 'react'
import { Trophy, Phone, MapPin, Search } from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'

interface FooterProps {
  onOpenPlayerModal: () => void
  onOpenTeamModal: () => void
  onOpenLookupModal: () => void
}

const CURRENT_YEAR = new Date().getFullYear()

export const Footer: React.FC<FooterProps> = ({
  onOpenPlayerModal,
  onOpenTeamModal,
  onOpenLookupModal,
}) => {
  return (
    <footer className="bg-[#03050a] border-t border-slate-800/80 pt-16 pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1.5px]">
                <div className="w-full h-full bg-[#070b16] rounded-[10px] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <span className="font-heading text-xl font-black text-white tracking-wider block">
                  {TOURNAMENT_CONFIG.shortName}
                </span>
                <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">
                  {TOURNAMENT_CONFIG.edition} • Visakhapatnam
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {TOURNAMENT_CONFIG.title}. Premier night cricket under floodlights with official umpires,
              heavy tennis balls, and ₹1,10,500 total prize pool.
            </p>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{TOURNAMENT_CONFIG.location.displayString}</span>
            </div>
          </div>

          {/* Registration Quick Links */}
          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">
              Registrations
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={onOpenPlayerModal}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Player Registration (₹149)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTeamModal}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Team Entry (₹12,000)</span>
                </button>
              </li>
              <li>
                <a
                  href="#prizes"
                  className="hover:text-amber-400 transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  <span>First Prize (₹70,000)</span>
                </a>
              </li>
              <li>
                <a
                  href="#prizes"
                  className="hover:text-amber-400 transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  <span>Runner-up Prize (₹30,000)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Helpline Contact Details */}
          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">
              Official Helpline
            </h4>
            <div className="space-y-2.5 text-xs">
              {TOURNAMENT_CONFIG.contacts.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <a
                    href={c.telLink}
                    className="text-slate-300 hover:text-amber-400 font-semibold transition-colors"
                  >
                    {c.displayNumber}
                  </a>
                </div>
              ))}
              <div className="pt-2">
                <a
                  href={TOURNAMENT_CONFIG.primaryWhatsApp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Chat on WhatsApp →
                </a>
              </div>
            </div>
          </div>

          {/* Registration status */}
          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">
              Already Registered?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Check your payment verification status or complete a pending payment with your
              Registration ID. Match schedules will be posted to registered contacts.
            </p>
            <button
              id="footer-check-registration"
              onClick={onOpenLookupModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Check Registration / Pay</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {CURRENT_YEAR} {TOURNAMENT_CONFIG.title} • {TOURNAMENT_CONFIG.edition}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Visakhapatnam, Andhra Pradesh</span>
            <span className="text-amber-400 font-bold uppercase">{TOURNAMENT_CONFIG.tagline}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
