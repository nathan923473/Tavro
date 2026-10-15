import type { ChallengeReportAcquisitionSource } from "@/types/challenge-report";

/** Creator-facing reports omit unknown / unrecorded acquisition buckets. */
export function acquisitionSourcesForCreatorReport(
  sources: ChallengeReportAcquisitionSource[],
): ChallengeReportAcquisitionSource[] {
  return sources.filter((s) => s.key !== "unknown");
}

export function coachingMetricsTracked(input: {
  programLinkClicks: number | null;
  completionOfferClicks: number | null;
}): boolean {
  return input.programLinkClicks != null || input.completionOfferClicks != null;
}

/** Hide footnotes that only explain missing tracking. */
export function coachingTrackingNoteForCreator(note: string): string | null {
  if (/^not tracked/i.test(note.trim())) return null;
  return note;
}
