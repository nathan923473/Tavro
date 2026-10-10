import { getAppBaseUrl } from "@/lib/site-url";

export const CREATOR_APP_ATTR_COOKIE = "tavro_creator_app_v1";

export type CreatorApplicationSource =
  | "creator_landing"
  | "creator_referral"
  | "direct"
  | "unknown";

export type CreatorApplicationAttribution = {
  referredByUserId?: string;
  source: CreatorApplicationSource;
  ts?: number;
};

export function creatorsLandingPath(referralCode?: string | null): string {
  const base = "/creators";
  if (!referralCode?.trim()) return base;
  return `${base}?cref=${encodeURIComponent(referralCode.trim())}`;
}

export function creatorsLandingAbsoluteUrl(referralCode?: string | null): string {
  return `${getAppBaseUrl()}${creatorsLandingPath(referralCode)}`;
}

export function applicationSourceLabel(source: string | null | undefined): string {
  switch (source) {
    case "creator_referral":
      return "Creator referral link";
    case "creator_landing":
      return "Creator landing page";
    case "direct":
      return "Direct / other";
    default:
      return "Unknown";
  }
}
