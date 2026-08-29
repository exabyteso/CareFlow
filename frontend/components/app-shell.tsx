import { PatientTabBar } from "./patient-tab-bar";
import { PatientTopBar } from "./patient-top-bar";

type AppShellProps = {
  children: React.ReactNode;
  /** Care-seeker is phone-width; hospital desk may be slightly wider. */
  width?: "phone" | "desk";
  /** Care-seeker only. Landing (`/`) stays tab-free unless a caller opts in. */
  showPatientTabs?: boolean;
  /** Care-seeker chrome: logo left, signed-in profile right. */
  showTopBar?: boolean;
};

export function AppShell({
  children,
  width = "phone",
  showPatientTabs = false,
  showTopBar = false,
}: AppShellProps) {
  const maxWidth =
    width === "desk"
      ? "max-w-xl lg:max-w-7xl"
      : "max-w-md lg:max-w-7xl";
  const padding = showPatientTabs
    ? `px-4 pb-24 sm:px-6 lg:px-10 lg:pb-32 ${showTopBar ? "pt-5 lg:pt-8" : "pt-6 lg:pt-10"}`
    : "px-4 py-6 sm:px-6 lg:px-10 lg:py-10";

  return (
    <div className="min-h-dvh w-full text-cf-ink">
      {showTopBar ? <PatientTopBar /> : null}
      <div className={`mx-auto w-full ${maxWidth} ${padding}`}>{children}</div>
      {showPatientTabs ? <PatientTabBar /> : null}
    </div>
  );
}
