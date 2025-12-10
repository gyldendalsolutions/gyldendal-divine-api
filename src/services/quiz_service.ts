import BaseService from './base_service.js';

export interface QuizStartResponse {
  quizUnitId: number;
}

export interface Quiz {
  quizId: number;
  quizName: string;
  quizDescription: string;
  quizFinished: boolean;
  questions: Question[];
  quizDeadline?: number;
  quizResultAvailable?: number;
  quizStartTime?: number;
}

export interface Question {
  questionId: number;
  name: string;
  introText: string;
  caseSensitive?: boolean;
  shuffle: boolean;
  answerChecked: boolean;
  questionType: string;
  questionTypeId: number;
  mediafile: Mediafile;
  medias: Mediafile[];
  answers: Answer[];
  chosenAnswer: ChosenAnswer[] | null;
  description: string;
  freeText: string;
  scores?: Score;
  answerBins: {
    binindex: number;
    img: Mediafile;
    txt: string;
  }[];
  tokenized: Tokens[];
  'chosenAnswer correctness': string;
}

export interface FormattedQuestion extends Question {
  number: number;
  answerTime?: string | null;
  percentage: string;
}

export interface Mediafile {
  id: number;
  placement: string;
  caption: string;
  altText: string;
  identifier: string;
  extension: string;
  mimeType: string;
  credit: string;
}

export interface ChosenAnswer {
  id: number | number[];
  answerText: string;
  created?: number;
  position: number;
  mediafile: Mediafile;
  bins?: number[];
  bin?: number;
  answers?: Answer[];
  answerBins?: AnswerBins[];
  questionId: number;
  isCorrect: boolean;
  wordoption?: AnswerIcon;
}

export interface AnswerBins {
  txt: string;
  binindex: number;
  img: Mediafile;
}

export interface Answer {
  id: number | number[];
  answerText: string;
  isCorrect: boolean;
  position: number | number[];
  mediafile?: Mediafile;
  bins?: number[];
  inputText?: {
    [key: string]: InputText;
  };
  dropdown?: DropdownMap;
  tableData?: TableData;
  wordoptions?: WordOptions;
  wordoption?: AnswerIcon;
  answerOptions?: AnswerIcon[];
  questionId?: number;
  answerBins?: AnswerBins[];
}

export interface WordOptions {
  options: WordOptionsOption[];
  answerOptions?: string[] | AnswerIcon[];
}

export interface WordOptionsOption {
  words: string;
  answers: string;
  position: number;
}

export interface AnswerIcon {
  abbreviation: string;
  icon: string;
  description: string;
  display: string;
}

export interface InputText {
  answerText: string;
  bins: number[];
  id?: number;
  correctText: string;
  isCorrect: boolean;
  position: number;
  index?: number;
  maxCorrectValue?: number;
  minCorrectValue?: number;
}

export interface InputTextMap {
  [key: string]: InputText;
}

export interface DropdownMap {
  [key: string]: Dropdown[];
}

export interface Dropdown {
  option: string;
  isCorrect: boolean;
  position?: number;
}

export interface DropdownFormattedOption {
  answerId: number;
  options: Dropdown[];
}

export interface TableData {
  [key: string]: {
    [key: string]: TableDataColumn | string;
  };
}

export interface TableDataColumn {
  correctText: string;
  isCorrect: boolean;
  position: number;
  options: Dropdown[];
  minCorrectValue?: number;
  maxCorrectValue?: number;
}

export interface QuizResult {
  Problemdata: Question[];
  QuizSession?: {
    closesAt: string | null;
    description: string;
    name: string;
    opensAt: string | null;
    problems: number;
    quizSessionId: number;
  };
  QuizUnit?: {
    averageScore: number;
    finished: boolean;
    finishedAt: number | null;
    quizUnitId: number;
    startedAt: number | null;
    studentEkeysId: string;
    studentId: number;
    timeSpent: number;
  };
  Results: Results;
}

export interface Results {
  'Number of correct': number;
  'Number of incorrect': number;
  'Number of not answered': number;
  'Number of partially correct': number;
  'Number of questions': number;
  unitScore: CalculatedScore;
}

