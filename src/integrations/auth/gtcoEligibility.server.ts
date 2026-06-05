function parseAllowedDomains(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function gtcoSignupRequiresAccessCode(): boolean {
  return Boolean(process.env.GTCO_SIGNUP_ACCESS_CODE?.trim());
}

export function verifyGtcoSignupEligibility(opts: {
  email: string;
  accessCode?: string;
  confirmedGtcoCustomer: boolean;
}): { ok: true } | { ok: false; message: string } {
  if (!opts.confirmedGtcoCustomer) {
    return {
      ok: false,
      message: "Please confirm you are a GTCO SME merchant customer enrolled in Lynk Assistant.",
    };
  }

  const email = opts.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, message: "Enter a valid business email address." };
  }

  const requiredCode = process.env.GTCO_SIGNUP_ACCESS_CODE?.trim();
  if (requiredCode) {
    const provided = opts.accessCode?.trim() ?? "";
    if (!provided) {
      return {
        ok: false,
        message: "Enter your GTCO access code from your relationship manager.",
      };
    }
    if (provided !== requiredCode) {
      return {
        ok: false,
        message: "Invalid access code. Contact your GTCO relationship manager for help.",
      };
    }
  }

  const allowedDomains = parseAllowedDomains(process.env.GTCO_ALLOWED_EMAIL_DOMAINS);
  if (allowedDomains.length > 0) {
    const domain = email.split("@")[1];
    if (!domain || !allowedDomains.includes(domain)) {
      return {
        ok: false,
        message: "Sign up is limited to approved business email domains for GTCO SME customers.",
      };
    }
  }

  return { ok: true };
}
