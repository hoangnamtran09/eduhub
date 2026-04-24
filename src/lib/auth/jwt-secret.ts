const FALLBACK_JWT_SECRET = "default_secret_key_change_me";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === FALLBACK_JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured with a strong secret");
  }

  return new TextEncoder().encode(secret);
}
