import BaseService from './base_service.js';
import type {
  SynthesisRequest,
  SynthesisResponse
} from '@gyldendalsolutions/divine-contracts';

export class PollyService extends BaseService {
  readonly serviceName = 'polly' as const;

  async synthesize({
    body,
    timeout = 3000
  }: {
    body: SynthesisRequest;
    timeout?: number;
  }): Promise<SynthesisResponse> {
    const url = `${this.getUrlPrefix()}/synthesizeSpeech`;

    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', 'application/json');
    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify(body),
      timeout
    });
    return response.json();
  }
}

export default PollyService;
