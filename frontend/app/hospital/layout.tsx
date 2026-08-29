import type { Metadata } from "next";
import type { ReactNode } from "react";

import { HospitalAuthGate } from "./hospital-auth-gate";
import "./hospital.css";

export const metadata: Metadata = {
  title: "Hospital desk",
  description: "Hospital station for this facility only.",
};

export default function HospitalLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="cf-hospital">
      <HospitalAuthGate>{children}</HospitalAuthGate>
    </div>
  );
}
