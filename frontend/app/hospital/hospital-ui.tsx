"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";
import { signOut } from "@/lib/auth";

const HEADER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/hospital", label: "Station" },
  { href: "/hospital/config", label: "Facility config" },
  { href: "/hospital/notes", label: "Notes" },
] as const;

const SIDEBAR_LINKS = [
  { href: "/", label: "Home" },
  { href: "/hospital", label: "Station" },
  { href: "/hospital/config", label: "Config" },
  { href: "/hospital/notes", label: "Notes" },
] as const;

function HospitalSignOut({ className = "" }: { className?: string } = {}) {
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`min-h-9 rounded-lg px-3 text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white ${className}`}
      onClick={() => void onSignOut()}
      disabled={busy}
    >
      Sign out
    </button>
  );
}

function navIsActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/hospital") {
    return pathname === "/hospital";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
    <header className="flex items-center justify-between bg-cf-primary px-5 pb-4 pt-5 text-white shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <BrandMark size={36} className="rounded-lg" />
        <div className="min-w-0">
          <p className="text-[17px] font-semibold tracking-tight">{title}</p>
          <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>
        </div>
      </div>
      {right}
    </header>
  );
}

/** Compact horizontal links for the header (small screens / existing station-desk). */
export function HospitalNav({ className = "" }: { className?: string } = {}) {
  return (
    <nav
      className={`flex flex-wrap items-center gap-3 text-xs text-white/80 ${className}`}
    >
      {HEADER_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-white">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/** Vertical sidebar for md+; used by HospitalChrome, not by existing station-desk. */
export function HospitalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden shrink-0 bg-cf-primary text-white md:flex md:w-56 md:flex-col lg:w-64">
      <div className="flex items-center gap-2.5 px-4 pt-5">
        <BrandMark size={32} className="rounded-lg" />
        <p className="text-sm font-semibold tracking-tight">CareFlow</p>
      </div>
      <nav className="flex flex-col gap-1 p-3 pt-6" aria-label="Hospital">
        {SIDEBAR_LINKS.map((link) => {
          const active = navIsActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10 ${
                active ? "bg-white/15 font-semibold text-white" : ""
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3 pb-5">
        <HospitalSignOut className="w-full text-left" />
      </div>
    </aside>
  );
}

export function HospitalChrome({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh md:flex">
      <HospitalSidebar />
      <div className="min-w-0 flex-1">
        <HospitalHeader
          title={title}
          subtitle={subtitle}
          right={
            <div className="flex items-center gap-3">
              <HospitalNav className="md:hidden" />
              <HospitalSignOut />
            </div>
          }
        />
        {children}
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-cf-muted">
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
      className={`rounded-xl border border-cf-line bg-white p-4 ${className}`}
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

export function KindPill({ kind }: { kind: "instant" | "appointment" }) {
  if (kind === "appointment") {
    return <Pill color="#b8790a">Appointment</Pill>;
  }
  return <Pill color="#1e63b8">Walk-in</Pill>;
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
    primary:
      "bg-cf-primary text-white border border-cf-primary hover:bg-cf-primary-hover",
    ghost:
      "bg-transparent text-cf-ink border border-cf-line hover:bg-cf-surface",
    danger:
      "bg-[#c63a4d] text-white border border-[#c63a4d] hover:brightness-110",
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
