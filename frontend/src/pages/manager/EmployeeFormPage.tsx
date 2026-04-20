import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PositionBadge } from '@/components/PositionBadge';
import { positionHue, initialsOf } from '@/lib/colors';
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

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  password: string;
};

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  password: '',
};

function fromEmployee(e: Employee): FormState {
  return {
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    phone: e.phone ?? '',
    position: e.position ?? '',
    password: '',
  };
}

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const isEdit = Boolean(id);

  const employeeQuery = useQuery({
    queryKey: ['employee', id],
    queryFn: () =>
      apiFetch<{ employee: Employee }>(`/employees/${id}`, { token }),
    enabled: isEdit,
  });

  if (isEdit && employeeQuery.isLoading) {
    return <p className="text-ink-3">Loading employee...</p>;
  }

  if (isEdit && employeeQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-display text-lg text-red-800">
          Could not load this employee.
        </p>
        <p className="mt-1 text-sm text-red-700">
          {employeeQuery.error instanceof ApiError
            ? `${employeeQuery.error.status} - ${employeeQuery.error.message}`
            : (employeeQuery.error as Error).message}
        </p>
      </div>
    );
  }

  // key forces a fresh form when switching between create/edit or between employees.
  return (
    <FormBody
      key={id ?? 'new'}
      id={id}
      initial={employeeQuery.data?.employee}
    />
  );
}

function FormBody({ id, initial }: { id?: string; initial?: Employee }) {
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromEmployee(initial) : EMPTY,
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? apiFetch<{ employee: Employee }>(`/employees/${id}`, {
            method: 'PUT',
            token,
            body: buildEditPayload(form),
          })
        : apiFetch<{ employee: Employee }>('/employees', {
            method: 'POST',
            token,
            body: buildCreatePayload(form),
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['employee', id] });
      }
      navigate('/manager/employees');
    },
  });

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
    <div className="space-y-5">
      <Link
        to="/manager/employees"
        className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12.5px] font-medium text-ink-3 transition-colors hover:text-ink"
      >
        <ChevronLeft size={14} />
        Back to employees
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        {/* Left: heading + form */}
        <div>
          <p className="mb-2 text-[12px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
            {isEdit
              ? `Editing · ${form.firstName} ${form.lastName}`.trim()
              : 'New employee'}
          </p>
          <h1 className="pb-3 font-display text-[34px] leading-[1.08] text-ink sm:text-[40px] md:text-[48px]">
            {isEdit ? (
              'Update details'
            ) : (
              <>
                Add someone to the <i className="text-terracotta">team</i>.
              </>
            )}
          </h1>

          <form
            onSubmit={onSubmit}
            className="mt-8 grid grid-cols-2 gap-4.5"
            style={{ gap: 18 }}
          >
            <Field label="First name" required colSpan={1}>
              <Input
                value={form.firstName}
                onChange={(v) => update('firstName', v)}
                placeholder="e.g. Eva"
                autoFocus
                required
              />
            </Field>

            <Field label="Last name" required colSpan={1}>
              <Input
                value={form.lastName}
                onChange={(v) => update('lastName', v)}
                placeholder="e.g. Larsson"
                required
              />
            </Field>

            <Field label="Email" required colSpan={2}>
              <Input
                type="email"
                value={form.email}
                onChange={(v) => update('email', v)}
                placeholder="name@sundsgarden.se"
                required
              />
            </Field>

            <Field label="Phone" colSpan={1}>
              <Input
                value={form.phone}
                onChange={(v) => update('phone', v)}
                placeholder="+46 ..."
              />
            </Field>

            <Field label="Position" colSpan={1}>
              <Input
                value={form.position}
                onChange={(v) => update('position', v)}
                placeholder="e.g. Waiter, Head Waiter, Runner..."
              />
            </Field>

            <Field
              label={
                isEdit ? 'Password (leave blank to keep current)' : 'Password'
              }
              required={!isEdit}
              colSpan={2}
            >
              <Input
                type="password"
                value={form.password}
                onChange={(v) => update('password', v)}
                placeholder={
                  isEdit ? 'Leave blank to keep the current password' : ''
                }
                required={!isEdit}
                mono
              />
            </Field>

            {errorMessage && (
              <p className="col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <div className="col-span-2 mt-4 flex gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => navigate('/manager/employees')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending}
                className="h-12 flex-1 text-[15px]"
              >
                <Check size={16} />
                {mutation.isPending
                  ? 'Saving...'
                  : isEdit
                    ? 'Save changes'
                    : 'Create'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right: live preview */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
            Live preview
          </p>
          <PreviewCard form={form} />
        </aside>
      </div>
    </div>
  );
}

