import BaseService from './base_service.js';
import { resolveServiceUrl } from './service_urls.js';
import type {
  Answer,
  AnswerBins,
  AnswerIcon,
  CalculatedScore,
  ChosenAnswer,
  Dropdown,
  DropdownMap,
  FormattedQuestion,
  FormattedQuizUnit,
  FormattedSharedStudentQuiz,
  FormattedSharedTeacherQuiz,
  InputText,
  InputTextMap,
  Mediafile,
  NewAnswer,
  ProblemAnswerState,
  ProblemField,
  ProblemScore,
  Question,
  Quiz,
  QuizDescriptionData,
  QuizFormError,
  QuizFormResponse,
  QuizFormSuccess,
  QuizFormType,
  QuizLocalState,
  QuizResult,
  QuizSession,
  QuizTableAction,
  QuizTableItem,
  QuizTextSettings,
  QuizUnit,
  Results,
  SaveAnswer,
  Score,
  SearchableKeys,
  SharedQuizBase,
  SharedQuizData,
  SharedQuizUserInfo,
  SharedStudentQuiz,
  SharedTeacherQuiz,
  TableData,
  TableDataColumn,
  TimeSpent,
  Tokens,
  TokensDiffCheck,
  WordOptions,
  WordOptionsOption
} from '@gyldendalsolutions/divine-api-types';

export interface QuizStartResponse {
  quizUnitId: number;
}

export interface DropdownFormattedOption {
  answerId: number;
  options: Dropdown[];
  originalOptions: Dropdown[];
}

export interface WordOptionsAnswer {
  answerId?: number;
  options?: (string | AnswerIcon)[];
  text: WordOptionsAnswerText | undefined;
  index: number;
  selected?: undefined | string | AnswerIcon;
}

export interface WordOptionsAnswerText {
  answers: string;
  words: string;
  position: number;
}

export interface SaveAnswerResponse {
  Result: string;
}

const REQUEST_TIMEOUT = 10000; // 10 seconds

export class QuizService extends BaseService {
  readonly serviceName = 'quiz' as const;

  /**
   * Where a mediafile `identifier` is served from: the API prefix without its
   * path, so the host mapping stays in `SERVICE_URLS` alone and everything
   * that can redirect the API — an explicit `serviceUrl`, a per-service
   * override — carries the media with it.
   *
   * The exception is the mock server, where the app serves the fixtures
   * itself and their identifiers are already relative to it. That is asked of
   * the resolved prefix rather than of `environment`, so it stays true when a
   * caller is sent to the mock by an override, and stops being true when one
   * sends them somewhere real from the mock environment.
   */
  getMediaUrlPrefix(): string {
    const prefix = this.getUrlPrefix();
    if (prefix === resolveServiceUrl('quiz', 'test', this.baseDomain)) {
      return '';
    }
    return new URL(prefix).origin;
  }

  private makeHeaders(extra?: Record<string, string>): Headers {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    if (extra) {
      for (const [key, val] of Object.entries(extra)) {
        headers.append(key, val);
      }
    }

    return headers;
  }

  // ─────────────────────────────────────────────────────────────
  //  Legacy Gale quizzes
  // ─────────────────────────────────────────────────────────────

