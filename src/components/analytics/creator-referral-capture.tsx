"use client";

import { primeCreatorApplicationAttributionAction } from "@/lib/creator/growth-actions";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** Stores ?cref= creator referral for creator application attribution (first-touch). */
export function CreatorReferralCapture() {
  const params = useSearchParams();
  const cref = params.get("cref");
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void primeCreatorApplicationAttributionAction(cref);
  }, [cref]);

  return null;
}