type FieldProps = {
  label: ReactNode;
  required?: boolean;
  colSpan: 1 | 2;
  children: ReactNode;
};

function Field({ label, required, colSpan, children }: FieldProps) {
  return (
    <label className={`block space-y-1.5 ${colSpan === 2 ? 'col-span-2' : ''}`}>
      <span className="block text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
        {label}
        {required && <span className="ml-1.5 text-terracotta">required</span>}
      </span>
      {children}
    </label>
  );
}

type InputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
  mono?: boolean;
};

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  autoFocus,
  mono,
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      autoFocus={autoFocus}
      className={`block h-12 w-full rounded-lg border-[1.5px] border-line-soft bg-paper px-4 text-sm text-ink transition-colors focus:border-ink focus:ring-4 focus:ring-bg-3 focus:outline-none ${mono ? 'font-mono' : 'font-sans'}`}
    />
  );
}

function PreviewCard({ form }: { form: FormState }) {
  const initials = initialsOf(form.firstName, form.lastName) || '?';
  const hue = form.position ? positionHue(form.position) : undefined;

  return (
    <div
      className="rounded-2xl border-[1.5px] border-line-soft p-7"
      style={{
        background:
          'linear-gradient(180deg, var(--paper) 0%, var(--bg-2) 100%)',
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-[84px] w-[84px] items-center justify-center rounded-full font-display text-[32px] italic"
          style={
            hue !== undefined
              ? {
                  background: `oklch(0.88 0.07 ${hue})`,
                  color: `oklch(0.32 0.12 ${hue})`,
                }
              : {
                  background: 'var(--terracotta-soft)',
                  color: '#7a2505',
                }
          }
        >
          {initials}
        </div>
        {form.position && <PositionBadge position={form.position} size="md" />}
      </div>

      <div className="mt-5">
        <div className="font-display text-[32px] leading-none tracking-tight text-ink">
          {form.firstName || 'First'} {form.lastName || 'Last'}
        </div>
        <div className="mt-1.5 font-mono text-[12px] text-ink-3">
          {form.email || 'email@sundsgarden.se'}
        </div>
      </div>

      <div className="my-5 h-px bg-line-soft" />

      <div className="grid grid-cols-2 gap-3.5">
        <Pair label="Phone" value={form.phone || '—'} />
        <Pair label="Position" value={form.position || '—'} />
        <Pair label="Password" value={form.password || '•••••'} mono />
      </div>
    </div>
  );
}

function Pair({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold tracking-[0.1em] text-ink-3 uppercase">
        {label}
      </div>
      <div className={`text-[13px] text-ink ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}

// --- payload builders -------------------------------------------------------

function buildCreatePayload(form: FormState) {
  return {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    password: form.password,
    ...(form.phone ? { phone: form.phone } : {}),
    ...(form.position ? { position: form.position } : {}),
  };
}

function buildEditPayload(form: FormState) {
  // Empty phone/position get cleared with null. Empty password is left alone.
  const payload: Record<string, string | null> = {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: form.phone || null,
    position: form.position || null,
  };
  if (form.password) payload.password = form.password;
  return payload;
}
