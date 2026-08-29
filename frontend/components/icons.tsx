import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

function LineIcon({
  className = "h-6 w-6",
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      {children}
    </svg>
  );
}

/** Triangle warning — same paths as patient-home EmergencyIcon. */
export function EmergencyIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M12 3 3 21h18L12 3z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="17.5" r="0.75" fill="currentColor" stroke="none" />
    </LineIcon>
  );
}

/** Map pin — same paths as recommend-list PinIcon. */
export function PinIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.25" />
    </LineIcon>
  );
}

/** Microphone — same paths as symptom-form MicIcon. */
export function MicIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4" />
    </LineIcon>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-6h4v6" />
    </LineIcon>
  );
}

export function CareIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />
    </LineIcon>
  );
}

export function FacilitiesIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M4 21V8l8-5 8 5v13" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 10h.01M12 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </LineIcon>
  );
}

export function LocationIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </LineIcon>
  );
}

export function SymptomsIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="7" y="4" width="10" height="16" rx="2" />
      <path d="M9 4.5h6v2H9z" />
      <path d="M9 11h6M9 15h4" />
    </LineIcon>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4.5 4.5" />
    </LineIcon>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M7 3h3.25l.85 4.15-2.2 1.2a12.5 12.5 0 0 0 6.75 6.75l1.2-2.2L21 13.75V17c0 2.2-1.8 4-4 4C8.6 21 3 15.4 3 7c0-2.2 1.8-4 4-4z" />
    </LineIcon>
  );
}

export function DirectionsIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M4.5 11.5 20 4l-7.5 15.5-1.5-6.5z" />
    </LineIcon>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </LineIcon>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M6 14.5 12 8.5l6 6" />
    </LineIcon>
  );
}
