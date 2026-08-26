const COLORS = {
  ivory: "#f7f2e9",
  paper: "#fffdf8",
  wine: "#671a2d",
  wineDark: "#3b111c",
  gold: "#b89662",
  ink: "#28211e",
  muted: "#736b65",
  line: "#e7dccd",
};

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailShell({ preheader, eyebrow, title, content, footer }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.ivory};color:${COLORS.ink};font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${COLORS.ivory};">
      <tr>
        <td align="center" style="padding:32px 14px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:${COLORS.paper};border:1px solid ${COLORS.line};">
            <tr>
              <td align="center" style="padding:38px 28px 34px;background:${COLORS.wineDark};color:#fffaf2;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:34px;letter-spacing:8px;line-height:1;">K <span style="color:${COLORS.gold};font-style:italic;">&amp;</span> L</div>
                <div style="width:54px;height:1px;margin:22px auto;background:${COLORS.gold};"></div>
                <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e8d6b4;">${escapeHtml(eyebrow)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:44px 38px 40px;">
                <h1 style="margin:0 0 24px;color:${COLORS.wine};font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.2;font-weight:normal;text-align:center;">${escapeHtml(title)}</h1>
                ${content}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 30px;background:#f0e8dc;border-top:1px solid ${COLORS.line};color:${COLORS.muted};font-size:12px;line-height:1.7;">
                ${footer}
                <div style="margin-top:12px;color:${COLORS.wine};font-family:Georgia,'Times New Roman',serif;font-size:18px;">Kiko &amp; Lec</div>
                <div style="margin-top:5px;letter-spacing:1px;">SEPTEMBER 18, 2026 · LIPA CITY</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function summaryRow(label, value, isLast = false) {
  return `<tr>
    <td style="padding:14px 0;${isLast ? "" : `border-bottom:1px solid ${COLORS.line};`}">
      <div style="margin-bottom:5px;color:${COLORS.muted};font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(label)}</div>
      <div style="color:${COLORS.ink};font-size:15px;line-height:1.5;">${escapeHtml(value)}</div>
    </td>
  </tr>`;
}

function reservationDetails(reservation) {
  const attending = Boolean(reservation.isAttending);
  const companions = Number(reservation.companions) || 0;

  return {
    attendance: attending ? "Joyfully attending" : "Regretfully unable to attend",
    partySize: attending ? String(1 + companions) : "0",
    companionNames: reservation.companionNames?.join(", ") || "None",
  };
}

export function buildGuestRsvpEmail(reservation) {
  const details = reservationDetails(reservation);
  const safeName = escapeHtml(reservation.name);
  const content = `
    <p style="margin:0 0 18px;color:${COLORS.ink};font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.5;">Dear ${safeName},</p>
    <p style="margin:0 0 28px;color:${COLORS.muted};font-size:15px;line-height:1.8;text-align:center;">Thank you for responding to our wedding invitation. Your RSVP has been received, and we are grateful to have you as part of this special chapter in our lives.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0 0 30px;padding:8px 24px;background:#faf6ef;border:1px solid ${COLORS.line};">
      ${summaryRow("Attendance", details.attendance)}
      ${summaryRow("Total party size", details.partySize)}
      ${summaryRow("Companions", details.companionNames, true)}
    </table>
    <p style="margin:0;color:${COLORS.muted};font-size:14px;line-height:1.8;text-align:center;">If you have any concerns or need to make changes, please contact the bride or groom directly.</p>
    <div style="width:44px;height:1px;margin:30px auto 22px;background:${COLORS.gold};"></div>
    <p style="margin:0;color:${COLORS.wine};font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.5;text-align:center;font-style:italic;">With love and gratitude,<br>Kiko &amp; Lec</p>`;

  return {
    subject: "Thank you — we received your wedding RSVP",
    text: [
      `Dear ${reservation.name},`,
      "",
      "Thank you for responding to our wedding invitation. Your RSVP has been received.",
      `Attendance: ${details.attendance}`,
      `Total party size: ${details.partySize}`,
      `Companions: ${details.companionNames}`,
      "",
      "If you have any concerns or need to make changes, please contact the bride or groom directly.",
      "",
      "With love and gratitude,",
      "Kiko & Lec",
    ].join("\n"),
    html: emailShell({
      preheader: "Thank you. Your wedding RSVP has been received.",
      eyebrow: "Wedding RSVP Confirmation",
      title: "Thank you for your response",
      content,
      footer: "We look forward to celebrating this beautiful day with the people closest to our hearts.",
    }),
  };
}

export function buildAdminRsvpEmail(reservation) {
  const details = reservationDetails(reservation);
  const notes = reservation.notes || "None";
  const content = `
    <p style="margin:0 0 26px;color:${COLORS.muted};font-size:15px;line-height:1.75;text-align:center;">A guest has completed the wedding RSVP form. The response has been safely stored in the database.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;padding:8px 24px;background:#faf6ef;border:1px solid ${COLORS.line};">
      ${summaryRow("Guest", reservation.name)}
      ${summaryRow("Email", reservation.email)}
      ${summaryRow("Attendance", details.attendance)}
      ${summaryRow("Total party size", details.partySize)}
      ${summaryRow("Companions", details.companionNames)}
      ${summaryRow("Notes", notes, true)}
    </table>`;

  return {
    subject: `New wedding RSVP from ${reservation.name}`,
    text: [
      "A wedding RSVP was submitted.",
      "",
      `Name: ${reservation.name}`,
      `Guest email: ${reservation.email}`,
      `Attendance: ${details.attendance}`,
      `Total party size: ${details.partySize}`,
      `Companion names: ${details.companionNames}`,
      `Notes: ${notes}`,
      "",
      "The complete response is stored in the RSVP database.",
    ].join("\n"),
    html: emailShell({
      preheader: `New wedding RSVP from ${reservation.name}`,
      eyebrow: "Admin Notification",
      title: "A new RSVP has arrived",
      content,
      footer: "This is an automatic notification from your wedding RSVP website.",
    }),
  };
}
