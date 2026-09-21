import BaseService from './base_service.js';
import type {
  AIChatCompletion,
  AIChatCompletionRequest
} from '@gyldendalsolutions/divine-contracts';

type GenericContext = Record<string, unknown>;

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
}

export default AIBotService;
