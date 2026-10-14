import React from 'react'
import { UserCheck, Users, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

interface RegistrationCardsProps {
  onOpenPlayerModal: () => void
  onOpenTeamModal: () => void
}

export const RegistrationCards: React.FC<RegistrationCardsProps> = ({
  onOpenPlayerModal,
  onOpenTeamModal,
}) => {
  return (
    <section id="register" className="py-24 bg-[#060b17] relative overflow-hidden">
      {/* Stadium floodlight radial glows */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Official Registration Portal
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            CHOOSE YOUR <span className="gold-gradient-text">ENTRY PATH</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Whether you are an individual star seeking a franchise draft or a captain leading a championship-ready squad,
            NGPL Season 1 welcomes you.
          </p>
        </div>

        {/* Two Unmistakable Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Card 1: PLAYER REGISTRATION */}
          <div className="relative group rounded-3xl p-1 bg-gradient-to-b from-slate-700/60 via-slate-800/40 to-slate-900/80 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50">
            <div className="h-full bg-gradient-to-b from-[#0b1329] to-[#070b16] rounded-[22px] p-7 sm:p-9 flex flex-col justify-between border border-slate-700/60">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold uppercase tracking-wider">
                    Individual Entry
                  </span>
                </div>

                <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
                  Single Participant
                </div>
                <h3 className="font-heading text-3xl font-black text-white uppercase tracking-wide">
                  PLAYER REGISTRATION
                </h3>

                <div className="my-6 p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20">
                  <span className="text-xs text-slate-400 uppercase font-medium">Registration Fee</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading text-5xl font-black text-amber-400 tracking-tight">
                      ₹149
                    </span>
                    <span className="text-xs text-slate-400">/ per individual</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 text-sm text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>For individual cricketers without a pre-formed team</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Allotted into official draft pool / combined franchise squads</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Eligible for all individual awards (₹3,500 each) and match recognition</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Complimentary snacks, energy drinks & live match telecast coverage</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={onOpenPlayerModal}
                  className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-heading transition-all shadow-lg shadow-black/50 hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Register as Player</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[11px] text-slate-400 mt-2.5">
                  Takes less than 2 minutes • Instant UPI payment summary
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: TEAM ENTRY */}
          <div className="relative group rounded-3xl p-1 bg-gradient-to-b from-amber-400 via-amber-600 to-yellow-600 shadow-2xl shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="h-full bg-gradient-to-b from-[#0c1838] to-[#070e20] rounded-[22px] p-7 sm:p-9 flex flex-col justify-between border border-amber-400/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider font-heading">
                    Full Squad Slot
                  </span>
                </div>

                <div className="text-xs font-bold uppercase tracking-widest text-amber-300 mb-1">
                  Complete Squad Entry
                </div>
                <h3 className="font-heading text-3xl font-black text-white uppercase tracking-wide">
                  TEAM ENTRY
                </h3>

                <div className="my-6 p-4 rounded-2xl bg-[#09142e] border border-amber-400/40">
                  <span className="text-xs text-amber-300 uppercase font-medium">Team Entry Fee</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading text-5xl font-black text-white tracking-tight">
                      <span className="gold-gradient-text">₹12,000</span>
                    </span>
                    <span className="text-xs text-slate-300">/ per entire team</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 text-sm text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Guaranteed tournament slot with official group stage fixtures</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Captain registers complete 11 to 16 player squad roster</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Direct contention for ₹70,000 Champions & ₹30,000 Runner-up prizes</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Live broadcast, certified match umpires, and full team refreshments</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={onOpenTeamModal}
                  className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-heading transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Register Your Team</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
                <p className="text-center text-[11px] text-amber-200/90 mt-2.5 font-medium">
                  Limited team slots available • Lock your team slot today
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
