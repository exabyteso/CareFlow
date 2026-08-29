import Link from "next/link";
import type { ReactNode } from "react";

export function HospitalHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between bg-[#1e63b8] px-5 pb-4 pt-5 text-white shadow-sm">
      <div>
        <p className="text-[17px] font-semibold tracking-tight">{title}</p>
        <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>
      </div>
      {right}
    </header>
  );
}

export function HospitalNav() {
  return (
    <nav className="flex flex-wrap items-center gap-3 text-xs text-white/80">
      <Link href="/hospital" className="hover:text-white">
        Station
      </Link>
      <Link href="/hospital/config" className="hover:text-white">
        Facility config
      </Link>
      <Link href="/hospital/notes" className="hover:text-white">
        Notes
      </Link>
      <Link href="/" className="hover:text-white">
        Role picker
      </Link>
    </nav>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[#8fa0af]">
      {children}
    </p>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#dce4ec] bg-white p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        color,
        background: `${color}1A`,
        border: `1px solid ${color}55`,
      }}
    >
      {children}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const variants = {
    primary: "bg-[#1e63b8] text-white border border-[#1e63b8] hover:bg-[#154a8c]",
    ghost:
      "bg-transparent text-[#16212c] border border-[#c3ceda] hover:bg-[#eaf1f8]",
    danger: "bg-[#c63a4d] text-white border border-[#c63a4d] hover:brightness-110",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-11 rounded-lg px-3 text-sm font-medium transition-colors ${variants[variant]} ${
        disabled ? "cursor-not-allowed opacity-40" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return "Request failed.";
}
