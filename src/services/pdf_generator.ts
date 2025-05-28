import BaseService from './base_service.js';

export interface NoteHighlight {
    color: string;
    comment: string;
    selectedText: string;
}

export interface Notes {
    created: string;
    highlight: NoteHighlight;
    link: string;
    pid: string;
    title: string;
    id: string;
}

export interface NotesLabels {
    amountOfNotesProse: string;
    documentTitle: string;
    markedText: string;
    noContentLabel: string;
    noSelectedTextLabel: string;
    notesExportedAt: string;
    yourNote: string;
}

export interface NotesData {
    labels: NotesLabels
    notes: Notes[]
}

export interface NotesRequest {
    exportedDate: string;
    notesData: NotesData;
    userId: string;
    userName: string;
}

export interface Response {
    status: string;
    url: string;
}

export interface WritingTaskRequest {
    pdftitle: string;
    userId: string;
    userName: string;
}

export interface WritingTaskData {
    createdData: string;
    exportedDateTimeString: string;
    header: string;
    headerStripped: string;
    host: string;
    isbn: string;
    publisher: string;
    siteTitle: string;
    userIdentity: string;
    writingTaskItems: WritingTaskItem[];
}

export interface WritingTaskItem {
    answer: string;
    crdate: number;
    cruser_id: number;
    deleted: number;
    files: string[]|null;
    hidden: number;
    imageorient: number;
    parentid: number;
    parenttable: string;
    parsedAnswer: string;
    parsedQuestion: string;
    pid: number;
    question: string;
    sorting: number;
    title: string;
    tstamp: number;
    uid: number;
    userAnswered: boolean;
}

export interface SiteMapLabels {
    pbook: string;
    toc: string;
}

export interface SiteMapPageTreeItem {
    chapterInfo?: SiteMapPageTreeItem;
    characters: number;
    iPages: number;
    images: number;
    interactiveElements: number;
    lang: number;
    math: number;
    ogStandardPage: number;
    originalMaterial: number;
    quizzes: number;
    soundFiles: number;
    standardPage: number;
    sys_language_uid: number;
    uid: number;
    videos: number;
    words: number;
}

export interface SiteMapPage {
    children: SiteMapPage[];
    accessGranted: boolean;
    author: null|string;
    description: null|string;
    doktype: number;
    editor: null|string;
    fe_group: string;
    keywords: null|string;
    link: string;
    nav_hide: number;
    nav_title: string;
    pid: number;
    title: string;
    uid: number;
}

export type SiteMapPageTreeData = Record<string, SiteMapPageTreeItem>;

export interface SiteMapContent {
    labels: SiteMapLabels,
    pageTreeData: SiteMapPageTreeData,
    pages: SiteMapPage[]
}

export interface SiteMapRequest {
    baseUrl: string;
    content: SiteMapContent,
    exportedDate: string;
    isbn: string;
    siteTitle: string;
    userId: string;
    userName: string;
}

export class PdfGeneratorService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://pdfgenerator.services.${this.baseDomain}`;
      case 'development':
      case 'local':
      case 'testing':
        return `https://staging-pdfgenerator.services.${this.baseDomain}`;
      case 'test':
        return `https://localhost:3010/services/pdfgenerator`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  }

  async pdfFromSiteMap(
    {
      body,
      timeout = 3000
    }:
    {
      body: SiteMapRequest,
      timeout?: number
    }
  ): Promise<Response> {
    const url = `${this.getUrlPrefix()}/sitemap`;

    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', "application/json");
    const response = await this.postAsync({url, headers, body: JSON.stringify(body), timeout});
    return response.json();
  }

  async pdfFromWritingTask(
    {
      body,
      timeout = 3000
    }:
    {
      body: WritingTaskRequest,
      timeout?: number
    }
  ): Promise<Response> {
    const url = `${this.getUrlPrefix()}/writingTask`;

    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', "application/json");
    const response = await this.postAsync({url, headers, body: JSON.stringify(body), timeout});
    return response.json();
  }

  async pdfFromNotes(
    {
      body,
      timeout = 3000
    }:
    {
      body: NotesRequest,
      timeout?: number
    }
  ): Promise<Response> {
    const url = `${this.getUrlPrefix()}/notes`;

    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', "application/json");
    const response = await this.postAsync({url, headers, body: JSON.stringify(body), timeout});
    return response.json();
  }
}
export default PdfGeneratorService;