import React from 'react'
import { Tv, Award, Coffee, CircleDot, Shield } from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'

export const FacilitiesSection: React.FC = () => {
  // Mapping icons strictly to the 4 organizer-specified facilities
  const iconMap: Record<string, React.ReactNode> = {
    'live-telecast': <Tv className="w-7 h-7 text-sky-400" />,
    'official-umpires': <Award className="w-7 h-7 text-amber-400" />,
    'refreshments': <Coffee className="w-7 h-7 text-emerald-400" />,
    'tennis-ball': <CircleDot className="w-7 h-7 text-lime-400" />,
  }

  const borderColors: Record<string, string> = {
    'live-telecast': 'border-sky-500/30 group-hover:border-sky-400',
    'official-umpires': 'border-amber-500/30 group-hover:border-amber-400',
    'refreshments': 'border-emerald-500/30 group-hover:border-emerald-400',
    'tennis-ball': 'border-lime-500/30 group-hover:border-lime-400',
  }

  const tagColors: Record<string, string> = {
    'live-telecast': 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    'official-umpires': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'refreshments': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'tennis-ball': 'bg-lime-500/10 text-lime-400 border-lime-500/30',
  }

  return (
    <section id="facilities" className="py-20 bg-[#050811] relative overflow-hidden">
      {/* Visual background sports light flair */}
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-sky-500/5 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-sky-400 text-xs font-bold uppercase tracking-widest mb-3">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            Official Event Standards
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            TOURNAMENT <span className="gold-gradient-text">FACILITIES</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Professional match arrangements guaranteed for all participating teams and players.
            Strictly adhering to official organizer specifications.
          </p>
        </div>

        {/* 4 Cards strictly according to instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TOURNAMENT_CONFIG.facilities.map((facility) => (
            <div
              key={facility.id}
              className={`group relative glass-panel p-6 sm:p-7 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 shadow-xl ${
                borderColors[facility.id] || 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  {iconMap[facility.id]}
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    tagColors[facility.id] || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {facility.highlight}
                </span>
              </div>

              <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wide mb-2 group-hover:text-amber-400 transition-colors">
                {facility.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {facility.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
