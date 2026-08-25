const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value) {
  return String(value ?? "").trim();
}

export function validateReservationInput(body, reservedSeats) {
  const name = cleanText(body.name);
  const email = cleanText(body.email).toLowerCase();
  const isAttending = body.isAttending;
  const companions = isAttending ? Number(body.companions ?? 0) : 0;
  const companionNames = isAttending
    ? (Array.isArray(body.companionNames) ? body.companionNames : []).map(
        cleanText,
      )
    : [];
  const notes = cleanText(body.notes);

  if (!name || name.length > 150) {
    return { error: "Name is required and must be 150 characters or fewer." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "A valid email address is required." };
  }

  if (typeof isAttending !== "boolean") {
    return { error: "isAttending must be true or false." };
  }

  const maxCompanions = Math.max(0, reservedSeats - 1);

  if (
    !Number.isInteger(companions) ||
    companions < 0 ||
    companions > maxCompanions
  ) {
    return { error: `Companions must be between 0 and ${maxCompanions}.` };
  }

  if (
    companionNames.length !== companions ||
    companionNames.some((value) => !value)
  ) {
    return { error: "Provide one non-empty name for every companion." };
  }

  if (companionNames.some((value) => value.length > 150)) {
    return { error: "Each companion name must be 150 characters or fewer." };
  }

  if (notes.length > 1000) {
    return { error: "Notes must be 1,000 characters or fewer." };
  }

  return {
    value: { name, email, isAttending, companions, companionNames, notes },
  };
}
