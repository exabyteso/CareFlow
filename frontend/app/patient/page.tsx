import type { Metadata } from "next";

import { PatientHome } from "./patient-home";

export const metadata: Metadata = {
  title: "Care-seeker",
  description:
    "Care-seeker pretriage. This is not a diagnosis. If this is an emergency, call 999 or go now.",
};

export default function CareSeekerPage() {
  return <PatientHome />;
}
