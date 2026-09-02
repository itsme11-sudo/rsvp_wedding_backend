const calendarParameters = new URLSearchParams({
  action: "TEMPLATE",
  text: "KIKO AND LEC wedding",
  dates: "20260918T050000Z/20260918T140000Z",
  ctz: "Asia/Manila",
  details: "Check our website/rsvp for details",
});

export const GOOGLE_CALENDAR_URL =
  `https://calendar.google.com/calendar/render?${calendarParameters.toString()}`;
