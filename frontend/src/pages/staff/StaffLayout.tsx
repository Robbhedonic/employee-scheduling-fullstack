import { Calendar, ListChecks } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopChrome, type ChromeTab } from '@/components/TopChrome';
import { useAuth } from '@/lib/auth';

const TABS: (ChromeTab & { path: string })[] = [
  {
    id: 'availability',
    path: '/staff/availability',
    label: 'My availability',
    icon: <ListChecks size={14} />,
  },
  {
    id: 'schedule',
    path: '/staff/schedule',
    label: 'My schedule',
    icon: <Calendar size={14} />,
  },
];

export function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeTab =
    TABS.find((t) => pathname.startsWith(t.path))?.id ?? TABS[0].id;

  const handleTabChange = (id: string) => {
    const tab = TABS.find((t) => t.id === id);
    if (tab) navigate(tab.path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg text-ink">
      <TopChrome
        badge="Staff"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={{
          firstName: user!.email.split('@')[0],
          lastName: '',
        }}
        showUserDetails
        onLogout={handleLogout}
      />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
