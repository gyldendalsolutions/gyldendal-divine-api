import { test, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { SearchResponse } from '@gyldendalsolutions/divine-contracts';
import { SolrProxyService } from './solr_proxy_service.js';
import { HTTPError } from './base_service.js';

const realFetch = globalThis.fetch;

interface Sent {
  url: string;
  method?: string;
  authorization: string | null;
  apiKey: string | null;
  contentType: string | null;
  body: Record<string, unknown>;
  signal?: AbortSignal | null;
}

let sent: Sent | null = null;

function captureRequests(status = 200, payload: unknown = {}): void {
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const headers = new Headers(init?.headers);
    sent = {
      url: String(url),
      method: init?.method,
      authorization: headers.get('Authorization'),
      apiKey: headers.get('x-api-key'),
      contentType: headers.get('Content-Type'),
      body: JSON.parse(String(init?.body ?? '{}')),
      signal: init?.signal
    };
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof globalThis.fetch;
}

function service(auth: { bearerToken?: string; apiKey?: string } = { bearerToken: 'a-token' }): SolrProxyService {
  return new SolrProxyService({
    ...auth,
    environment: 'testing',
    myAccountId: 'SYSTIMEMYACCOUNT',
    serviceUrl: 'https://example.invalid'
  });
}

const RESPONSE: SearchResponse = {
  query: 'fotosyntese',
  total: 1,
  total_is_lower_bound: false,
  page: 1,
  size: 10,
  pages: 1,
  hits: [{
    id: 'h1',
    book: 'exo.systime.dk',
    language: 'da',
    type: 'content',
    title: 'Fotosyntese',
    url: 'https://exo.systime.dk/?id=10#c100',
    snippets: ['Planterne laver <mark>fotosyntese</mark>.'],
    score: 0.03
  }],
  books: {
    'exo.systime.dk': { id: 'exo.systime.dk', hostname: 'exo.systime.dk', languages: ['da'] }
  }
};

afterEach(() => {
  globalThis.fetch = realFetch;
  sent = null;
});

describe('searchBook', () => {
  test('posts the request to the book\'s search endpoint', async () => {
    captureRequests(200, RESPONSE);

    const result = await service().searchBook({
      hostname: 'exo.systime.dk',
      search: { q: 'fotosyntese', types: ['content', 'image'], size: 20 }
    });

    assert.equal(sent?.url, 'https://example.invalid/api/v2/books/exo.systime.dk/search');
    assert.equal(sent?.method, 'POST');
    assert.equal(sent?.authorization, 'Bearer a-token');
    assert.equal(sent?.contentType, 'application/json');
    assert.deepEqual(sent?.body, { q: 'fotosyntese', types: ['content', 'image'], size: 20 });
    assert.equal(result.hits?.[0]?.book, 'exo.systime.dk');
  });

  test('keeps the query out of the URL', async () => {
    captureRequests(200, RESPONSE);

    await service().searchBook({ hostname: 'exo.systime.dk', search: { q: 'hemmeligt' } });

    assert.ok(!sent?.url.includes('hemmeligt'));
  });

  test('encodes the hostname as one path segment', async () => {
    captureRequests(200, RESPONSE);

    await service().searchBook({ hostname: 'a/b', search: { q: 'x' } });

    assert.equal(sent?.url, 'https://example.invalid/api/v2/books/a%2Fb/search');
  });

  test('rejects with the response on a 404', async () => {
    captureRequests(404, { detail: 'No such book.' });

    await assert.rejects(
      service().searchBook({ hostname: 'nope.dk', search: { q: 'x' } }),
      (error: unknown) => error instanceof HTTPError && error.response.status === 404
    );
  });
});

describe('searchBooks', () => {
  test('posts the book selection, grouping and facets to /api/v2/search', async () => {
    captureRequests(200, { ...RESPONSE, hits: undefined, groups: [] });

    await service({ apiKey: 'a-key' }).searchBooks({
      search: {
        q: 'fotosyntese',
        books: { isbn13: ['9788761691234'] },
        group_by_book: { hits: 3 },
        facets: ['category'],
        groups: ['2']
      }
    });

    assert.equal(sent?.url, 'https://example.invalid/api/v2/search');
    assert.equal(sent?.apiKey, 'a-key');
    assert.equal(sent?.authorization, null);
    assert.deepEqual(sent?.body, {
      q: 'fotosyntese',
      books: { isbn13: ['9788761691234'] },
      group_by_book: { hits: 3 },
      facets: ['category'],
      groups: ['2']
    });
  });
});

describe('languages', () => {
  test('a list of languages goes as given, primary first', async () => {
    captureRequests(200, RESPONSE);

    const result = await service().searchBook({
      hostname: 'exo.systime.dk',
      search: { q: 'fotosyntese', language: ['da', 'en'] }
    });

    assert.deepEqual(sent?.body, { q: 'fotosyntese', language: ['da', 'en'] });
    assert.equal(result.hits?.[0]?.language, 'da');
    assert.deepEqual(result.books['exo.systime.dk']?.languages, ['da']);
  });
});

describe('suggestBook', () => {
  test('posts what has been typed to the book\'s suggest endpoint', async () => {
    captureRequests(200, { suggestions: ['fotosyntese'] });

    const result = await service().suggestBook({
      hostname: 'exo.systime.dk',
      suggest: { q: 'fotos', limit: 6 }
    });

    assert.equal(sent?.url, 'https://example.invalid/api/v2/books/exo.systime.dk/suggest');
    assert.equal(sent?.method, 'POST');
    assert.deepEqual(sent?.body, { q: 'fotos', limit: 6 });
    assert.deepEqual(result.suggestions, ['fotosyntese']);
  });

  test('a stale suggestion request can be aborted by the caller', async () => {
    captureRequests(200, { suggestions: [] });
    const controller = new AbortController();

    await service().suggestBook({
      hostname: 'exo.systime.dk',
      suggest: { q: 'fo' },
      signal: controller.signal
    });
    assert.equal(sent?.signal?.aborted, false);

    controller.abort();
    assert.equal(sent?.signal?.aborted, true);
  });
});
