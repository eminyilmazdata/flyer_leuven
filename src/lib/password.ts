import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_BYTES = 32;

/** Format: s1:<saltHex>:<keyHex> */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = (await scryptAsync(plain, salt, KEY_BYTES)) as Buffer;
  return `s1:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(
  plain: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored || !stored.startsWith("s1:")) return false;
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const [, saltHex, keyHex] = parts;
  if (!saltHex || !keyHex) return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expected = Buffer.from(keyHex, "hex");
  } catch {
    return false;
  }
  if (salt.length !== SALT_BYTES || expected.length !== KEY_BYTES) return false;
  const key = (await scryptAsync(plain, salt, KEY_BYTES)) as Buffer;
  try {
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
