import { COORDINATOR_MAX_AGE_SEC } from "./constants";

const enc = new TextEncoder();

function utf8ToBase64Url(s: string): string {
  const bytes = enc.encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToUtf8(b64: string): string {
  let s = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i)!;
  }
  return new TextDecoder().decode(out);
}

function getSecretOrNull(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

function getSecret(): string {
  const secret = getSecretOrNull();
  if (!secret) {
    throw new Error("SESSION_SECRET must be set and at least 16 characters");
  }
  return secret;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Issue a signed coordinator cookie value (not the full Set-Cookie string). */
export async function createCoordinatorToken(): Promise<string> {
  const secret = getSecret();
  const exp = Math.floor(Date.now() / 1000) + COORDINATOR_MAX_AGE_SEC;
  const payload = JSON.stringify({ exp, role: "coordinator" });
  const b64 = utf8ToBase64Url(payload);
  const sig = await hmacSha256Hex(secret, b64);
  return `${b64}.${sig}`;
}

export async function verifyCoordinatorToken(
  token: string | undefined,
): Promise<boolean> {
  const secret = getSecretOrNull();
  if (!secret || !token || !token.includes(".")) return false;
  const dot = token.lastIndexOf(".");
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!b64 || !sig || sig.length !== 64) return false;
  const expected = await hmacSha256Hex(secret, b64);
  if (!timingSafeEqualHex(sig, expected)) return false;
  let parsed: { exp?: number; role?: string };
  try {
    parsed = JSON.parse(base64UrlToUtf8(b64));
  } catch {
    return false;
  }
  if (parsed.role !== "coordinator" || typeof parsed.exp !== "number") return false;
  return parsed.exp > Math.floor(Date.now() / 1000);
}

export function coordinatorCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COORDINATOR_MAX_AGE_SEC,
  };
}
