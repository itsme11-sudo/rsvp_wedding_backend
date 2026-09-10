export const RSVP_CLOSES_AT = "2026-09-04T00:00:00+08:00";
export const RSVP_CLOSED_MESSAGE =
  "RSVP submissions are now closed. Our deadline has passed. Please contact the bride or groom directly if you have any concerns or need assistance.";

const rsvpDeadlineTimestamp = Date.parse(RSVP_CLOSES_AT);

export function isRsvpClosed(now = new Date()) {
  return now.getTime() >= rsvpDeadlineTimestamp;
}
