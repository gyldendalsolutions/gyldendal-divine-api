import BaseService from './base_service.js';

export enum SSMLSpeechSpeeds {
  X_SLOW = 1,
  SLOW = 2,
  MEDIUM = 3,
  FAST = 4,
  X_FAST = 5
}

export type SpeechmarkEvent = {
  time: number;
  type?: string;
  value: string;
  start?: number;
  end?: number;
};

export interface SynthesisResponse {
  mp3url: string;
  s3: string[];
  SpeechMarks?: SpeechmarkEvent[];
}

export interface SynthesisRequest {
  text: string;
  includeSpeechMarks?: boolean;
  voice: number;
  speed?: SSMLSpeechSpeeds;
}

export class PollyService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://appear-polly.services.${this.baseDomain}`;
      case 'development':
      case 'local':
      case 'testing':
        return `https://staging-appear-polly.services.${this.baseDomain}`;
      case 'test':
        return `https://localhost:3010/services/polly`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  }

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
