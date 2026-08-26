export const INVITATION_ROLES = [
  "guest",
  "principal-sponsor",
  "secondary-sponsor",
  "father-of-the-groom",
  "mother-of-the-groom",
  "best-man",
  "groomsman",
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
  ["father of the groom", "father-of-the-groom"],
  ["grooms father", "father-of-the-groom"],
  ["groom s father", "father-of-the-groom"],
  ["mother of the groom", "mother-of-the-groom"],
  ["grooms mother", "mother-of-the-groom"],
  ["groom s mother", "mother-of-the-groom"],
  ["best man", "best-man"],
  ["bestman", "best-man"],
  ["groomsman", "groomsman"],
  ["groomsmen", "groomsman"],
  ["groomman", "groomsman"],
  ["groommen", "groomsman"],
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

export function normalizeInvitationRoleAssignments(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) return null;

  const assignments = [];
  for (const assignment of value) {
    const name = String(assignment?.name ?? "").trim();
    const inputRoles = Array.isArray(assignment?.roles)
      ? assignment.roles
      : [assignment?.role];
    const roles = [...new Set(inputRoles.map(normalizeInvitationRole))];

    if (!name || roles.length === 0 || roles.includes(null)) return null;
    assignments.push({ name, roles });
  }

  return assignments;
}
