import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getJwtExpiry } from './jwt.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a syntactically valid JWT whose payload is the JSON-serialised object. */
function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from('{"alg":"none"}').toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.`;
}

// ── Happy paths ───────────────────────────────────────────────────────────────

test('returns the correct Date for a valid token', () => {
  const exp = 2000000000;
  assert.deepEqual(getJwtExpiry(makeToken({ exp })), new Date(exp * 1000));
});

test('handles exp=0 (Unix epoch)', () => {
  assert.deepEqual(getJwtExpiry(makeToken({ exp: 0 })), new Date(0));
});

test('ignores all claims other than exp', () => {
  const exp = 1800000000;
  assert.deepEqual(
    getJwtExpiry(makeToken({ iss: 'auth', sub: 'user123', iat: 1700000000, exp })),
    new Date(exp * 1000)
  );
});

test('decodes a base64url payload that contains _ characters', () => {
  // '?' (0x3F) sits at byte 18 of the JSON string, which is the last byte of the
  // sixth 3-byte encoding group. Its low 6 bits are all 1s (0b111111 = 63), mapping
  // to '/' in standard base64 and '_' in base64url. This verifies the substitution
  // is correctly reversed before decoding.
  const payloadJson = '{"exp":1000,"k":"?"}';
  const b64url = Buffer.from(payloadJson).toString('base64url');
  assert.ok(b64url.includes('_'), 'precondition: payload must encode to base64url containing _');

  const header = Buffer.from('{"alg":"none"}').toString('base64url');
  assert.deepEqual(getJwtExpiry(`${header}.${b64url}.`), new Date(1000 * 1000));
});

test('decodes a base64url payload that contains - characters', () => {
  // '>' (0x3E) at the last byte of a 3-byte group has low 6 bits 0b111110 = 62,
  // mapping to '+' in standard base64 and '-' in base64url.
  const payloadJson = '{"exp":1000,"k":">"}';
  const b64url = Buffer.from(payloadJson).toString('base64url');
  assert.ok(b64url.includes('-'), 'precondition: payload must encode to base64url containing -');

  const header = Buffer.from('{"alg":"none"}').toString('base64url');
  assert.deepEqual(getJwtExpiry(`${header}.${b64url}.`), new Date(1000 * 1000));
});

// ── Structural validation ─────────────────────────────────────────────────────

test('throws for an empty string', () => {
  assert.throws(() => getJwtExpiry(''), /3 dot-separated segments/);
});

test('throws for fewer than 3 segments', () => {
  assert.throws(() => getJwtExpiry('a.b'), /3 dot-separated segments/);
});

test('throws for more than 3 segments', () => {
  assert.throws(() => getJwtExpiry('a.b.c.d'), /3 dot-separated segments/);
});

test('throws for an empty payload segment', () => {
  assert.throws(() => getJwtExpiry('a..c'), /payload segment is empty/);
});

// ── Decode errors ─────────────────────────────────────────────────────────────

test('throws for a payload containing invalid base64url characters', () => {
  assert.throws(() => getJwtExpiry('a.!!!!.c'), /not valid base64url/);
});

test('throws when the decoded payload is not valid JSON', () => {
  const segment = Buffer.from('not json').toString('base64url');
  assert.throws(() => getJwtExpiry(`a.${segment}.c`), /not valid JSON/);
});

// ── Payload shape errors ──────────────────────────────────────────────────────

test('throws when the payload decodes to a JSON array', () => {
  const segment = Buffer.from('[1,2,3]').toString('base64url');
  assert.throws(() => getJwtExpiry(`a.${segment}.c`), /must be a JSON object/);
});

test('throws when the payload decodes to JSON null', () => {
  const segment = Buffer.from('null').toString('base64url');
  assert.throws(() => getJwtExpiry(`a.${segment}.c`), /must be a JSON object/);
});

test('throws when the payload decodes to a JSON string', () => {
  const segment = Buffer.from('"hello"').toString('base64url');
  assert.throws(() => getJwtExpiry(`a.${segment}.c`), /must be a JSON object/);
});

// ── exp claim errors ──────────────────────────────────────────────────────────

test('throws when exp is absent', () => {
  assert.throws(() => getJwtExpiry(makeToken({ sub: 'user' })), /"exp" claim/);
});

test('throws when exp is a string', () => {
  assert.throws(() => getJwtExpiry(makeToken({ exp: '2000000000' })), /must be a number/);
});

test('throws when exp is null', () => {
  assert.throws(() => getJwtExpiry(makeToken({ exp: null })), /must be a number/);
});

test('throws when exp is a boolean', () => {
  assert.throws(() => getJwtExpiry(makeToken({ exp: true })), /must be a number/);
});

test('throws when exp is an object', () => {
  assert.throws(() => getJwtExpiry(makeToken({ exp: {} })), /must be a number/);
});

// ── exp range errors ──────────────────────────────────────────────────────────

// ECMAScript Date range: ±8,640,000,000,000,000 ms = ±8,640,000,000,000 s from epoch.

test('accepts exp at the positive Date boundary', () => {
  const exp = 8_640_000_000_000;
  assert.deepEqual(getJwtExpiry(makeToken({ exp })), new Date(8_640_000_000_000_000));
});

test('accepts exp at the negative Date boundary', () => {
  const exp = -8_640_000_000_000;
  assert.deepEqual(getJwtExpiry(makeToken({ exp })), new Date(-8_640_000_000_000_000));
});

test('throws for exp one second beyond the positive boundary', () => {
  assert.throws(
    () => getJwtExpiry(makeToken({ exp: 8_640_000_000_001 })),
    /outside the valid JavaScript Date range/
  );
});

test('throws for exp one second beyond the negative boundary', () => {
  assert.throws(
    () => getJwtExpiry(makeToken({ exp: -8_640_000_000_001 })),
    /outside the valid JavaScript Date range/
  );
});
