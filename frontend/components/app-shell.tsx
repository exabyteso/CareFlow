import Link from "next/link";

import { ui } from "@/lib/ui";

type AppShellProps = {
  children: React.ReactNode;
  /** Care-seeker is phone-width; hospital desk may be slightly wider. */
  width?: "phone" | "desk";
};

export function AppShell({ children, width = "phone" }: AppShellProps) {
  const maxWidth = width === "desk" ? "max-w-xl" : "max-w-md";

  return (
    <div
      className={`mx-auto min-h-dvh w-full ${maxWidth} px-4 py-6 text-cf-ink sm:px-6`}
    >
      {children}
    </div>
  );
}

export function BackToRolePicker({
  label = "Back to role picker",
}: {
  label?: string;
} = {}) {
  return (
    <p className="mb-6">
      <Link href="/" className={ui.textLink}>
        {label}
      </Link>
    </p>
  );
}
