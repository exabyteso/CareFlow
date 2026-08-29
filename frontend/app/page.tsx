import type { Metadata } from "next";

import { VoiceLanding } from "./voice-landing";

export const metadata: Metadata = {
  title: "CareFlow",
  description:
    "Kenya pretriage routing to a suitable facility. This is not a diagnosis.",
};

export default function RolePickerPage() {
  return <VoiceLanding />;
}
