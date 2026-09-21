import BaseService from './base_service.js';
import type { CookieConsentRequest } from '@gyldendalsolutions/divine-contracts';

export class CookieConsentLog extends BaseService {
  readonly serviceName = 'cookieConsentLog' as const;

  async logCookieConsent({
    body,
    timeout = 3000
  }: {
    body: CookieConsentRequest;
    timeout?: number;
  }): Promise<string> {
    const url = `${this.getUrlPrefix()}/log`;

    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', 'application/json');
    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify(body),
      addAuthHeaders: false,
      timeout
    });
    return response.text();
  }
}

export default CookieConsentLog;
