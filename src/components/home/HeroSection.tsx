import React from 'react'
import {
  MapPin,
  ChevronDown,
  Trophy,
  Users,
  UserCheck,
  ShieldCheck,
  Flame,
} from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'

interface HeroSectionProps {
  onOpenPlayerModal: () => void
  onOpenTeamModal: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenPlayerModal,
  onOpenTeamModal,
}) => {
  return (
    <section
      id="home"
      className="relative min-h-[95vh] flex items-center justify-center pt-28 pb-16 overflow-hidden"
    >
      {/* Background Cinematic Image with Stadium Floodlight Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-cricket.jpg"
          alt="NGPL Cricket Tournament Stadium Atmosphere"
          className="w-full h-full object-cover object-center transform scale-105 filter brightness-[0.42] contrast-[1.12]"
        />
        {/* Gradients to blend smoothly into deep navy/black theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#060a14]/75 to-[#060a14]/85"></div>
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-black/80 pointer-events-none"></div>

        {/* Stadium Light Streaks */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px] pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Season 1 Badge & Location */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-amber-400/40 backdrop-blur-md mb-6 shadow-lg shadow-amber-500/10 animate-fade-in">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{TOURNAMENT_CONFIG.edition}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
          <div className="flex items-center gap-1 text-slate-300 font-bold text-xs uppercase tracking-widest">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>{TOURNAMENT_CONFIG.location.city.toUpperCase()}</span>
          </div>
        </div>

        {/* Brand Headline Hierarchies */}
        <div className="space-y-2 mb-4">
          <p className="text-amber-400 text-sm sm:text-base md:text-lg font-bold tracking-[0.25em] uppercase font-heading drop-shadow-md">
            {TOURNAMENT_CONFIG.leagueName}
          </p>

          <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
            <span className="gold-gradient-text drop-shadow-[0_10px_25px_rgba(234,179,8,0.3)]">
              {TOURNAMENT_CONFIG.shortName}
            </span>
          </h1>

          <div className="inline-block relative">
            <h2 className="font-heading text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wide uppercase text-slate-100">
              TENNIS BALL CRICKET TOURNAMENT
            </h2>
            <div className="h-1 w-32 sm:w-48 mx-auto mt-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          </div>
        </div>

        {/* Hero Tagline */}
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-300 font-heading tracking-[0.2em] uppercase mb-8 drop-shadow">
          “{TOURNAMENT_CONFIG.heroTagline}”
        </p>

        {/* Quick Highlights Badge Pill */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-10 text-xs sm:text-sm text-slate-300 font-medium">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>₹70,000 Champion Prize</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Live Telecasting & Official Umpires</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping"></span>
            <span>Registration Open</span>
          </div>
        </div>

        {/* Two Primary Action CTAs */}
        <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {/* Player Registration CTA */}
          <button
            onClick={onOpenPlayerModal}
            className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0c1428]/90 border border-amber-500/40 hover:border-amber-400 transition-all duration-300 shadow-xl shadow-black/60 hover:shadow-amber-500/20 hover:-translate-y-1 cursor-pointer overflow-hidden text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <UserCheck className="w-4 h-4" />
              <span>Individual Draft Pool</span>
            </div>
            <span className="font-heading text-xl sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
              Register as Player
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-heading">
                ₹149
              </span>
              <span className="text-[11px] text-slate-400 font-medium">/ entry fee</span>
            </div>
            <span className="mt-2 text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
              Tap to open registration form →
            </span>
          </button>

          {/* Team Registration CTA */}
          <button
            onClick={onOpenTeamModal}
            className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 transition-all duration-300 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-1 cursor-pointer overflow-hidden text-center"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Full Squad Slot</span>
            </div>
            <span className="font-heading text-xl sm:text-2xl font-black text-slate-950">
              Register Your Team
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
                ₹12,000
              </span>
              <span className="text-[11px] text-slate-900 font-semibold">/ team entry</span>
            </div>
            <span className="mt-2 text-[11px] text-slate-900 font-bold">
              Captain & Squad Roster Entry →
            </span>
          </button>
        </div>

        {/* Scroll Indicator */}
        <a
          href="#tournament"
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors group"
          aria-label="Scroll down to tournament details"
        >
          <span className="text-[11px] uppercase tracking-widest font-semibold group-hover:tracking-wider transition-all">
            Scroll to explore tournament
          </span>
          <ChevronDown className="w-5 h-5 animate-bounce text-amber-400" />
        </a>
      </div>
    </section>
  )
}
