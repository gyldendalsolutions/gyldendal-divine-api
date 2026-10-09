import BaseService from './base_service.js';
import type {
  AIChatCompletion,
  AIChatCompletionRequest,
  TutorConfig,
  TutorSession,
  TutorSessionRequest
} from '@gyldendalsolutions/divine-contracts';

export class AIBotService extends BaseService {
  readonly serviceName = 'aiBot' as const;

  async constructChatUrl({
    interactivityId,
    isbn,
    stream
  }: {
    interactivityId?: string;
    isbn?: string;
    stream: boolean;
  }): Promise<string> {
    if (interactivityId && isbn) {
      throw new Error('interactivityId and isbn are mutually exclusive');
    }

    if (!interactivityId && !isbn) {
      throw new Error('Either interactivityId or isbn must be provided');
    }

    let url = '';
    if (interactivityId) {
      url = `${this.getUrlPrefix()}/${interactivityId}/chat`;
    }

    if (isbn) {
      url = `${this.getUrlPrefix()}/interactivity_from_isbn/${isbn}`;
    }

    if (stream) {
      url += '/stream';
    }

    return url;
  }

  async chat({
    interactivityId,
    isbn,
    body,
    timeout = 10000
  }: {
    interactivityId?: string;
    isbn?: string;
    body: AIChatCompletionRequest;
    timeout?: number;
  }): Promise<AIChatCompletion> {
    const url = await this.constructChatUrl({
      interactivityId,
      isbn,
      stream: false
    });

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

  async streamingChat({
    interactivityId,
    isbn,
    body,
    timeout = 10000
  }: {
    interactivityId?: string;
    isbn?: string;
    body: AIChatCompletionRequest;
    timeout?: number;
  }): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>> {
    const url = await this.constructChatUrl({
      interactivityId,
      isbn,
      stream: true
    });

    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', 'application/json');
    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify(body),
      timeout
    });
    const responseBody = response.body;
    if (!responseBody) {
      throw new Error('Response body is null');
    }
    return responseBody;
  }

  async getTutorConfig({
    isbn,
    extraHeaders,
    timeout = 10000
  }: {
    isbn: string;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<TutorConfig> {
    const url = `${this.getUrlPrefix()}/v1/tutor/config/${encodeURIComponent(isbn)}`;
    const headers = extraHeaders ? new Headers(extraHeaders) : null;

    const response = await this.getAsync({ url, headers, timeout });
    return response.json();
  }

  async createTutorSession({
    isbn,
    extraHeaders,
    timeout = 10000
  }: {
    isbn: string;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<TutorSession> {
    const url = `${this.getUrlPrefix()}/v1/tutor/session`;

    const headers = new Headers(extraHeaders);
    headers.set('Content-Type', 'application/json');
    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify({ isbn13: isbn } satisfies TutorSessionRequest),
      timeout
    });
    return response.json();
  }
}

export default AIBotService;
