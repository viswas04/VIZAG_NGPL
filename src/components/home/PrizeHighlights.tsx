import React from 'react'
import { Trophy, Medal, Flame, Target, ShieldCheck, Sparkles } from 'lucide-react'

interface PrizeHighlightsProps {
  onOpenTeamModal: () => void
}

export const PrizeHighlights: React.FC<PrizeHighlightsProps> = ({ onOpenTeamModal }) => {
  return (
    <section id="prizes" className="py-20 relative bg-[#050811] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Tournament Prize Pool
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            STAKE YOUR CLAIM ON <span className="gold-gradient-text">GLORY & CASH</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Season 1 brings unprecedented recognition and lucrative cash rewards for champions,
            runners-up, and top individual performers in Visakhapatnam.
          </p>
        </div>

        {/* Top Tier Championship Prizes (First & Runner-up) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-stretch">
          {/* First Prize - 70,000 (Golden Mega Card) */}
          <div className="lg:col-span-7 relative group rounded-3xl p-1 bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-600 shadow-2xl shadow-amber-500/20 transform transition-all duration-300 hover:scale-[1.01]">
            <div className="h-full bg-gradient-to-b from-[#091024] to-[#060a14] rounded-[22px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative">
              {/* Subtle Trophy Watermark in background */}
              <div className="absolute -right-12 -bottom-12 w-64 h-64 opacity-15 pointer-events-none">
                <img
                  src="/images/trophy.jpg"
                  alt="Championship Trophy"
                  className="w-full h-full object-cover rounded-full filter contrast-125"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider font-heading">
                    <Trophy className="w-3.5 h-3.5" />
                    Grand Champions
                  </span>
                  <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">
                    Season 1 Crown
                  </span>
                </div>

                <h3 className="font-heading text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                  First Prize
                </h3>

                <div className="my-6">
                  <div className="font-heading text-5xl sm:text-7xl font-black gold-gradient-text tracking-tight">
                    ₹70,000
                  </div>
                  <p className="text-amber-300/90 text-sm font-semibold tracking-wider uppercase mt-1">
                    Cash Prize + Magnificent Champion Trophy + Gold Medals
                  </p>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  The crowning glory for the best tennis ball cricket squad in Visakhapatnam.
                  Includes permanent trophy recognition, player medals, and live broadcast honors.
                </p>
              </div>

              <div className="pt-4 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/trophy.jpg"
                    alt="Official Trophy"
                    className="w-12 h-12 rounded-xl object-cover border border-amber-400/40 shadow-md"
                  />
                  <div>
                    <div className="text-xs font-bold text-white uppercase">Official Trophy</div>
                    <div className="text-[11px] text-amber-400">Awarded on Match Day Final</div>
                  </div>
                </div>

                <button
                  onClick={onOpenTeamModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading transition-all shadow-md cursor-pointer"
                >
                  Enter Your Team →
                </button>
              </div>
            </div>
          </div>

          {/* Runner-up Prize - 30,000 (Electric Blue/Silver Prestige Card) */}
          <div className="lg:col-span-5 relative group rounded-3xl p-1 bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-700 shadow-xl shadow-sky-500/10 transform transition-all duration-300 hover:scale-[1.01]">
            <div className="h-full bg-gradient-to-b from-[#09142b] to-[#060c1c] rounded-[22px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500 text-slate-950 text-xs font-black uppercase tracking-wider font-heading">
                    <Medal className="w-3.5 h-3.5" />
                    Runners-Up
                  </span>
                  <span className="text-xs font-bold text-sky-400 tracking-widest uppercase">
                    Finalists
                  </span>
                </div>

                <h3 className="font-heading text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                  Runner-Up Prize
                </h3>

                <div className="my-6">
                  <div className="font-heading text-4xl sm:text-6xl font-black text-white tracking-tight">
                    <span className="text-sky-300">₹30,000</span>
                  </div>
                  <p className="text-sky-200/90 text-sm font-semibold tracking-wider uppercase mt-1">
                    Cash Prize + Runner-up Trophy + Medals
                  </p>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Awarded to the tournament grand final runner-up squad celebrating their outstanding
                  campaign, grit, and competitive spirit.
                </p>
              </div>

              <div className="pt-4 border-t border-sky-500/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Full squad medals & runner-up trophy
                </span>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Guaranteed Cash
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section C & D Highlights Bar for Individual Awards */}
        <div id="tournament" className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-xl sm:text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Tournament Individual Honors
            </h3>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              ₹3,500 Cash Each + Trophy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Best Batsman Card */}
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 hover:border-amber-400/50 transition-all group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                Batting Masterclass
              </div>
              <h4 className="font-heading text-2xl font-black text-white uppercase">
                Best Batsman
              </h4>
              <div className="font-heading text-3xl font-extrabold text-amber-400 my-2">
                ₹3,500
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Awarded to the top run-getter with highest strike rate & boundary impact.
              </p>
            </div>

            {/* Best Bowler Card */}
            <div className="glass-panel p-6 rounded-2xl border border-red-500/20 hover:border-red-400/50 transition-all group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1">
                Bowling Supremacy
              </div>
              <h4 className="font-heading text-2xl font-black text-white uppercase">
                Best Bowler
              </h4>
              <div className="font-heading text-3xl font-extrabold text-red-400 my-2">
                ₹3,500
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Awarded to the leading wicket-taker with best economy and bowling strike rate.
              </p>
            </div>

            {/* Best Fielder Card */}
            <div className="glass-panel p-6 rounded-2xl border border-sky-500/20 hover:border-sky-400/50 transition-all group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-sky-400" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
                Fielding Excellence
              </div>
              <h4 className="font-heading text-2xl font-black text-white uppercase">
                Best Fielder
              </h4>
              <div className="font-heading text-3xl font-extrabold text-sky-400 my-2">
                ₹3,500
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Awarded for match-defining catches, direct-hit run-outs and ground saves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
