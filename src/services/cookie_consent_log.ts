import BaseService from './base_service.js';

export interface CookieConsentRequest {
    consentState: CookieConsentState;
    consentUrl: string;
    timeStamp: number;
    uuid: string;
}

export interface CookieConsentState {
    func: number;
    stat: number;
    uuid: string;
    version: number;
}

export interface CookieConsentResponse {
    response: string
}

export class CookieConsentLog extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://cookieconsentlog.services.${this.baseDomain}`;
      case 'development':
      case 'local':
      case 'testing':
        return `https://staging-cookieconsentlog.services.${this.baseDomain}`;
      case 'test':
        return `https://localhost:3010/services/cookieconsentlog`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  };

  async logCookieConsent(
    {
      body,
      timeout = 3000
    }:
    {
      body: CookieConsentRequest,
      timeout?: number
    }
  ): Promise<string> {
    const url = `${this.getUrlPrefix()}/log`;

    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', "application/json");
    const response = await this.postAsync({url, headers, body: JSON.stringify(body), addAuthHeaders: false, timeout});
    return response.text();
  }

}

export default CookieConsentLog;
