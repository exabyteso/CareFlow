"use client";

import { useEffect } from "react";

/** Registers the installability-only service worker. No media devices. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);

  return null;
}
