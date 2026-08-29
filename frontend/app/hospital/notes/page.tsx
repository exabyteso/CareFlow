import { Suspense } from "react";

import { HospitalChrome } from "../hospital-ui";

import { HospitalNotesContent } from "./notes-content";

export default function HospitalNotesPage() {
  return (
    <Suspense
      fallback={
        <HospitalChrome title="CareFlow — Notes" subtitle="Loading notes…">
          <p className="px-4 py-10 text-sm text-cf-muted md:px-5">Loading notes…</p>
        </HospitalChrome>
      }
    >
      <HospitalNotesContent />
    </Suspense>
  );
}
