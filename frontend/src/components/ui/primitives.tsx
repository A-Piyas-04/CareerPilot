import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  HTMLAttributes,
  ReactNode,
} from "react";

import type { LucideIcon } from "lucide-react";

import { cn } from "./cn";

type Tone = "neutral" | "primary" | "accent" | "success" | "warning" | "danger";

const toneStyles: Record<Tone, string> = {
  neutral:
    "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)]",
  primary:
    "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
  accent: "border-transparent bg-[var(--accent)] text-white dark:text-[#10120f]",
  success:
    "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
  warning:
    "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
  danger: "border-transparent bg-[var(--danger-soft)] text-[var(--danger)]",
};

export function buttonClassName({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
} = {}) {
  return cn(
    "inline-flex min-w-0 items-center justify-center gap-2 rounded-full font-semibold transition duration-200 cp-focus disabled:cursor-not-allowed disabled:opacity-55",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-10 px-4 text-sm",
    size === "lg" && "h-12 px-5 text-sm",
    variant === "primary" &&
      "bg-[var(--foreground)] text-[var(--background)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)]",
    variant === "accent" &&
      "bg-[var(--accent)] text-white shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:brightness-105 dark:text-[#10120f]",
    variant === "secondary" &&
      "border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] shadow-sm hover:border-[var(--border-strong)] hover:bg-[var(--surface-subtle)]",
    variant === "ghost" &&
      "text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]",
    variant === "danger" &&
      "bg-[var(--danger)] text-white shadow-sm hover:brightness-105",
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
};

export function Button({
  className,
  size,
  variant,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ className, size, variant })}
      type={type}
      {...props}
    />
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "secondary" | "ghost" | "primary";
};

export function IconButton({
  children,
  className,
  label,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition duration-200 cp-focus disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" && "h-8 w-8",
        size === "md" && "h-10 w-10",
        size === "lg" && "h-12 w-12",
        variant === "secondary" &&
          "border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] shadow-sm hover:bg-[var(--surface-subtle)]",
        variant === "ghost" &&
          "text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]",
        variant === "primary" &&
          "bg-[var(--foreground)] text-[var(--background)] shadow-[var(--shadow-soft)]",
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
  interactive?: boolean;
};

export function Card({
  as: Component = "section",
  className,
  interactive,
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-glass)] shadow-[var(--shadow-soft)] backdrop-blur-xl",
        interactive &&
          "transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-strong)]",
        className,
      )}
      {...props}
    />
  );
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}

type TabsProps<T extends string> = {
  items: readonly { label: string; value: T; icon?: LucideIcon }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
};

export function Tabs<T extends string>({
  className,
  items,
  label,
  onChange,
  value,
}: TabsProps<T>) {
  return (
    <div
      aria-label={label}
      className={cn(
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] p-1",
        className,
      )}
      role="tablist"
    >
      {items.map(({ icon: Icon, label: itemLabel, value: itemValue }) => {
        const active = itemValue === value;

        return (
          <button
            aria-selected={active}
            className={cn(
              "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition cp-focus",
              active
                ? "bg-[var(--surface-raised)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
            key={itemValue}
            role="tab"
            type="button"
            onClick={() => onChange(itemValue)}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {itemLabel}
          </button>
        );
      })}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-glass)] p-8 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <h3 className="mt-4 text-base font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  icon: Icon,
  title,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)] shadow-[var(--shadow-soft)]">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
              {title}
            </h1>
          </div>
        </div>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function SectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

type StatCardProps = {
  helper: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: Tone;
};

export function StatCard({
  helper,
  icon: Icon,
  label,
  tone = "primary",
  value,
}: StatCardProps) {
  return (
    <Card as="article" className="group overflow-hidden p-5" interactive>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
            toneStyles[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
        {helper}
      </p>
    </Card>
  );
}

type DrawerProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

export function Drawer({ children, isOpen, onClose, title }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        type="button"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-strong)]">
        {title ? (
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        ) : null}
        {children}
      </aside>
    </div>
  );
}

type ModalProps = {
  actions?: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Modal({ actions, children, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        type="button"
        onClick={onClose}
      />
      <section className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-strong)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          {children}
        </div>
        {actions ? (
          <div className="mt-5 flex justify-end gap-2">{actions}</div>
        ) : null}
      </section>
    </div>
  );
}

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: "danger" | "primary";
};

export function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
  tone = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description}
    </Modal>
  );
}
