import exp from 'constants';
import BaseService from './base_service.js';

export interface noteHighlight {
    color: string;
    comment: string;
    selectedText: string;
}

export interface notes {
    created: string;
    highlight: noteHighlight;
    link: string;
    pid: string;
    title: string;
}

export interface notesLabels {
    amountOfNotesProse: string;
    documentTitle: string;
    markedText: string;
    noContentLabel: string;
    noSelectedTextLabel: string;
    notesExportedAt: string;
    yourNote: string;
}

export interface notesData {
    labels: notesLabels
    notes: notes[]
}

export interface notesRequest {
    exportedDate: string;
    notesData: notesData;
    userId: string;
    userName: string;
}

export interface response {
    status: string;
    url: string;
}

export interface writingTaskRequest {
    pdftitle: string;
    userId: string;
    userName: string;
}

export interface writingTaskData {
    createdData: string;
    exportedDateTimeString: string;
    header: string;
    headerStripped: string;
    host: string;
    isbn: string;
    publisher: string;
    siteTitle: string;
    userIdentity: string;
    writingTaskItems: writingTaskItem[];
}

export interface writingTaskItem {
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

export interface siteMapLabels {
    pbook: string;
    toc: string;
}

export interface siteMapPageTreeItem {
    chapterInfo?: siteMapPageTreeItem;
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

export interface siteMapPage {
    children: siteMapPage[];
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

export type siteMapPageTreeData = Record<string, siteMapPageTreeItem>;

export interface siteMapContent {
    labels: siteMapLabels,
    pageTreeData: siteMapPageTreeData,
    pages: siteMapPage[]
}

export interface siteMapRequest {
    baseUrl: string;
    content: siteMapContent,
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
        return `https://staging-pdfgenerator.services.${this.baseDomain}`;
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
      body: siteMapRequest,
      timeout?: number
    }
  ): Promise<response> {
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
      body: writingTaskRequest,
      timeout?: number
    }
  ): Promise<response> {
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
      body: notesRequest,
      timeout?: number
    }
  ): Promise<response> {
    const url = `${this.getUrlPrefix()}/notes`;

    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', "application/json");
    const response = await this.postAsync({url, headers, body: JSON.stringify(body), timeout});
    return response.json();
  }
}
export default PdfGeneratorService;
