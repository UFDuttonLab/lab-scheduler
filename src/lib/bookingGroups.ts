import { Booking } from "@/lib/types";

/**
 * Helpers for multi-equipment sessions.
 *
 * A booking made across several machines at once is stored as N rows in `bookings` sharing a
 * `booking_group_id`. They are meant to describe ONE session: same times, same project, same
 * sample payload, different equipment. Analytics depends on that, because it credits a group's
 * samples to exactly one row (the first by start_time, then id) to avoid multiplying a
 * 100-sample run by the three machines it ran on.
 *
 * Editing a single row used to let the rows drift apart. That has already happened twice on the
 * live database, and the consequence is silent under-reporting: one group has 1 sample on the row
 * Analytics credits and 24 on the row it zeroes, so the session reports 1 sample instead of 24.
 */

/**
 * Shared fields that must be identical across every row of a group.
 *
 * This list must cover EVERY column the group-wide UPDATE writes, or the drift warning lies by
 * omission: an earlier version compared only times and sample count, so a group whose rows
 * differed in purpose, project or collaborators was silently unified with no warning at all.
 * The write sets start_time, end_time, project_id, project_samples, samples_processed, purpose
 * and collaborators - so all of them are compared here.
 */
export interface GroupSharedFields {
  startMs: number;
  endMs: number;
  samples: number;
  purpose: string;
  projectId: string;
  /** Order-insensitive, since collaborator order carries no meaning. */
  collaborators: string;
  /** Canonical form of the per-project sample breakdown. */
  projectSamples: string;
}

export const sharedFieldsOf = (b: Booking): GroupSharedFields => ({
  startMs: b.startTime.getTime(),
  endMs: b.endTime.getTime(),
  samples: b.samplesProcessed ?? 0,
  purpose: b.purpose ?? "",
  projectId: b.projectId ?? "",
  collaborators: Array.isArray(b.collaborators)
    ? [...b.collaborators].sort().join(",")
    : "",
  projectSamples: Array.isArray(b.projectSamples)
    ? [...b.projectSamples]
        .map(ps => `${ps.projectId}:${ps.samples}`)
        .sort()
        .join(",")
    : "",
});

/**
 * The other rows of this booking's group, if it has one.
 * `all` is the merged booking list the pages already hold in state.
 */
export const siblingsOf = (booking: Booking, all: Booking[]): Booking[] => {
  if (!booking.bookingGroupId) return [];
  return all.filter(
    b =>
      b.source !== "usage_record" &&
      b.bookingGroupId === booking.bookingGroupId &&
      b.id !== booking.id
  );
};

/**
 * Describes how a group's rows currently disagree, or null when they are consistent.
 *
 * Needed because applying an edit to the whole group is the right behaviour for a CONSISTENT
 * group (invisible, and it keeps them that way) but destructive for one that has already
 * drifted: unifying them overwrites a sibling's divergent times and sample count. The caller
 * should confirm with the user in that case rather than silently picking a winner.
 */
export const describeGroupDrift = (
  booking: Booking,
  all: Booking[]
): { machines: string[]; differingFields: string[] } | null => {
  const siblings = siblingsOf(booking, all);
  if (siblings.length === 0) return null;

  const mine = sharedFieldsOf(booking);
  const differing = new Set<string>();

  for (const s of siblings) {
    const theirs = sharedFieldsOf(s);
    if (theirs.startMs !== mine.startMs) differing.add("start time");
    if (theirs.endMs !== mine.endMs) differing.add("duration");
    if (theirs.samples !== mine.samples) differing.add("sample count");
    if (theirs.purpose !== mine.purpose) differing.add("purpose");
    if (theirs.projectId !== mine.projectId) differing.add("project");
    if (theirs.collaborators !== mine.collaborators) differing.add("collaborators");
    if (theirs.projectSamples !== mine.projectSamples) differing.add("sample breakdown");
  }

  if (differing.size === 0) return null;

  return {
    machines: siblings.map(s => s.equipmentName),
    differingFields: Array.from(differing),
  };
};
