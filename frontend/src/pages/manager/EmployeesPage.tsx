import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { PositionBadge } from '@/components/PositionBadge';
import { Button } from '@/components/ui/button';
import { ApiError, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string | null;
  avatar: string | null;
};

export function EmployeesPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch<{ employees: Employee[] }>('/employees', { token }),
  });

  const employees = useMemo(
    () => employeesQuery.data?.employees ?? [],
    [employeesQuery.data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q),
    );
  }, [employees, query]);

  return (
    <div className="space-y-7">
      <Hero count={employees.length} loading={employeesQuery.isLoading} />

      <div className="relative w-full max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3"
        />
        <input
          type="search"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block h-11 w-full rounded-lg border-[1.5px] border-line-soft bg-paper pr-4 pl-10 text-sm text-ink transition-colors focus:border-ink focus:ring-4 focus:ring-bg-3 focus:outline-none"
        />
      </div>

      {employeesQuery.isError ? (
        <ErrorState error={employeesQuery.error} />
      ) : employeesQuery.isLoading ? (
        <SkeletonGrid />
      ) : (
        <Grid employees={filtered} hadAny={employees.length > 0} />
      )}
    </div>
  );
}

function Hero({ count, loading }: { count: number; loading: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0 flex-[1_1_420px]">
        <p className="mb-2 text-[12px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
          {loading
            ? 'Loading...'
            : `${count} ${count === 1 ? 'person' : 'people'}`}
        </p>
        <h1 className="font-display text-[56px] leading-[1.08] text-ink">
          Everyone on the <i className="text-terracotta">team</i>.
        </h1>
      </div>
      <Button onClick={() => navigate('/manager/employees/new')} size="lg">
        <Plus size={16} />
        Register employee
      </Button>
    </div>
  );
}

function Grid({
  employees,
  hadAny,
}: {
  employees: Employee[];
  hadAny: boolean;
}) {
  if (!hadAny) {
    return <EmptyState />;
  }
  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
      {employees.map((emp) => (
        <EmployeeCard key={emp.id} employee={emp} />
      ))}
      <RegisterTile />
    </div>
  );
}

function EmployeeCard({ employee }: { employee: Employee }) {
  return (
    <Link
      to={`/manager/employees/${employee.id}`}
      className="group flex min-h-[220px] flex-col gap-3.5 rounded-2xl border-[1.5px] border-line-soft bg-paper p-5 transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-md"
    >
      <Avatar
        firstName={employee.firstName}
        lastName={employee.lastName}
        position={employee.position}
        size={56}
      />
      <div>
        <div className="font-display text-[22px] leading-[1.1] tracking-tight text-ink">
          {employee.firstName} {employee.lastName}
        </div>
        <div className="mt-1 font-mono text-[11px] text-ink-3">
          ID · {employee.id.slice(0, 8).toUpperCase()}
        </div>
      </div>
      <div className="mt-auto">
        <PositionBadge position={employee.position} />
      </div>
    </Link>
  );
}

function RegisterTile() {
  return (
    <Link
      to="/manager/employees/new"
      className="group flex min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-line-soft text-ink-3 transition-colors hover:border-ink hover:text-ink"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-dashed border-current">
        <Plus size={16} />
      </span>
      <span className="text-[13px] font-medium">Register new</span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-[1.5px] border-dashed border-line-soft p-12 text-center">
      <p className="font-display text-2xl text-ink">No team members yet.</p>
      <p className="mt-2 text-sm text-ink-3">
        Add your first employee to start scheduling.
      </p>
      <div className="mt-5">
        <Link
          to="/manager/employees/new"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-[13px] font-medium text-paper transition-colors hover:bg-terracotta"
        >
          <Plus size={14} />
          Register employee
        </Link>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="min-h-[220px] animate-pulse rounded-2xl border-[1.5px] border-line-soft bg-bg-2"
        />
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError
      ? `${error.status} - ${error.message}`
      : (error as Error).message;
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <p className="font-display text-lg text-red-800">
        Could not load employees.
      </p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  );
}
