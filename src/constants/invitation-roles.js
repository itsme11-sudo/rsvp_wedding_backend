export const INVITATION_ROLES = [
  "guest",
  "principal-sponsor",
  "secondary-sponsor",
  "bridesmaid",
  "coin-bearer",
  "mother-of-the-bride",
  "father-of-the-bride",
  "matron-of-honor",
  "maid-of-honor",
  "bible-bearer",
  "cord-sponsor",
  "veil-sponsor",
  "candle-sponsor",
  "flower-girl",
];

function roleKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("’", "'")
    .replace(/['._-]+/g, " ")
    .replace(/\s+/g, " ");
}

const ROLE_ALIASES = new Map([
  ["guest", "guest"],
  ["principal sponsor", "principal-sponsor"],
  ["secondary sponsor", "secondary-sponsor"],
  ["bridesmaid", "bridesmaid"],
  ["brides maid", "bridesmaid"],
  ["bride s maid", "bridesmaid"],
  ["coin bearer", "coin-bearer"],
  ["mother of the bride", "mother-of-the-bride"],
  ["mother of bride", "mother-of-the-bride"],
  ["mother s bride", "mother-of-the-bride"],
  ["father of the bride", "father-of-the-bride"],
  ["father of bride", "father-of-the-bride"],
  ["father s bride", "father-of-the-bride"],
  ["matron of honor", "matron-of-honor"],
  ["mathron of honor", "matron-of-honor"],
  ["maid of honor", "maid-of-honor"],
  ["bible bearer", "bible-bearer"],
  ["cord", "cord-sponsor"],
  ["cord sponsor", "cord-sponsor"],
  ["veil", "veil-sponsor"],
  ["veil sponsor", "veil-sponsor"],
  ["candle", "candle-sponsor"],
  ["candle sponsor", "candle-sponsor"],
  ["flower girl", "flower-girl"],
]);

export function normalizeInvitationRole(value = "guest") {
  return ROLE_ALIASES.get(roleKey(value)) ?? null;
}
