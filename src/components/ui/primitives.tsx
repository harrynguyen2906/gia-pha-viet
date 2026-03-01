import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "parchment" | "panel" | "glass";
}

export function Card({ children, className, variant = "panel" }: CardProps) {
  const variants = {
    parchment: "card-parchment rounded-sm p-6 text-temple-stone",
    panel: "bg-panel-dark border border-border-muted rounded-sm p-6 text-parchment shadow-soft-glow",
    glass: "bg-bg-dark/60 border border-border-muted rounded-sm p-6 text-parchment backdrop-blur",
  };

  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "lacquer" | "gold" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  className,
  variant = "lacquer",
  size = "md",
  loading,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    lacquer: "btn-lacquer",
    gold: "btn-gold-shimmer",
    ghost: "border border-border-muted text-parchment/70 hover:text-parchment hover:border-antique-gold transition-colors",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm font-header",
        variants[variant],
        sizes[size],
        (loading || disabled) && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

interface BadgeProps {
  children: ReactNode;
  variant?: "gold" | "red" | "green" | "muted";
  className?: string;
}

export function Badge({ children, variant = "muted", className }: BadgeProps) {
  const variants = {
    gold: "bg-antique-gold/20 text-antique-gold border border-antique-gold/40",
    red: "bg-primary/20 text-red-300 border border-primary/40",
    green: "bg-green-900/40 text-green-400 border border-green-800",
    muted: "bg-border-muted/30 text-parchment/60 border border-border-muted/40",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-header uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="relative flex items-center my-4">
      <div className="flex-1 border-t border-border-muted" />
      {label && (
        <span className="mx-3 text-xs font-header text-parchment/40 uppercase tracking-widest">
          {label}
        </span>
      )}
      <div className="flex-1 border-t border-border-muted" />
    </div>
  );
}
