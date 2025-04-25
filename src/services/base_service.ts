export class HTTPError extends Error {
  public response: Response;
  
  constructor(message: string, response: Response) {
    super();
    this.message = message;
    this.response = response;
  }
}

export class BaseService {
  public bearerToken: string | undefined;
  public apiKey: string | undefined;
  public serviceUrl: string | undefined;
  public environment: string;
  public myAccountId: string;
  public baseDomain: string;

  constructor({
    bearerToken = undefined,
    apiKey = undefined,
    serviceUrl = undefined,
    environment = 'production',
    myAccountId = 'SYSTIMEMYACCOUNT',
    baseDomain = 'systime.dk',
  } : {
      bearerToken?: string,
      apiKey?: string,
      serviceUrl?: string,
      environment: string,
      myAccountId: string,
      baseDomain?: string
    }) {
    this.bearerToken = bearerToken;
    this.apiKey = apiKey;
    this.serviceUrl = serviceUrl;
    this.environment = environment;
    this.myAccountId = myAccountId;
    this.baseDomain = baseDomain;
  }

  protected discoverUrlPrefix(): string {
    throw new Error('Method not implemented.');
  }

  public getUrlPrefix(): string {
    // If the URL has been explicitly set, return it.
    if (this.serviceUrl) {
      return this.serviceUrl;
    }
    return this.discoverUrlPrefix()
  }

  public async addAuthHeaders(requestHeaders: Headers): Promise<Headers> {
    if (this.bearerToken) {
      requestHeaders.set('Authorization', `Bearer ${this.bearerToken}`);
    } else if (this.apiKey) {
      requestHeaders.set('x-api-key', this.apiKey);
    }
    return requestHeaders;
  }

  async getAsync(
    {
      url,
      headers,
      addAuthHeaders = true,
      timeout
    }:
    {
      url: URL | string,
      headers: Headers | undefined | null,
      addAuthHeaders?: boolean,
      timeout: number
    }
  ): Promise<Response> {
    const method = 'GET';
    return await this.callAsync({ url, body: null, method, headers, addAuthHeaders, timeout });
  }

  async putAsync(
    {
      url,
      headers,
      addAuthHeaders = true,
      body,
      timeout
    }:
    {
      url: URL | string,
      headers: Headers | undefined | null,
      addAuthHeaders?: boolean,
      body: string | null | undefined,
      timeout: number
    }
  ): Promise<Response> {
    const method = 'PUT';
    return await this.callAsync({ url, body, method, headers, addAuthHeaders, timeout });
  }

  async postAsync(
    {
      url,
      headers,
      addAuthHeaders = true,
      body,
      timeout
    }:
    {
      url: URL | string,
      headers: Headers | undefined | null,
      addAuthHeaders?: boolean,
      body: string | null | undefined,
      timeout: number
    }
  ): Promise<Response> {
    const method = 'POST';
    return await this.callAsync({ url, body, method, headers, addAuthHeaders, timeout });
  }

  async deleteAsync(
    {
      url,
      headers,
      addAuthHeaders = true,
      timeout
    }:
    {
      url: URL | string,
      headers: Headers | undefined | null,
      addAuthHeaders?: boolean,
      timeout: number
    }
  ): Promise<Response> {
    const method = 'DELETE';
    return await this.callAsync({ url, body: null, method, headers, addAuthHeaders, timeout });
  }

  async callAsync(
    {
      url,
      body,
      method,
      headers,
      timeout,
      addAuthHeaders
    }:
    {
      url: URL | string,
      body: string | null | undefined,
      method: string,
      headers: Headers | undefined | null,
      timeout: number,
      addAuthHeaders?: boolean,
    }
  ): Promise<Response> {
    if (!headers) {
      headers = new Headers();
    }

    if (addAuthHeaders) {
      headers = await this.addAuthHeaders(headers);
    }

    const response = await fetch(url, {
      method: method,
      body: body,
      headers: headers,
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
		throw new HTTPError(`Got ${response.status} while calling ${response.url}`, response);
    }
    return response;
  }
}
export default BaseService;
