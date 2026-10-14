import React from 'react'
import { MapPin, Phone, MessageCircle, Clock } from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'

export const ContactLocation: React.FC = () => {
  return (
    <section id="contact" className="py-20 bg-[#050811] relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-sky-400 text-xs font-bold uppercase tracking-widest mb-3">
            <Phone className="w-3.5 h-3.5 text-sky-400" />
            Tournament Helpdesk
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            CONTACT & <span className="gold-gradient-text">LOCATION</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Have questions regarding squad eligibility, slot confirmations, or payment verification?
            Reach out directly to the official NGPL tournament committee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Location & Host City Card */}
          <div className="glass-panel p-7 sm:p-9 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400 mb-6">
                <MapPin className="w-7 h-7" />
              </div>

              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
                Official Host City
              </span>
              <h3 className="font-heading text-3xl font-black text-white uppercase tracking-wide mt-1 mb-4">
                VISAKHAPATNAM
              </h3>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 mb-6">
                <div className="text-sm font-semibold text-slate-200">
                  {TOURNAMENT_CONFIG.location.displayString}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {TOURNAMENT_CONFIG.location.venueNotice}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Fixtures and match slots will be coordinated prior to commencement.</span>
            </div>
          </div>

          {/* Contact Numbers & WhatsApp Card */}
          <div className="glass-panel p-7 sm:p-9 rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-6">
                <Phone className="w-7 h-7" />
              </div>

              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Helpline Numbers
              </span>
              <h3 className="font-heading text-3xl font-black text-white uppercase tracking-wide mt-1 mb-4">
                ORGANIZER DESK
              </h3>

              <div className="space-y-3 mb-6">
                {TOURNAMENT_CONFIG.contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between hover:border-amber-400/40 transition-colors"
                  >
                    <div>
                      <div className="text-xs text-slate-400 font-medium">{contact.label}</div>
                      <a
                        href={contact.telLink}
                        className="font-heading text-xl font-bold text-amber-300 hover:text-amber-200 tracking-wider flex items-center gap-2 mt-0.5"
                      >
                        <Phone className="w-4 h-4 text-amber-400" />
                        <span>{contact.displayNumber}</span>
                      </a>
                    </div>

                    <a
                      href={contact.telLink}
                      className="px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 text-xs font-bold uppercase tracking-wider border border-amber-400/30"
                    >
                      Call Now
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Configured WhatsApp Contact Button */}
            {TOURNAMENT_CONFIG.primaryWhatsApp.number && (
              <div className="pt-2">
                <a
                  href={TOURNAMENT_CONFIG.primaryWhatsApp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer font-heading"
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                  <span>Chat on WhatsApp ({TOURNAMENT_CONFIG.contacts[0].displayNumber})</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
