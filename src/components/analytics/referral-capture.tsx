"use client";

import { primeReferralAttributionAction } from "@/lib/analytics/actions";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** Stores ?ref= referral code for signup attribution (first-touch). */
export function ReferralCapture() {
  const params = useSearchParams();
  const ref = params.get("ref");
  const sent = useRef(false);

  useEffect(() => {
    if (!ref || sent.current) return;
    sent.current = true;
    void primeReferralAttributionAction(ref);
  }, [ref]);

  return null;
}
