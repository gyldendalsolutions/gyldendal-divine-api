import BaseService from './base_service.js';

/** One step of a user's answer, as the client stores it. */
export interface StepwiseTaskDataItem {
  [field: string]: unknown;
}

/**
 * The steps of an answer. The service stores whatever it is handed and reads
 * it back the same way, and the reader keeps them keyed by uid rather than in
 * a list, so both shapes are allowed here rather than one being imposed on
 * data that already exists.
 */
export type StepwiseTaskData =
  | StepwiseTaskDataItem[]
  | Record<string, StepwiseTaskDataItem>;

export interface WritingTaskResponse {
  cid: string;
  createdtime?: number;
  dateString?: string;
  deleted?: boolean | string;
  deletedDate?: string | null;
  isbn: string;
  myaccountId?: string;
  pid: string;
  stepwiseTaskDataItems?: StepwiseTaskData;
  uid?: string;
  userId?: string;
}

/** The service answers with one bucket per requested cid. */
export interface WritingTaskResponseBucket {
  Count?: number;
  ScannedCount?: number;
  Items?: WritingTaskResponse[];
}

export interface WritingTaskAnswer {
  cid: string;
  isbn: string;
  pid: string;
  stepwiseTaskData: StepwiseTaskData;
  dateString?: string;
  mainTitle?: string;
  /** Always empty for a real user; the service stores what it is given. */
  userName?: string;
}

/**
 * The writing task service authenticates on the bearer token but still reads
 * the user from the request body, and only accepts the token when its `sub`
 * claim matches that `userId`. It also keys stored answers by user and
 * account, so both travel in every body here rather than being taken from the
 * token as the highlight service does.
 */
export class WritingTaskService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://writingtask.services.${this.baseDomain}`;
      case 'development':
      case 'testing':
        return `https://staging-writingtask.services.${this.baseDomain}`;
      case 'local':
        return `http://127.0.0.1:4140`;
      case 'test':
        return `https://localhost:3010/services/writingtask`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  }

  /** Answers stored for the given content ids, one bucket per cid. */
  async getResponse({
    userId,
    isbn,
    pid,
    cids,
    timeout = 5000
  }: {
    userId: string;
    isbn: string;
    pid: string;
    cids: string[];
    timeout?: number;
  }): Promise<WritingTaskResponseBucket[]> {
    const url = `${this.getUrlPrefix()}/getResponse`;
    const headers: HeadersInit = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify({
        userId,
        isbn,
        pid,
        cids,
        myaccountId: this.myAccountId
      }),
      timeout
    });
    return response.json();
  }

  /**
   * Stores an answer. The service upserts on the content id, so this covers
   * both the first save and every later one.
   */
  async newResponse({
    userId,
    answer,
    timeout = 5000
  }: {
    userId: string;
    answer: WritingTaskAnswer;
    timeout?: number;
  }): Promise<void> {
    const url = `${this.getUrlPrefix()}/newResponse`;
    const headers: HeadersInit = new Headers();
    headers.set('Content-Type', 'application/json');

    await this.postAsync({
      url,
      headers,
      body: JSON.stringify({
        ...answer,
        userId,
        myaccountId: this.myAccountId
      }),
      timeout
    });
  }

  /** Marks a stored answer deleted. */
  async deleteResponse({
    userId,
    cid,
    isbn,
    pid,
    timeout = 5000
  }: {
    userId: string;
    cid: string;
    isbn: string;
    pid: string;
    timeout?: number;
  }): Promise<void> {
    const url = `${this.getUrlPrefix()}/deleteResponse`;
    const headers: HeadersInit = new Headers();
    headers.set('Content-Type', 'application/json');

    await this.postAsync({
      url,
      headers,
      body: JSON.stringify({
        userId,
        cid,
        isbn,
        pid,
        myaccountId: this.myAccountId
      }),
      timeout
    });
  }
}
export default WritingTaskService;
