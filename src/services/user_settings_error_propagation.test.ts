import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { HTTPError } from './base_service.js';
import { UserSettingsClientSettings } from './user_settings_clientsettings.js';
import { UserSettingsContinue } from './user_settings_continue.js';

const realFetch = globalThis.fetch;

function respondWith(status: number): void {
  globalThis.fetch = (async () =>
    new Response('{}', { status })) as typeof globalThis.fetch;
}

function options(): {
  environment: string;
  myAccountId: string;
  serviceUrl: string;
  bearerToken: string;
} {
  return {
    environment: 'testing',
    myAccountId: 'SYSTIMEMYACCOUNT',
    serviceUrl: 'https://example.invalid',
    bearerToken: 'token'
  };
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

test('getSettings rethrows the HTTPError instance for a rejected token', async () => {
  respondWith(401);
  const service = new UserSettingsClientSettings(options());

  const error = await service
    .getSettings({ isbn: '1234567890123' })
    .then(() => null)
    .catch((thrown: unknown) => thrown);

  assert.ok(error instanceof HTTPError, 'expected an HTTPError instance');
  assert.equal(error.response.status, 401);
});

test('getSettings still maps 404 to empty settings', async () => {
  respondWith(404);
  const service = new UserSettingsClientSettings(options());

  assert.deepEqual(await service.getSettings({ isbn: '1234567890123' }), {
    settings: {}
  });
});

test('getContinue rethrows the HTTPError instance for a rejected token', async () => {
  respondWith(401);
  const service = new UserSettingsContinue(options());

  const error = await service
    .getContinue({ isbn: '1234567890123' })
    .then(() => null)
    .catch((thrown: unknown) => thrown);

  assert.ok(error instanceof HTTPError, 'expected an HTTPError instance');
  assert.equal(error.response.status, 401);
});

test('getContinue still maps 404 to an empty object', async () => {
  respondWith(404);
  const service = new UserSettingsContinue(options());

  assert.deepEqual(await service.getContinue({ isbn: '1234567890123' }), {});
});
