import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/Logo';

const HOME_FOR_ROLE = {
  EMPLOYER: '/manager/employees',
  EMPLOYEE: '/staff/availability',
} as const;

export function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@company.com');
  const [password, setPassword] = useState('password123');

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (loggedInUser) => {
      navigate(HOME_FOR_ROLE[loggedInUser.role], { replace: true });
    },
  });

  if (isAuthenticated && user) {
    return <Navigate to={HOME_FOR_ROLE[user.role]} replace />;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const errorMessage = mutation.error
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : (mutation.error as Error).message
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-12 text-ink">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <LogoMark size={36} />
          <span className="font-display text-[22px]">Sundsgården</span>
        </div>

        <div className="mb-7 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
            Welcome back
          </p>
          <h1 className="mt-3 font-display text-[40px] leading-tight text-ink">
            Sign in to your <i className="text-terracotta">dashboard</i>.
          </h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="block h-12 w-full rounded-lg border-[1.5px] border-line-soft bg-paper px-4 font-sans text-sm text-ink transition-colors focus:border-ink focus:ring-4 focus:ring-bg-3 focus:outline-none"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="block h-12 w-full rounded-lg border-[1.5px] border-line-soft bg-paper px-4 font-sans text-sm text-ink transition-colors focus:border-ink focus:ring-4 focus:ring-bg-3 focus:outline-none"
            />
          </Field>

          {errorMessage && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending}
            className="mt-2 h-12 w-full text-[15px]"
          >
            {mutation.isPending ? (
              'Signing in...'
            ) : (
              <>
                Sign in
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
