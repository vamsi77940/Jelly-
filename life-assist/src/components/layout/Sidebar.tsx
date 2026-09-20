import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAV_ITEMS } from './nav';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useProgressStore } from '@/store/useProgressStore';
import { computeLevel } from '@/lib/leveling';

export function Sidebar() {
  const location = useLocation();
  const name = useSettingsStore((s) => s.profile.name);
  const totalXp = useProgressStore((s) => s.totalXp());
  const { level } = computeLevel(totalXp);

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-base-border bg-base-panel/30 backdrop-blur-xl px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="relative group">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-60 blur-sm group-hover:opacity-100 transition duration-300" />
          <img
            src="/jelly-logo.png"
            alt="Jelly"
            className="relative w-9 h-9 rounded-xl object-cover border border-cyan-400/40 shadow-lg shadow-cyan-500/25"
          />
        </div>
        <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
          Jelly
        </span>
      </div>

      <nav className="flex flex-col gap-1 relative" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon, comingSoon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={label}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-accent-cyan/60 ${
                isActive ? 'text-white font-medium' : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-highlight"
                  className="absolute inset-0 bg-white/10 rounded-lg -z-10 border border-white/10 shadow-sm"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {comingSoon && (
                <span className="text-[10px] uppercase tracking-wide text-ink-faint border border-base-border rounded px-1.5 py-0.5">
                  soon
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <NavLink 
          to="/settings"
          aria-label="User Profile & Settings"
          className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-cyan/60"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-indigo flex items-center justify-center text-white font-medium text-lg shadow-glow-sm">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-primary truncate group-hover:text-accent-cyan transition-colors">
              {name || 'User'}
            </p>
            <p className="text-xs text-ink-muted truncate">Level {level}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
