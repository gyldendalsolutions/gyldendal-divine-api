/**
 * Decodes a base64url-encoded JWT segment (RFC 4648 §5).
 */
function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  // Restore padding to a multiple of 4
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  try {
    return atob(padded);
  } catch {
    throw new Error('JWT payload segment is not valid base64url');
  }
}

/**
 * Extracts the expiry time from a JWT token's `exp` claim.
 *
 * The `exp` claim is a NumericDate (Unix timestamp in seconds, per RFC 7519).
 */
export function getJwtExpiry(token: string): Date {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error(
      `Invalid JWT: expected 3 dot-separated segments, got ${parts.length}`
    );
  }

  const payloadSegment = parts[1];

  if (payloadSegment.length === 0) {
    throw new Error('Invalid JWT: payload segment is empty');
  }

  const decoded = decodeBase64Url(payloadSegment);

  let payload: unknown;
  try {
    payload = JSON.parse(decoded);
  } catch {
    throw new Error('Invalid JWT: payload is not valid JSON');
  }

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid JWT: payload must be a JSON object');
  }

  if (!('exp' in payload)) {
    throw new Error('Invalid JWT: payload does not contain an "exp" claim');
  }

  const exp = (payload as Record<string, unknown>).exp;

  if (typeof exp !== 'number') {
    throw new Error(
      `Invalid JWT: "exp" claim must be a number, got ${typeof exp}`
    );
  }

  if (!Number.isFinite(exp)) {
    throw new Error(`Invalid JWT: "exp" claim is not a finite number`);
  }

  // JWT NumericDate is seconds since epoch; Date constructor takes milliseconds.
  return new Date(exp * 1000);
}
