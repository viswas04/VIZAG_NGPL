import React from 'react'
import { Flame, Target, ShieldCheck, Award } from 'lucide-react'

export const IndividualAwards: React.FC = () => {
  return (
    <section id="awards" className="py-20 bg-[#060a15] relative overflow-hidden">
      {/* Background radial spotlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-80 bg-amber-500/5 blur-[160px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Individual Excellence
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            INDIVIDUAL <span className="gold-gradient-text">STAR AWARDS</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Every match counts. Shine on the big stage and take home dedicated cash prizes,
            prestigious individual trophies, and state-wide recognition.
          </p>
        </div>

        {/* 3 Distinct Individual Award Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Best Batsman - Golden Fire Theme */}
          <div className="relative group rounded-3xl p-[2px] bg-gradient-to-b from-amber-400 via-amber-600/40 to-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/20">
            <div className="h-full bg-gradient-to-b from-[#0e162d] to-[#070b16] rounded-[22px] p-7 flex flex-col justify-between border border-amber-500/20">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-105 transition-transform">
                    <Flame className="w-7 h-7 text-amber-400" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase tracking-wider">
                    Orange Cap
                  </span>
                </div>

                <div className="text-xs font-bold tracking-widest text-amber-400/90 uppercase mb-1">
                  Powerhitter Trophy
                </div>
                <h3 className="font-heading text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                  Best Batsman
                </h3>

                <div className="my-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Award Prize</span>
                  <div className="font-heading text-4xl font-black text-amber-400 tracking-tight">
                    ₹3,500
                  </div>
                  <span className="text-xs text-amber-300/80 font-medium">
                    + Specialized Batsman Trophy
                  </span>
                </div>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Presented to the highest run-scorer demonstrating aggressive boundaries, match-winning
                  innings, and dominant strike rates in pressure overs.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Evaluated by Official Scorers</span>
                <span className="text-amber-400 font-bold uppercase">Official Trophy</span>
              </div>
            </div>
          </div>

          {/* 2. Best Bowler - Electric Crimson / Red Laser Theme */}
          <div className="relative group rounded-3xl p-[2px] bg-gradient-to-b from-red-500 via-red-600/40 to-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/20">
            <div className="h-full bg-gradient-to-b from-[#170e1a] to-[#070b16] rounded-[22px] p-7 flex flex-col justify-between border border-red-500/20">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-400/40 flex items-center justify-center text-red-400 shadow-inner group-hover:scale-105 transition-transform">
                    <Target className="w-7 h-7 text-red-400" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/30 text-[11px] font-bold uppercase tracking-wider">
                    Purple Cap
                  </span>
                </div>

                <div className="text-xs font-bold tracking-widest text-red-400/90 uppercase mb-1">
                  Wicket Hunter Trophy
                </div>
                <h3 className="font-heading text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                  Best Bowler
                </h3>

                <div className="my-5 p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Award Prize</span>
                  <div className="font-heading text-4xl font-black text-red-400 tracking-tight">
                    ₹3,500
                  </div>
                  <span className="text-xs text-red-300/80 font-medium">
                    + Specialized Bowler Trophy
                  </span>
                </div>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Presented to the tournament leading wicket-taker who dominates with deadly yorkers,
                  swing variation, and stingy economy rates under the lights.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Tracked by Official Scorers</span>
                <span className="text-red-400 font-bold uppercase">Official Trophy</span>
              </div>
            </div>
          </div>

          {/* 3. Best Fielder - Neon Blue / Shield Theme */}
          <div className="relative group rounded-3xl p-[2px] bg-gradient-to-b from-sky-400 via-sky-600/40 to-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-500/20">
            <div className="h-full bg-gradient-to-b from-[#0b162b] to-[#070b16] rounded-[22px] p-7 flex flex-col justify-between border border-sky-500/20">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-inner group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-7 h-7 text-sky-400" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[11px] font-bold uppercase tracking-wider">
                    Safe Hands
                  </span>
                </div>

                <div className="text-xs font-bold tracking-widest text-sky-400/90 uppercase mb-1">
                  Agility Trophy
                </div>
                <h3 className="font-heading text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                  Best Fielder
                </h3>

                <div className="my-5 p-4 rounded-xl bg-sky-500/5 border border-sky-500/15">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Award Prize</span>
                  <div className="font-heading text-4xl font-black text-sky-400 tracking-tight">
                    ₹3,500
                  </div>
                  <span className="text-xs text-sky-300/80 font-medium">
                    + Specialized Fielder Trophy
                  </span>
                </div>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Presented for breathtaking diving catches, pinpoint direct-hit run outs, boundary
                  stops, and unmatched energy on the turf.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Judged by Umpires & Scorers</span>
                <span className="text-sky-400 font-bold uppercase">Official Trophy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
