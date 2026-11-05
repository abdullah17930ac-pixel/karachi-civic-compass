// Phone + PIN sign-in without SMS or email.
// The login system needs an email and a strong password behind the scenes, so we
// build both from the phone number and PIN. Nobody ever receives an email.
// Note: this is fine for a student project, but a short PIN is weaker than a real password.

/** Turns 0348-2530816, 03482530816, +92 348 2530816 or 3482530816 into 923482530816. */
export function normalizePkPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(2);
  if (d.startsWith("03")) d = "92" + d.slice(1);
  else if (d.startsWith("3") && d.length === 10) d = "92" + d;
  return /^923\d{9}$/.test(d) ? d : null;
}

/** Shows 923482530816 as 0348 2530816 */
export function prettyPkPhone(normalized: string): string {
  const local = "0" + normalized.slice(2);
  return `${local.slice(0, 4)} ${local.slice(4)}`;
}

export const isValidPin = (pin: string) => /^\d{4,6}$/.test(pin);

export const phoneToEmail = (normalized: string) => `${normalized}@phone.civicconnect.app`;

/** Pads the short PIN so it passes the login system's password strength rules. */
export const pinToPassword = (pin: string) => `CivicConnect#${pin}#Karachi`;
