const FALLBACK_JWT_SECRET = "default_secret_key_change_me";
const JWT_SECRET_ERROR_MESSAGE = "JWT_SECRET must be configured with a strong secret";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === FALLBACK_JWT_SECRET) {
    throw new Error(JWT_SECRET_ERROR_MESSAGE);
  }

  return new TextEncoder().encode(secret);
}

export function isJwtSecretConfigurationError(error: unknown) {
  return error instanceof Error && error.message === JWT_SECRET_ERROR_MESSAGE;
}
