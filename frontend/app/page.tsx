import type { Metadata } from "next";

import { MarketingHome } from "./marketing-home";

export const metadata: Metadata = {
  title: "CareFlow",
  description:
    "Kenya pretriage routing to a suitable facility. Care-seekers book. Hospitals keep the wait honest. This is not a diagnosis.",
};

export default function MarketingPage() {
  return <MarketingHome />;
}
