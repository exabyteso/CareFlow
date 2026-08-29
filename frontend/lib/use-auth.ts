"use client";

import { useEffect, useState } from "react";

import { subscribeAuth } from "./auth";

export function useAuth(): { uid: string | null; ready: boolean } {
  const [uid, setUid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return subscribeAuth((next) => {
      setUid(next);
      setReady(true);
    });
  }, []);

  return { uid, ready };
}
