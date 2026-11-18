import { test, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HTTPError } from './base_service.js';
import { UserSettingsReadPages } from './user_settings_read_pages.js';
import type { ReadPages } from './user_settings_read_pages.js';

const realFetch = globalThis.fetch;

interface Sent {
  url: string;
  method?: string;
  authorization: string | null;
  contentType: string | null;
  body: BodyInit | null | undefined;
}

let sent: Sent | null = null;

function captureRequests(status: number, payload: string): void {
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const headers = new Headers(init?.headers);
    sent = {
      url: String(url),
      method: init?.method,
      authorization: headers.get('Authorization'),
      contentType: headers.get('Content-Type'),
      body: init?.body
    };
    return new Response(payload, { status });
  }) as typeof globalThis.fetch;
}

function service(): UserSettingsReadPages {
  return new UserSettingsReadPages({
    bearerToken: 'a-token',
    environment: 'testing',
    myAccountId: 'SYSTIMEMYACCOUNT',
    serviceUrl: 'https://example.invalid'
  });
}

const isbn = '9788761699999';
const pageId = 42;
const readPages: ReadPages = { isbn, pageIds: [7, 42] };

afterEach(() => {
  globalThis.fetch = realFetch;
  sent = null;
});

describe('UserSettingsReadPages', () => {
  test('getReadPages gets /read-pages/isbn/{isbn}', async () => {
    captureRequests(200, JSON.stringify(readPages));

    const response = await service().getReadPages({ isbn });

    assert.equal(sent?.url, `https://example.invalid/read-pages/isbn/${isbn}`);
    assert.equal(sent?.method, 'GET');
    assert.equal(sent?.authorization, 'Bearer a-token');
    assert.equal(sent?.body, null);
    assert.deepEqual(response, readPages);
  });

  test('setPageRead puts /read-pages/isbn/{isbn}/page/{pageId} without a body', async () => {
    captureRequests(200, JSON.stringify(readPages));

    const response = await service().setPageRead({ isbn, pageId });

    assert.equal(
      sent?.url,
      `https://example.invalid/read-pages/isbn/${isbn}/page/${pageId}`
    );
    assert.equal(sent?.method, 'PUT');
    assert.equal(sent?.authorization, 'Bearer a-token');
    assert.equal(sent?.contentType, null);
    assert.equal(sent?.body, null);
    assert.deepEqual(response, readPages);
  });

  test('deletePageRead deletes /read-pages/isbn/{isbn}/page/{pageId}', async () => {
    captureRequests(200, JSON.stringify(readPages));

    const response = await service().deletePageRead({ isbn, pageId });

    assert.equal(
      sent?.url,
      `https://example.invalid/read-pages/isbn/${isbn}/page/${pageId}`
    );
    assert.equal(sent?.method, 'DELETE');
    assert.equal(sent?.authorization, 'Bearer a-token');
    assert.equal(sent?.body, null);
    assert.deepEqual(response, readPages);
  });

  test('deletePagesRead posts the page ids to /read-pages/isbn/{isbn}/remove', async () => {
    captureRequests(200, JSON.stringify(readPages));

    const response = await service().deletePagesRead({
      isbn,
      pageIds: [7, 42]
    });

    assert.equal(
      sent?.url,
      `https://example.invalid/read-pages/isbn/${isbn}/remove`
    );
    assert.equal(sent?.method, 'POST');
    assert.equal(sent?.authorization, 'Bearer a-token');
    assert.equal(sent?.contentType, 'application/json');
    assert.deepEqual(JSON.parse(String(sent?.body)), { pageIds: [7, 42] });
    assert.deepEqual(response, readPages);
  });

  const failures: {
    name: string;
    status: number;
    call: () => Promise<ReadPages>;
  }[] = [
    {
      name: 'getReadPages rejects a 404 with the HTTPError instance instead of an empty list',
      status: 404,
      call: () => service().getReadPages({ isbn })
    },
    {
      name: 'setPageRead rejects with the HTTPError instance',
      status: 500,
      call: () => service().setPageRead({ isbn, pageId })
    },
    {
      name: 'deletePageRead rejects with the HTTPError instance',
      status: 401,
      call: () => service().deletePageRead({ isbn, pageId })
    },
    {
      name: 'deletePagesRead rejects with the HTTPError instance',
      status: 500,
      call: () => service().deletePagesRead({ isbn, pageIds: [7] })
    }
  ];

  for (const { name, status, call } of failures) {
    test(name, async () => {
      captureRequests(status, '{}');

      const error = await call()
        .then(() => null)
        .catch((thrown: unknown) => thrown);

      assert.ok(error instanceof HTTPError, 'expected an HTTPError instance');
      assert.equal(error.response.status, status);
    });
  }
});
