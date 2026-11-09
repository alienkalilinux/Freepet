'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="app-shell">{children}</div>;
}

export function PageContainer({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`mx-auto px-4 py-10 sm:px-6 sm:py-16 ${
        wide ? 'max-w-[1200px]' : 'max-w-[960px]'
      }`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="display-title mt-3 text-3xl sm:text-4xl lg:text-[2.9rem]">{title}</h1>
        {description ? <p className="lede mt-3 text-base sm:text-lg">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function SurfaceCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`surface-card ${className}`}>{children}</div>;
}

export function SurfaceSoft({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`surface-soft ${className}`}>{children}</div>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-content-faint">{hint}</p> : null}
    </div>
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`field ${className}`} />;
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`field ${className}`} />;
}

export function SelectField({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`field ${className}`}>
      {children}
    </select>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'leaf' | 'ghost' | 'secondary';
};

export function ActionButton({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  const tone =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'leaf'
        ? 'btn-leaf'
        : variant === 'secondary'
          ? 'btn-secondary'
          : 'btn-ghost';
  return <button {...props} type={type} className={`btn ${tone} px-6 py-2.5 ${className}`} />;
}

export function AlertBox({
  tone,
  children,
}: {
  tone: 'danger' | 'success' | 'warning';
  children: ReactNode;
}) {
  return <div className={`alert alert-${tone}`}>{children}</div>;
}

export function ToneBadge({
  tone,
  children,
}: {
  tone: 'leaf' | 'amber' | 'rose' | 'neutral' | 'info';
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function ModalShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-mask flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" className={`modal-panel modal-scroll w-full ${wide ? 'max-w-lg' : 'max-w-sm'}`}>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <SurfaceCard className="px-6 py-14 text-center">
      <h2 className="heading-sub">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-content-secondary">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </SurfaceCard>
  );
}

export function LoadingScreen({ label }: { label: string }) {
  return (
    <PageShell>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-card flex items-center gap-3 px-7 py-5">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent-line border-t-transparent" aria-hidden="true" />
          <span className="font-semibold text-content-primary">{label}</span>
        </div>
      </div>
    </PageShell>
  );
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="surface-sunken grid grid-cols-2 gap-1 rounded-[10px] p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`flex min-h-[32px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
              active
                ? 'bg-surface-raised text-content-primary shadow-1'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StatTile({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
}) {
  return (
    <SurfaceCard className="flex items-center gap-4 p-5">
      <span className="icon-well h-12 w-12 rounded-2xl">
        {icon}
      </span>
      <span>
        <span className="display-title block text-2xl leading-none">{value}</span>
        <span className="lede mt-1 block text-sm">{label}</span>
      </span>
    </SurfaceCard>
  );
}
