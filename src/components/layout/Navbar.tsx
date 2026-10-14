import React, { useState, useEffect } from 'react'
import { Menu, X, Trophy, Phone, Search, Sparkles } from 'lucide-react'
import { TOURNAMENT_CONFIG } from '../../config/tournamentConfig'

interface NavbarProps {
  onOpenPlayerModal: () => void
  onOpenTeamModal: () => void
  onOpenLookupModal: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPlayerModal,
  onOpenTeamModal,
  onOpenLookupModal,
}) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Tournament', href: '#tournament' },
    { name: 'Prizes', href: '#prizes' },
    { name: 'Awards', href: '#awards' },
    { name: 'Facilities', href: '#facilities' },
    { name: 'Register', href: '#register' },
    { name: 'Contact', href: '#contact' },
  ]

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false)
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#060a14]/90 backdrop-blur-md border-b border-amber-500/20 py-3 shadow-2xl shadow-black/80'
          : 'bg-gradient-to-b from-[#060a14]/90 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Wordmark */}
          <a
            href="#home"
            className="flex items-center gap-3 group focus:outline-none"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('#home')
            }}
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 p-[1.5px] shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
              <div className="w-full h-full bg-[#070b16] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-amber-400/20 to-transparent opacity-60"></div>
                <Trophy className="w-5 h-5 text-amber-400 relative z-10 transition-transform group-hover:scale-110 duration-200" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-2xl font-black tracking-wider text-white">
                  NGPL
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  {TOURNAMENT_CONFIG.edition}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase hidden sm:block">
                Tennis Ball Cricket • Vizag
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick(link.href)
                }}
                className="text-sm font-semibold text-slate-300 hover:text-amber-400 transition-colors uppercase tracking-wider relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-amber-400 hover:after:w-full after:transition-all after:duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs & Admin Shortcut */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onOpenPlayerModal}
              className="px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-all shadow-sm cursor-pointer"
            >
              Player (₹149)
            </button>

            <button
              onClick={onOpenTeamModal}
              className="px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-heading shadow-md shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              Team Entry (₹12K)
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-amber-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070b16]/98 border-b border-amber-500/20 backdrop-blur-xl px-4 pt-3 pb-6 animate-fadeIn shadow-2xl">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick(link.href)
                }}
                className="px-3 py-2 text-base font-semibold text-slate-200 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors uppercase tracking-wider"
              >
                {link.name}
              </a>
            ))}

            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenPlayerModal()
                }}
                className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 text-amber-400 border border-amber-500/30 text-center"
              >
                Player (₹149)
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenTeamModal()
                }}
                className="w-full py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-center font-heading"
              >
                Team (₹12,000)
              </button>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
              <a
                href={TOURNAMENT_CONFIG.contacts[0].telLink}
                className="flex items-center gap-1.5 text-amber-400"
              >
                <Phone className="w-3.5 h-3.5" />
                {TOURNAMENT_CONFIG.contacts[0].displayNumber}
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenLookupModal()
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
              >
                <Search className="w-3.5 h-3.5" />
                Check Status
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
