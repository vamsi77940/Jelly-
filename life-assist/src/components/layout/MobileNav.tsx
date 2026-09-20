import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './nav';

// Keep the bottom bar to the 5 highest-frequency modules; everything else
// (Calendar, Habits, Goals, Focus, Analytics, Settings) is one tap away via
// the Dashboard's "More" grid on mobile.
const PRIMARY = NAV_ITEMS.filter((item) =>
  ['/', '/tasks', '/notes', '/reminders', '/assistant'].includes(item.to)
);

export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-white/[0.08] bg-base-panel/60 backdrop-blur-glass pb-[env(safe-area-inset-bottom)] shadow-glass"
    >
      {PRIMARY.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2.5 px-3 text-[11px] ${
              isActive ? 'text-accent-cyan' : 'text-ink-muted'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