  async checkActiveSession({
    isbn,
    quiz,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    isbn: string;
    quiz: number;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<QuizStartResponse> {
    const url = `${this.getUrlPrefix()}/isbn/${isbn}/quiz/${quiz}`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  async startQuiz({
    isbn,
    quiz,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    isbn: string;
    quiz: number;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<QuizStartResponse> {
    const url = `${this.getUrlPrefix()}/isbn/${isbn}/quiz/${quiz}`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.postAsync({ url, headers, body: '{}', timeout });
    return await res.json();
  }

  async getProblems({
    isbn,
    quizUnitId,
    shared,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    isbn: string;
    quizUnitId: number;
    shared?: boolean;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<Quiz> {
    const url = shared
      ? `${this.getUrlPrefix()}/shared/student/${quizUnitId}`
      : `${this.getUrlPrefix()}/isbn/${isbn}/student/${quizUnitId}`;

    const headers = this.makeHeaders(extraHeaders);
    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  async resetAnswer({
    isbn,
    quizUnitId,
    questionID,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    isbn: string;
    quizUnitId: number;
    questionID: number;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }) {
    const url = `${this.getUrlPrefix()}/isbn/${isbn}/student/${quizUnitId}/question/${questionID}`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.putAsync({
      url,
      headers,
      body: JSON.stringify({}),
      timeout
    });

    return await res.json();
  }

  async saveAnswer({
    isbn,
    quizUnitId,
    answer,
    shared,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    isbn: string;
    quizUnitId: number;
    answer: object;
    shared?: boolean;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<SaveAnswerResponse> {
    const url = shared
      ? `${this.getUrlPrefix()}/shared/student/${quizUnitId}`
      : `${this.getUrlPrefix()}/isbn/${isbn}/student/${quizUnitId}`;

    const headers = this.makeHeaders(extraHeaders);

    const res = await this.putAsync({
      url,
      headers,
      body: JSON.stringify(answer),
      timeout
    });

    return await res.json();
  }

  async finishQuiz({
    isbn,
    quizUnitId,
    shared,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    isbn: string;
    quizUnitId: number;
    shared?: boolean;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }) {
    const url = shared
      ? `${this.getUrlPrefix()}/shared/student/${quizUnitId}/finish`
      : `${this.getUrlPrefix()}/isbn/${isbn}/student/${quizUnitId}`;

    const headers = this.makeHeaders(extraHeaders);

    const res = await this.postAsync({
      url,
      headers,
      body: JSON.stringify({}),
      timeout
    });

    return await res.json();
  }

  async getResults({
    isbn,
    quizUnitId,
    shared,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    isbn: string;
    quizUnitId: number;
    shared?: boolean;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<QuizResult> {
    const url = shared
      ? `${this.getUrlPrefix()}/shared/student/${quizUnitId}/result`
      : `${this.getUrlPrefix()}/isbn/${isbn}/student/overview/${quizUnitId}`;

    const headers = this.makeHeaders(extraHeaders);

    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  // ─────────────────────────────────────────────────────────────
  // Shared quizzes
  // ─────────────────────────────────────────────────────────────

  async addSharedQuiz({
    quizSessionId,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    quizSessionId: number;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<QuizStartResponse> {
    const url = `${this.getUrlPrefix()}/shared/student/${quizSessionId}`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.postAsync({ url, headers, body: '{}', timeout });
    return await res.json();
  }

  async setQuizStartTime({
    quizUnitId,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    quizUnitId: number;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<void> {
    const url = `${this.getUrlPrefix()}/shared/student/${quizUnitId}/start`;
    const headers = this.makeHeaders(extraHeaders);

    await this.putAsync({ url, headers, body: '{}', timeout });
  }

  async createSharedQuiz({
    quizData,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    quizData: SharedQuizData;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<QuizFormResponse> {
    const url = `${this.getUrlPrefix()}/shared/quiz`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.postAsync({
      url,
      headers,
      body: JSON.stringify(quizData),
      timeout
    });

    return await res.json();
  }

  async copyEditSharedQuiz({
    quizSessionId,
    quizData,
    action,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    quizSessionId: number;
    quizData: SharedQuizData;
    action: Exclude<QuizFormType, 'create'>;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<QuizFormResponse> {
    const url = `${this.getUrlPrefix()}/shared/quiz/${quizSessionId}`;
    const method = action === 'edit' ? 'PUT' : 'POST';
    const headers = this.makeHeaders(extraHeaders);

    const res =
      method === 'PUT'
        ? await this.putAsync({
            url,
            headers,
            body: JSON.stringify(quizData),
            timeout
          })
        : await this.postAsync({
            url,
            headers,
            body: JSON.stringify(quizData),
            timeout
          });

    return await res.json();
  }

  async getTeachersQuizProblems({
    quizSessionId,
    extraHeaders,
    timeout = REQUEST_TIMEOUT,
    includeDisabled = false
  }: {
    quizSessionId: number;
    extraHeaders?: Record<string, string>;
    timeout?: number;
    includeDisabled?: boolean;
  }): Promise<Quiz> {
    const url = `${this.getUrlPrefix()}/shared/teacher/quizzes/${quizSessionId}/problems?includeDisabled=${includeDisabled}`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  async getTeachersUnitOverview({
    quizSessionId,
    quizUnitId,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    quizSessionId: number;
    quizUnitId: number;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<QuizResult> {
    const url = `${this.getUrlPrefix()}/shared/teacher/quizzes/${quizSessionId}/units/${quizUnitId}`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  async activateDeactivateQuestion({
    quizSessionId,
    questionId,
    activate,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    quizSessionId: string;
    questionId: number;
    activate: boolean;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }) {
    const url = `${this.getUrlPrefix()}/shared/teacher/quiz/${quizSessionId}/question/${questionId}`;
    const method = activate ? 'PATCH' : 'DELETE';

    const headers = this.makeHeaders(extraHeaders);

    const res =
      method === 'PATCH'
        ? await this.patchAsync({
            url,
            headers,
            body: null,
            timeout
          })
        : await this.deleteAsync({ url, headers, timeout });

    return await res.json();
  }

  async getTeachersQuizzes({
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<SharedTeacherQuiz[]> {
    const url = `${this.getUrlPrefix()}/shared/teacher/quizzes`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  async getStudentsQuizzes({
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<SharedStudentQuiz[]> {
    const url = `${this.getUrlPrefix()}/shared/student/quizzes`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  async getTeachersQuiz({
    quizSessionId,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    quizSessionId: string;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<QuizSession> {
    const url = `${this.getUrlPrefix()}/shared/teacher/quizzes/${quizSessionId}`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  async toggleArchiveQuiz({
    quizSessionId,
    archive,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    quizSessionId: string;
    archive: boolean;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }) {
    const url = `${this.getUrlPrefix()}/shared/quiz/${quizSessionId}`;
    const method = archive ? 'DELETE' : 'PATCH';

    const headers = this.makeHeaders(extraHeaders);

    const res =
      method === 'DELETE'
        ? await this.deleteAsync({ url, headers, timeout })
        : await this.patchAsync({
            url,
            headers,
            body: null,
            timeout
          });

    return await res.json();
  }

  async deleteSharedQuizUnit({
    quizSessionId,
    quizUnitId,
    extraHeaders,
    timeout = REQUEST_TIMEOUT
  }: {
    quizSessionId: string;
    quizUnitId: string;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }) {
    const url = `${this.getUrlPrefix()}/shared/teacher/quizzes/${quizSessionId}/units/${quizUnitId}`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.deleteAsync({ url, headers, timeout });
    return await res.json();
  }
}

export default QuizService;
