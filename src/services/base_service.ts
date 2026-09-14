import {
  ambientOverride,
  overrideToUrl,
  reportOverride,
  type EnvironmentOverrides,
  type OverrideReporter,
  type OverrideSource
} from './service_overrides.js';
import {
  isServiceEnvironment,
  resolveServiceUrl,
  type ServiceName
} from './service_urls.js';

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
  public environmentOverrides: EnvironmentOverrides | undefined;
  public onOverride: OverrideReporter | undefined;

  /**
   * This service's entry in `SERVICE_URLS`, declared by every service in this
   * package. A subclass of our own that declares none resolves nothing from
   * the table and has to be given a `serviceUrl`.
   */
  public readonly serviceName?: ServiceName;

  constructor({
    bearerToken = undefined,
    apiKey = undefined,
    serviceUrl = undefined,
    environment = 'production',
    myAccountId = 'SYSTIMEMYACCOUNT',
    baseDomain = 'systime.dk',
    environmentOverrides = undefined,
    onOverride = undefined
  }: {
    bearerToken?: string;
    apiKey?: string;
    serviceUrl?: string;
    environment: string;
    myAccountId: string;
    baseDomain?: string;
    /**
     * Resolve individual services somewhere else than `environment` says,
     * for running a mix of local and hosted services. Build it once where
     * the application starts and hand the same object to every service.
     */
    environmentOverrides?: EnvironmentOverrides;
    /**
     * Where the notice about an applied override goes. Defaults to
     * `console.warn`, which this package writes to nowhere else.
     */
    onOverride?: OverrideReporter;
  }) {
    this.bearerToken = bearerToken;
    this.apiKey = apiKey;
    this.serviceUrl = serviceUrl;
    this.environment = environment.toLowerCase();
    this.myAccountId = myAccountId;
    this.baseDomain = baseDomain;
    this.environmentOverrides = environmentOverrides;
    this.onOverride = onOverride;
  }

  /**
   * The override that applies to this service, if any. An explicit
   * `environmentOverrides` entry beats the developer's ambient configuration,
   * and ambient configuration is not read at all in production: config that
   * arrives out of band is a hazard there whatever it happens to say.
   */
  protected findOverride():
    | { value: string; source: OverrideSource }
    | undefined {
    if (!this.serviceName) {
      return undefined;
    }

    const explicit = this.environmentOverrides?.[this.serviceName];
    if (explicit) {
      return { value: explicit, source: 'environmentOverrides' };
    }

    if (this.environment === 'production') {
      return undefined;
    }

    return ambientOverride(this.serviceName);
  }

  /**
   * Where this service answers, for the environment it was constructed with
   * or for the one an override names in its place. Ignores `serviceUrl`;
   * `getUrlPrefix()` is what honours that.
   */
  public discoverUrlPrefix(): string {
    const service = this.serviceName;
    if (!service) {
      throw new Error('Method not implemented.');
    }

    const override = this.findOverride();
    if (!override) {
      return resolveServiceUrl(service, this.environment, this.baseDomain);
    }

    const resolved = isServiceEnvironment(override.value)
      ? resolveServiceUrl(service, override.value, this.baseDomain)
      : overrideToUrl(override.value, service, override.source);

    reportOverride(
      {
        service,
        environment: this.environment,
        resolved,
        source: override.source
      },
      this.onOverride
    );

    return resolved;
  }

  public getUrlPrefix(): string {
    // If the URL has been explicitly set, return it: it is the escape hatch
    // for an endpoint the table cannot know about, so it beats everything
    // else. It is worth reporting for that same reason, since it also opts
    // the caller out of every future move of that service - but only for a
    // service the table does know, as that is the only case where there was
    // anything to opt out of.
    if (this.serviceUrl) {
      if (this.serviceName) {
        reportOverride(
          {
            service: this.serviceName,
            environment: this.environment,
            resolved: this.serviceUrl,
            source: 'serviceUrl'
          },
          this.onOverride
        );
      }
      return this.serviceUrl;
    }
    return this.discoverUrlPrefix();
  }

  public async addAuthHeaders(requestHeaders: Headers): Promise<Headers> {
    if (this.bearerToken) {
      requestHeaders.set('Authorization', `Bearer ${this.bearerToken}`);
    } else if (this.apiKey) {
      requestHeaders.set('x-api-key', this.apiKey);
    }
    return requestHeaders;
  }

  async getAsync({
    url,
    headers,
    addAuthHeaders = true,
    timeout
  }: {
    url: URL | string;
    headers: Headers | undefined | null;
    addAuthHeaders?: boolean;
    timeout: number;
  }): Promise<Response> {
    const method = 'GET';
    return await this.callAsync({
      url,
      body: null,
      method,
      headers,
      addAuthHeaders,
      timeout
    });
  }

  async putAsync({
    url,
    headers,
    addAuthHeaders = true,
    body,
    timeout
  }: {
    url: URL | string;
    headers: Headers | undefined | null;
    addAuthHeaders?: boolean;
    body: string | null | undefined;
    timeout: number;
  }): Promise<Response> {
    const method = 'PUT';
    return await this.callAsync({
      url,
      body,
      method,
      headers,
      addAuthHeaders,
      timeout
    });
  }

  async postAsync({
    url,
    headers,
    addAuthHeaders = true,
    body,
    timeout
  }: {
    url: URL | string;
    headers: Headers | undefined | null;
    addAuthHeaders?: boolean;
    body: string | null | undefined;
    timeout: number;
  }): Promise<Response> {
    const method = 'POST';
    return await this.callAsync({
      url,
      body,
      method,
      headers,
      addAuthHeaders,
      timeout
    });
  }

  async deleteAsync({
    url,
    headers,
    addAuthHeaders = true,
    timeout
  }: {
    url: URL | string;
    headers: Headers | undefined | null;
    addAuthHeaders?: boolean;
    timeout: number;
  }): Promise<Response> {
    const method = 'DELETE';
    return await this.callAsync({
      url,
      body: null,
      method,
      headers,
      addAuthHeaders,
      timeout
    });
  }

  async patchAsync({
    url,
    headers,
    addAuthHeaders = true,
    body,
    timeout
  }: {
    url: URL | string;
    headers: Headers | undefined | null;
    addAuthHeaders?: boolean;
    body: string | null | undefined;
    timeout: number;
  }): Promise<Response> {
    const method = 'PATCH';
    return await this.callAsync({
      url,
      body,
      method,
      headers,
      addAuthHeaders,
      timeout
    });
  }

  async callAsync({
    url,
    body,
    method,
    headers,
    timeout,
    addAuthHeaders
  }: {
    url: URL | string;
    body: string | null | undefined;
    method: string;
    headers: Headers | undefined | null;
    timeout: number;
    addAuthHeaders?: boolean;
  }): Promise<Response> {
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
      throw new HTTPError(
        `Got ${response.status} while calling ${response.url}`,
        response
      );
    }
    return response;
  }
}
export default BaseService;
