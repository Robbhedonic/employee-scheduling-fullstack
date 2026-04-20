import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/Avatar';

export type ChromeTab = {
  id: string;
  label: string;
  icon?: ReactNode;
};

type Props = {
  badge: string;
  tabs: ChromeTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  user: { firstName: string; lastName: string; position?: string | null };
  showUserDetails?: boolean;
  onLogout?: () => void;
};

/**
 * Top app chrome - logo, role badge, nav tabs, user avatar, logout.
 * Used by both employer and employee layouts; tabs/badge differ per role.
 */
export function TopChrome({
  badge,
  tabs,
  activeTab,
  onTabChange,
  user,
  showUserDetails = false,
  onLogout,
}: Props) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line-soft bg-bg/80 px-4 py-3 backdrop-blur sm:px-8 sm:py-4">
      <div className="flex items-center gap-3 sm:gap-6">
        <Logo />
        <span className="hidden rounded-full bg-bg-2 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase sm:inline">
          {badge}
        </span>
      </div>

      <nav className="flex items-center gap-1 rounded-full bg-bg-2 p-1">
        {tabs.map((t) => {
          const active = t.id === activeTab;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              aria-label={t.label}
              className={
                'flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-colors sm:px-4 ' +
                (active
                  ? 'bg-paper text-ink shadow-sm'
                  : 'text-ink-3 hover:text-ink')
              }
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        {showUserDetails ? (
          <div className="flex items-center gap-2.5">
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              position={user.position}
            />
            <div className="hidden leading-tight sm:block">
              <div className="text-[13px] font-medium text-ink">
                {user.firstName}
              </div>
              {user.position && (
                <div className="text-[11px] text-ink-3">{user.position}</div>
              )}
            </div>
          </div>
        ) : (
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            position={user.position}
          />
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-soft px-2.5 text-[12.5px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper sm:px-3"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        )}
      </div>
    </header>
  );
}
