import { Calendar, Grid3x3, Users } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopChrome, type ChromeTab } from '@/components/TopChrome';
import { useAuth } from '@/lib/auth';

const TABS: (ChromeTab & { path: string })[] = [
  {
    id: 'employees',
    path: '/manager/employees',
    label: 'Employees',
    icon: <Users size={14} />,
  },
  {
    id: 'schedule',
    path: '/manager/schedule',
    label: 'Schedule',
    icon: <Calendar size={14} />,
  },
  {
    id: 'availability',
    path: '/manager/availability',
    label: 'Availability',
    icon: <Grid3x3 size={14} />,
  },
];

export function ManagerLayout() {
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
        badge="Manager"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={{
          firstName: user!.email.split('@')[0],
          lastName: '',
        }}
        onLogout={handleLogout}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
