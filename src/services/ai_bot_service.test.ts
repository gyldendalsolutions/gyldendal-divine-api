import { test, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AIBotService } from './ai_bot_service.js';

const realFetch = globalThis.fetch;

interface Sent {
  url: string;
  method?: string;
  authorization: string | null;
  contentType: string | null;
  body: Record<string, unknown>;
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
      body: JSON.parse(String(init?.body ?? '{}'))
    };
    return new Response(payload, { status });
  }) as typeof globalThis.fetch;
}

function service(): AIBotService {
  return new AIBotService({
    bearerToken: 'a-token',
    environment: 'testing',
    myAccountId: 'SYSTIMEMYACCOUNT',
    serviceUrl: 'https://example.invalid'
  });
}

const request = {
  messages: [{ role: 'user' as const, content: 'Lav et forløb' }],
  document: '## Uge 1',
  documentVersion: '## Uge 1'
};

afterEach(() => {
  globalThis.fetch = realFetch;
  sent = null;
});

describe('courseGeneratorChat', () => {
  test('posts the request to /v1/course_generator/chat', async () => {
    const reply = {
      message: { role: 'assistant', content: 'Her er forløbet.' },
      history: [{ role: 'user', content: 'Lav et forløb' }],
      context: {},
      course_document: {
        content: '## Uge 1',
        sections: [{ heading: 'Uge 1', body: '', changed: true }]
      }
    };
    captureRequests(200, JSON.stringify(reply));

    const response = await service().courseGeneratorChat({ body: request });

    assert.equal(sent?.url, 'https://example.invalid/v1/course_generator/chat');
    assert.equal(sent?.method, 'POST');
    assert.equal(sent?.authorization, 'Bearer a-token');
    assert.equal(sent?.contentType, 'application/json');
    assert.deepEqual(sent?.body, request);
    assert.deepEqual(response, reply);
  });

  test('rejects when the service refuses the token', async () => {
    captureRequests(403, '{"detail":"Forbidden"}');

    await assert.rejects(
      service().courseGeneratorChat({ body: request }),
      /Got 403/
    );
  });
});

describe('streamingCourseGeneratorChat', () => {
  test('posts to /v1/course_generator/chat/stream and returns the NDJSON body', async () => {
    const ndjson =
      '{"delta":{"role":"assistant","content":"Hej"}}\n{"history":[]}\n';
    captureRequests(200, ndjson);

    const stream = await service().streamingCourseGeneratorChat({
      body: request
    });

    assert.equal(
      sent?.url,
      'https://example.invalid/v1/course_generator/chat/stream'
    );
    assert.equal(sent?.authorization, 'Bearer a-token');
    assert.deepEqual(sent?.body, request);
    assert.equal(await new Response(stream).text(), ndjson);
  });
});
