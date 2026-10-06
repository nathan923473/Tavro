export const CONTENT_REPORT_REASONS = [
  { value: "nudity_sexual", label: "Nudity or sexual content" },
  { value: "violence_gore", label: "Violence or gore" },
  { value: "harassment_hate", label: "Harassment or hate" },
  { value: "spam_scam", label: "Spam or scam" },
  { value: "other", label: "Something else" },
] as const;

export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number]["value"];

export const REPORTED_CONTENT_TYPES = [
  "profile_avatar",
  "creator_avatar",
  "creator_banner",
  "challenge_cover",
  "challenge_gallery_photo",
  "creator_announcement_image",
  "challenge_message",
  "group_message",
] as const;

export type ReportedContentType = (typeof REPORTED_CONTENT_TYPES)[number];

export type SubmitContentReportInput = {
  contentType: ReportedContentType;
  contentId: string;
  reportedUserId: string;
  reason: ContentReportReason;
  explanation?: string;
};

export type ContentReportRow = {
  id: string;
  reporterId: string;
  reportedUserId: string;
  contentType: ReportedContentType;
  contentId: string;
  reason: ContentReportReason;
  explanation: string | null;
  status: "pending" | "reviewed" | "dismissed";
  adminNotes: string | null;
  createdAt: string;
  reporterDisplayName: string | null;
  reportedDisplayName: string | null;
};
