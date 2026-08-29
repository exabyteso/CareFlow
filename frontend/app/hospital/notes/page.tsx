import { Suspense } from "react";

import { AppShell, BackToRolePicker } from "@/components/app-shell";

import { HospitalNotesContent } from "./notes-content";

export default function HospitalNotesPage() {
  return (
    <Suspense
      fallback={
        <AppShell width="desk">
          <BackToRolePicker />
          <p className="mt-6 text-sm text-cf-muted">Loading notes…</p>
        </AppShell>
      }
    >
      <HospitalNotesContent />
    </Suspense>
  );
}