export interface Score {
  'Number of correct options': number;
  'Number of correct options chosen': number;
  'Number of options': number;
  'Number of options chosen': number;
  'Percentage score': number;
  'Student has answered'?: boolean;
  'Token check': Tokens[];
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

export interface Tokens {
  correctText: string;
  diffCheck: TokensDiffCheck[];
  numberOfTokenErrors: number;
  studentAnswerText: string;
}

export interface TokensDiffCheck {
  error: boolean;
  studentWord: string;
  correctWord: string;
}

export interface NewAnswer {
  answerText: string;
  bins: number[];
  id: number;
  isCorrect: boolean;
  position: number;
  questionId: number;
}

export interface SaveAnswerResponse {
  Result: string;
}

export interface SaveAnswer {
  'question-id': number;
  'question-type-id': number;
  'answer-id'?: number[];
  'answer-text'?: (string | { answers: string } | null)[];
  'answer-position'?: number[];
  'answer-bin'?: number[];
  'answer-checked'?: boolean;
}

export type QuizTextSettings = Record<string, string | number>;

export interface SharedQuizData {
  'quiz-id'?: string | undefined;
  isbn?: string | undefined;
  title: string;
  description: string;
  'quiz-open': number | null;
  'quiz-close': number | null;
  'result-available-time'?: number | null;
  'extra-teachers': string[];
}

export interface SharedTeacherQuiz {
  createdAt?: number;
  deactivatedProblems?: number[];
  extraTeachers?: string[];
  isArchived?: boolean;
  isExtraTeacher?: boolean;
  isPinned?: boolean;
  name?: string;
  problems: number;
  quizSessionId?: number;
  studentsFinished?: number;
}

export interface SharedStudentQuiz {
  quizUnitId: number;
  quizSessionId: number;
  name: string;
  createdBy: string;
  startedAt: number | null;
  finishedAt: number | null;
  finished: boolean;
}

export interface CalculatedScore {
  points: number;
  maxPoints: number;
  percentage: number;
}

export interface QuizSession extends SharedTeacherQuiz {
  description?: string;
  opensAt: number | null;
  closesAt: number | null;
  quizUnits?: QuizUnit[];
  averageScores?: {
    byProblem: CalculatedScore[];
    overall: CalculatedScore;
  };
}

export interface QuizUnit {
  quizUnitId: number;
  studentId: number;
  studentEkeysId: string;
  finished: boolean;
  finishedAt: number | null;
  startedAt: number | null;
  timeSpent: TimeSpent;
  unitScore: CalculatedScore;
  problemScores: ProblemScore[];
}

export interface TimeSpent {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface FormattedQuizUnit extends QuizUnit {
  formattedTimeSpent?: string;
  formattedFinishedAt?: string | null;
  formattedStartedAt?: string | null;
  percentage?: string;
  total?: string;
}

export interface ProblemScore {
  mathproblem: number;
  questionTypeId: number;
  questionTypeString: string;
  score: Score;
}

export type QuizTableAction = 'copy' | 'archive' | 'delete' | 'unarchive';
export type QuizTableItem =
  | SharedTeacherQuiz
  | FormattedQuizUnit
  | SharedStudentQuiz;

export type SearchableKeys = 'name';

export type ProblemAnswerState =
  | 'correct'
  | 'incorrect'
  | 'partially-correct'
  | 'unanswered';

export type QuizLocalState = {
  id: number;
  isLoading: boolean;
  isApiError: boolean;
  data: Quiz | null;
  originalData: Quiz | null;
  finished: boolean;
  results: QuizResult | null;
  instantFeedback: string | null;
  showAdvancedResults: boolean;
};



export class QuizService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return 'https://api.iquiz.dk/api';
      case 'development':
      case 'local':
      case 'testing':
        return 'https://galecms.test.tibalo.dk/api';
      case 'test':
        return `https://localhost:3010/galeapi/api`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
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
    timeout = 3000
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
    shared,
    extraHeaders,
    timeout = 3000
  }: {
    isbn: string;
    quiz: number;
    shared?: boolean;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<QuizStartResponse> {
    const url = shared
      ? `${this.getUrlPrefix()}/shared/student/${quiz}`
      : `${this.getUrlPrefix()}/isbn/${isbn}/quiz/${quiz}`;

    const headers = this.makeHeaders(extraHeaders);

    const res = await this.postAsync({ url, headers, body: '{}', timeout });
    return await res.json();
  }

  async getProblems({
    isbn,
    quizUnitId,
    shared,
    extraHeaders,
    timeout = 3000
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
    timeout = 3000
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
    timeout = 3000
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
    timeout = 3000
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
    timeout = 3000
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

  async createSharedQuiz({
    quizData,
    extraHeaders,
    timeout = 3000
  }: {
    quizData: SharedQuizData;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<{ quizSessionId: number }> {
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
    timeout = 3000
  }: {
    quizSessionId: number;
    quizData: SharedQuizData;
    action: 'edit' | 'copy';
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<{ quizSessionId: number }> {
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
    timeout = 3000
  }: {
    quizSessionId: number;
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<Quiz> {
    const url = `${this.getUrlPrefix()}/shared/teacher/quizzes/${quizSessionId}/problems`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  async getTeachersUnitOverview({
    quizSessionId,
    quizUnitId,
    extraHeaders,
    timeout = 3000
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
    timeout = 3000
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
    timeout = 3000
  }: {
    extraHeaders?: Record<string, string>;
    timeout?: number;
  }): Promise<{ SharedQuizzes: SharedTeacherQuiz[] }> {
    const url = `${this.getUrlPrefix()}/shared/teacher/quizzes`;
    const headers = this.makeHeaders(extraHeaders);

    const res = await this.getAsync({ url, headers, timeout });
    return await res.json();
  }

  async getStudentsQuizzes({
    extraHeaders,
    timeout = 3000
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
    timeout = 3000
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
    timeout = 3000
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
        : await this.postAsync({
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
    timeout = 3000
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
