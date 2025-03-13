class HTTPError extends Error {
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
      timeout
    }:
    {
      url: URL | string,
      headers: Headers | undefined | null,
      timeout: number
    }
  ): Promise<object> {
    const method = 'GET';
    const response = await this.callAsync({ url, body: null, method, headers, timeout });
    return response.json();
  }

  async putAsync(
    {
      url,
      headers,
      body,
      timeout
    }:
    {
      url: URL | string,
      headers: Headers | undefined | null,
      body: string | null | undefined,
      timeout: number
    }
  ): Promise<object> {
    const method = 'PUT';
    const response = await this.callAsync({ url, body, method, headers, timeout });
    return response.json();
  }

  async postAsync(
    {
      url,
      headers,
      body,
      timeout
    }:
    {
      url: URL | string,
      headers: Headers | undefined | null,
      body: string | null | undefined,
      timeout: number
    }
  ): Promise<object> {
    const method = 'POST';
    const response = await this.callAsync({ url, body, method, headers, timeout });
    return response.json();
  }

  async deleteAsync(
    {
      url,
      headers,
      timeout
    }:
    {
      url: URL | string,
      headers: Headers | undefined | null,
      timeout: number
    }
  ): Promise<object> {
    const method = 'DELETE';
    const response = await this.callAsync({ url, body: null, method, headers, timeout });
    return response.json();
  }

  async callAsync(
    {
      url,
      body,
      method,
      headers,
      timeout
    }:
    {
      url: URL | string,
      body: string | null | undefined,
      method: string,
      headers: Headers | undefined | null,
      timeout: number
    }
  ): Promise<Response> {
    if (!headers) {
      headers = new Headers();
    }

    headers = await this.addAuthHeaders(headers);
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
