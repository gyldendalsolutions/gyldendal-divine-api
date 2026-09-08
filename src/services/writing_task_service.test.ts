import { test, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WritingTaskService } from './writing_task_service.js';

const realFetch = globalThis.fetch;

interface Sent {
  url: string;
  method?: string;
  authorization: string | null;
  body: Record<string, unknown>;
}

let sent: Sent | null = null;

function captureRequests(status = 200, payload: unknown = []): void {
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    sent = {
      url: String(url),
      method: init?.method,
      authorization: new Headers(init?.headers).get('Authorization'),
      body: JSON.parse(String(init?.body ?? '{}'))
    };
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof globalThis.fetch;
}

function service(): WritingTaskService {
  return new WritingTaskService({
    bearerToken: 'a-token',
    environment: 'testing',
    myAccountId: 'SYSTIMEMYACCOUNT',
    serviceUrl: 'https://example.invalid'
  });
}

afterEach(() => {
  globalThis.fetch = realFetch;
  sent = null;
});

describe('getResponse', () => {
  test('posts the user, account and content ids to /getResponse', async () => {
    captureRequests(200, [{ Items: [{ cid: 'c1', isbn: '1', pid: '2' }] }]);

    const buckets = await service().getResponse({
      userId: 'user-1',
      isbn: '9788761687050',
      pid: '9394',
      cids: ['c1', 'c2']
    });

    assert.equal(sent?.url, 'https://example.invalid/getResponse');
    assert.equal(sent?.method, 'POST');
    assert.equal(sent?.authorization, 'Bearer a-token');
    assert.deepEqual(sent?.body, {
      userId: 'user-1',
      isbn: '9788761687050',
      pid: '9394',
      cids: ['c1', 'c2'],
      myaccountId: 'SYSTIMEMYACCOUNT'
    });
    assert.equal(buckets[0]?.Items?.[0]?.cid, 'c1');
  });
});

describe('newResponse', () => {
  test('sends the answer with the user the token was issued for', async () => {
    captureRequests(200, {});

    await service().newResponse({
      userId: 'user-1',
      answer: {
        cid: 'c1',
        isbn: '9788761687050',
        pid: '9394',
        stepwiseTaskData: [{ step: 1, answer: 'text' }],
        userName: ''
      }
    });

    assert.equal(sent?.url, 'https://example.invalid/newResponse');
    assert.equal(sent?.body.userId, 'user-1');
    assert.equal(sent?.body.myaccountId, 'SYSTIMEMYACCOUNT');
    assert.deepEqual(sent?.body.stepwiseTaskData, [
      { step: 1, answer: 'text' }
    ]);
  });

  test('carries no shared secret', async () => {
    captureRequests(200, {});

    await service().newResponse({
      userId: 'user-1',
      answer: {
        cid: 'c1',
        isbn: '1',
        pid: '2',
        stepwiseTaskData: []
      }
    });

    assert.equal(sent?.body.hmac, undefined);
  });
});

describe('deleteResponse', () => {
  test('posts the answer key to /deleteResponse', async () => {
    captureRequests(200, {});

    await service().deleteResponse({
      userId: 'user-1',
      cid: 'c1',
      isbn: '9788761687050',
      pid: '9394'
    });

    assert.equal(sent?.url, 'https://example.invalid/deleteResponse');
    assert.deepEqual(sent?.body, {
      userId: 'user-1',
      cid: 'c1',
      isbn: '9788761687050',
      pid: '9394',
      myaccountId: 'SYSTIMEMYACCOUNT'
    });
  });
});

describe('an answer keeps the shape the caller stores', () => {
  test('steps keyed by uid are sent as they are', async () => {
    captureRequests(200, {});

    await service().newResponse({
      userId: 'user-1',
      answer: {
        cid: 'c1',
        isbn: '9788761687050',
        pid: '9394',
        stepwiseTaskData: { '42': { uid: 42, answer: 'text' } }
      }
    });

    assert.deepEqual(sent?.body.stepwiseTaskData, {
      '42': { uid: 42, answer: 'text' }
    });
  });
});

