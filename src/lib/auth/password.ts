import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT_ROUNDS = 12;

function hashLegacySha256(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) return true;

  if (passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$")) {
    return bcrypt.compare(password, passwordHash);
  }

  return hashLegacySha256(password) === passwordHash;
}

export function needsPasswordRehash(passwordHash: string | null | undefined) {
  return Boolean(passwordHash && !passwordHash.startsWith("$2"));
}
