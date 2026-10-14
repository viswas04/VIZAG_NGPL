import React from 'react'
import { Sparkles, UserCheck, Users } from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'

interface FinalCtaProps {
  onOpenPlayerModal: () => void
  onOpenTeamModal: () => void
}

export const FinalCta: React.FC<FinalCtaProps> = ({
  onOpenPlayerModal,
  onOpenTeamModal,
}) => {
  return (
    <section className="py-20 relative bg-gradient-to-b from-[#060b17] to-[#04060c] overflow-hidden">
      {/* Background spotlights & floodlight overlay */}
      <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          {TOURNAMENT_CONFIG.edition} • Visakhapatnam
        </div>

        <h2 className="font-heading text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-tight">
          {TOURNAMENT_CONFIG.finalCtaHeading}
        </h2>

        <p className="mt-4 text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
          The pitch is set, the floodlights are on, and Visakhapatnam awaits its next cricket champions.
          Secure your entry before tournament slots close.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={onOpenPlayerModal}
            className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-heading transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Register as Player — ₹149</span>
          </button>

          <button
            onClick={onOpenTeamModal}
            className="w-full sm:w-auto px-7 py-4 rounded-xl text-sm font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-heading transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-950" />
            <span>Register Your Team — ₹12,000</span>
          </button>
        </div>
      </div>
    </section>
  )
}
