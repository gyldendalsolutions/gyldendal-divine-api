import BaseService from './base_service.js';
import type {
  SearchBookRequest,
  SearchBooksRequest,
  SearchResponse,
  SearchSuggestRequest,
  SearchSuggestResponse
} from '@gyldendalsolutions/divine-contracts';

/**
 * The v2 search API: typed search endpoints, where v1 passed raw search
 * queries through.
 *
 * Authenticate with the book's search token as `bearerToken` (a browser:
 * the user's groups come from the token) or with an `apiKey` (a server; it
 * may state the user's groups in the request only if its configuration
 * allows it). Every call is a POST, so the query never lands in a URL, and
 * with it in proxy and access logs.
 */
export class SolrProxyService extends BaseService {
  readonly serviceName = 'solrProxy' as const;

  /**
   * Searches one book. `hostname` is the book's primary hostname or any of
   * its aliases; the hits' URLs use the one given. Rejects with a 404 for a
   * book that does not exist or is outside the client's scope alike.
   */
  async searchBook({
    hostname,
    search,
    timeout = 10000,
    signal
  }: {
    hostname: string;
    search: SearchBookRequest;
    timeout?: number;
    signal?: AbortSignal;
  }): Promise<SearchResponse> {
    const url = `${this.getUrlPrefix()}/api/v2/books/${encodeURIComponent(hostname)}/search`;
    return this.post<SearchResponse>(url, search, timeout, signal);
  }

  /**
   * Searches many books: every book the client may search, or those in
   * `search.books`. With `group_by_book`, pages over books instead of hits.
   */
  async searchBooks({
    search,
    timeout = 10000,
    signal
  }: {
    search: SearchBooksRequest;
    timeout?: number;
    signal?: AbortSignal;
  }): Promise<SearchResponse> {
    const url = `${this.getUrlPrefix()}/api/v2/search`;
    return this.post<SearchResponse>(url, search, timeout, signal);
  }

  /**
   * Completions of the word being typed, from the book's headings. Pass a
   * `signal` and abort it on the next keystroke, so a slow answer for an
   * earlier prefix cannot overwrite a newer one.
   */
  async suggestBook({
    hostname,
    suggest,
    timeout = 3000,
    signal
  }: {
    hostname: string;
    suggest: SearchSuggestRequest;
    timeout?: number;
    signal?: AbortSignal;
  }): Promise<SearchSuggestResponse> {
    const url = `${this.getUrlPrefix()}/api/v2/books/${encodeURIComponent(hostname)}/suggest`;
    return this.post<SearchSuggestResponse>(url, suggest, timeout, signal);
  }

  private async post<T>(
    url: string,
    body: unknown,
    timeout: number,
    signal: AbortSignal | undefined
  ): Promise<T> {
    const headers: HeadersInit = new Headers();
    headers.set('Content-Type', 'application/json');
    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify(body),
      timeout,
      signal
    });
    return response.json() as Promise<T>;
  }
}

export default SolrProxyService;
