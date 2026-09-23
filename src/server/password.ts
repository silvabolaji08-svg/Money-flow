import bcrypt from "bcryptjs";

/**
 * Password hashing. Cost 12 is the current sensible default for bcrypt:
 * slow enough to frustrate offline cracking, fast enough for a login request.
 */
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Burns roughly the same time as a real comparison when no user exists, so the
 * response time cannot be used to enumerate registered email addresses.
 */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.ZxBqMrmB8TQmKkWZ8k8i8hKZ0xGZ0nO";

export async function fakeVerify(plain: string): Promise<void> {
  await bcrypt.compare(plain, DUMMY_HASH);
}
