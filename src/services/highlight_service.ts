import BaseService from './base_service.js';
import type {
  HighlightAddResult,
  HighlightCountResponse,
  HighlightDeleteResult,
  HighlightRequest,
  HighlightResponse,
  HighlightResultType,
  HighlightSearchRequest,
  HighlightSearchResponse,
  HighlightUpdateRequest,
  HighlightUpdateResponse
} from '@gyldendalsolutions/divine-contracts';

export class HighlightService extends BaseService {
  readonly serviceName = 'highlight' as const;

  async search({
    search,
    timeout = 3000
  }: {
    search: HighlightSearchRequest;
    timeout?: number;
  }): Promise<HighlightSearchResponse> {
    const url = `${this.getUrlPrefix()}/v2/search`;

    const headers: HeadersInit = new Headers();
    headers.append('Content-Type', 'application/json');
    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify(search),
      timeout
    });
    return response.json();
  }

  async deleteHighlightOrNote({
    isbn,
    pid,
    key,
    timeout = 3000
  }: {
    isbn: string;
    pid: number;
    key: number;
    timeout?: number;
  }): Promise<HighlightDeleteResult> {
    const url = `${this.getUrlPrefix()}/v2/isbn/${isbn}/pid/${pid}/key/${key}`;

    const headers: HeadersInit = new Headers();
    headers.append('Content-Type', 'application/json');
    const response = await this.deleteAsync({ url, headers, timeout });
    return response.json();
  }

  async getHighlightOrNote({
    isbn,
    pid,
    timeout = 3000
  }: {
    isbn: string;
    pid?: number;
    timeout?: number;
  }): Promise<HighlightResponse[]> {
    let url = `${this.getUrlPrefix()}/v2/isbn/${isbn}`;
    if (pid) {
      url += `/pid/${pid}`;
    }

    const headers: HeadersInit = new Headers();

    const response = await this.getAsync({ url, headers, timeout });
    if (response.status === 204) {
      return [];
    }
    return response.json();
  }

  async getHighlightOrNoteCounts({
    noteType,
    timeout = 3000
  }: {
    noteType?: HighlightResultType;
    timeout?: number;
  }): Promise<HighlightCountResponse[]> {
    let url = `${this.getUrlPrefix()}/v2/count`;
    if (noteType) {
      url += `/${noteType}`;
    }

    const headers: HeadersInit = new Headers();

    const response = await this.getAsync({ url, headers, timeout });
    if (response.status === 204) {
      return [];
    }
    return response.json();
  }

  async updateHighlightOrNote({
    payload,
    isbn,
    pid,
    key,
    timeout = 5000
  }: {
    payload: HighlightUpdateRequest;
    isbn: string;
    pid: number;
    key: number;
    timeout?: number;
  }): Promise<HighlightUpdateResponse> {
    const url = `${this.getUrlPrefix()}/v2/isbn/${isbn}/pid/${pid}/key/${key}`;
    const headers: HeadersInit = new Headers();

    headers.set('Content-Type', 'application/json');
    const response = await this.putAsync({
      url,
      headers,
      body: JSON.stringify(payload),
      timeout
    });
    return response.json();
  }

  async addHighlightOrNote({
    payload,
    isbn,
    pid,
    timeout = 5000
  }: {
    payload: HighlightRequest;
    isbn: string;
    pid: number;
    timeout?: number;
  }): Promise<HighlightAddResult> {
    const url = `${this.getUrlPrefix()}/v2/isbn/${isbn}/pid/${pid}`;
    const headers: HeadersInit = new Headers();

    headers.set('Content-Type', 'application/json');
    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify(payload),
      timeout
    });
    return response.json();
  }
}

export default HighlightService;
