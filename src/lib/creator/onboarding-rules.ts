import { zonedExclusiveEndToUtc } from "@/lib/timezone/instant";

export const CREATOR_INVITE_TIMEZONE = "Australia/Melbourne";
export const CREATOR_INVITE_MAX_DAYS = 90;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isInviteEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeInviteEmail(email));
}

/** Inclusive calendar date in Australia/Melbourne, valid through the end of that day. */
export function creatorInvitationExpiry(dateKey: string, now = new Date()): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error("Choose an expiry date.");
  }
  const expiresAt = zonedExclusiveEndToUtc(dateKey, CREATOR_INVITE_TIMEZONE);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now) {
    throw new Error("Choose an expiry date in the future.");
  }
  const latest = now.getTime() + CREATOR_INVITE_MAX_DAYS * 24 * 60 * 60 * 1000;
  if (expiresAt.getTime() > latest) {
    throw new Error("Invitations can last at most 90 days.");
  }
  return expiresAt;
}

export type InvitationPreviewState = "invalid" | "expired" | "used" | "revoked" | "ready";

export function invitationPreviewCopy(state: InvitationPreviewState): {
  title: string;
  body: string;
} {
  switch (state) {
    case "ready":
      return {
        title: "You're invited to Creator Studio",
        body: "This personal invite replaces the public application. Sign in with the email it was issued for, then accept it.",
      };
    case "used":
      return {
        title: "This invite has already been used",
        body: "Creator invites work once. Ask the admin who invited you if you need a new link.",
      };
    case "expired":
      return {
        title: "This invite has expired",
        body: "Ask the admin who invited you to send a new link.",
      };
    case "revoked":
      return {
        title: "This invite was revoked",
        body: "It can no longer grant Creator Studio access.",
      };
    default:
      return {
        title: "This invite link is not valid",
        body: "Check the link or ask the admin who invited you to send a new one.",
      };
  }
}

export type OrganicApplicationInput = {
  displayName: string;
  socialLink: string;
  coachingFocus: string;
  motivation: string;
};

export function validateOrganicApplication(input: OrganicApplicationInput): string | null {
  if (input.displayName.trim().length < 2) return "Enter a creator name.";
  if (!/^https?:\/\//i.test(input.socialLink.trim())) {
    return "Enter a public social profile link.";
  }
  if (input.coachingFocus.trim().length < 2) return "Enter your coaching focus.";
  if (input.motivation.trim().length < 10) {
    return "Tell us a little more about why you want to host challenges.";
  }
  return null;
}

export type ApplicantApplication = {
  status: string;
  verificationState: string | null;
  expiresAt: string | null;
  reviewedBy: string | null;
  reapplyPermitted: boolean;
  now?: Date;
};

export type ApplicantNextStep =
  | { kind: "form"; reapply: boolean }
  | { kind: "verify"; canRefreshCode: boolean }
  | { kind: "review" }
  | { kind: "rejected" };

export function verificationCodeExpired(
  expiresAt: string | null,
  verificationState: string | null,
  now = new Date(),
): boolean {
  if (verificationState === "expired") return true;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

/** What the applicant should see. Admin-rejected applications stay closed until permitted. */
export function applicantNextStep(app: ApplicantApplication | null): ApplicantNextStep {
  if (!app) return { kind: "form", reapply: false };
  const now = app.now ?? new Date();

  if (app.status === "rejected" && app.reviewedBy) {
    return app.reapplyPermitted ? { kind: "form", reapply: true } : { kind: "rejected" };
  }

  if (app.status === "awaiting_review" || app.verificationState === "verified") {
    return { kind: "review" };
  }

  const expired = verificationCodeExpired(app.expiresAt, app.verificationState, now);
  if (
    app.status === "pending_verification" ||
    app.status === "pending" ||
    (app.status === "rejected" && !app.reviewedBy)
  ) {
    return { kind: "verify", canRefreshCode: expired };
  }

  return { kind: "form", reapply: false };
}

export function applicantStatusCopy(step: ApplicantNextStep): { title: string; body: string } {
  switch (step.kind) {
    case "review":
      return {
        title: "Application in review",
        body: "We have your social verification. An admin will approve or decline Creator Studio. You can keep using Tavro as a member until then.",
      };
    case "rejected":
      return {
        title: "Application not approved",
        body: "You can apply again after an admin allows it. Your member account is unchanged.",
      };
    case "verify":
      return step.canRefreshCode
        ? {
            title: "Verification code expired",
            body: "Request a new code, add it to your public bio, and check again. A new code does not approve you.",
          }
        : {
            title: "Verify your social account",
            body: "Add the code to the public bio of the profile you submitted, or ask us to confirm a DM. An admin still approves Creator Studio after that.",
          };
    case "form":
      return step.reapply
        ? {
            title: "You can apply again",
            body: "An admin opened a new application. Submit your creator name, social profile, coaching focus, and motivation.",
          }
        : {
            title: "Apply to become a creator",
            body: "Free for creators. Public challenges and Creator Studio unlock after you verify your social account and an admin approves you.",
          };
  }
}

export type SetupChecklistInput = {
  profileComplete: boolean;
  profileHref: string;
  challengeCount: number;
  publishedCount: number;
  createHref: string;
  publishHref: string;
  shareHref: string | null;
  shared: boolean;
};

export type SetupChecklistStep = {
  id: "profile" | "create" | "publish" | "share";
  title: string;
  detail: string;
  href: string | null;
  done: boolean;
};

export function creatorSetupChecklist(input: SetupChecklistInput): SetupChecklistStep[] {
  return [
    {
      id: "profile",
      title: "Complete your creator profile",
      detail: "Name, photo, and a short bio so participants know who is hosting.",
      href: input.profileHref,
      done: input.profileComplete,
    },
    {
      id: "create",
      title: "Create your first challenge",
      detail: "Start from a template or a blank challenge. Nothing else is required first.",
      href: input.createHref,
      done: input.challengeCount > 0,
    },
    {
      id: "publish",
      title: "Publish the challenge",
      detail: "Publishing makes the free join link live.",
      href: input.publishHref,
      done: input.publishedCount > 0,
    },
    {
      id: "share",
      title: "Share the link with followers",
      detail: "Copy the challenge link into your bio, a story, or a message.",
      href: input.shareHref,
      done: input.shared,
    },
  ];
}
