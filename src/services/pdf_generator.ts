import BaseService from './base_service.js';
import type {
  NotesRequest,
  PdfExportResult,
  PrintRequest,
  SiteMapRequest,
  WritingTaskRequest
} from '@gyldendalsolutions/divine-contracts';

/**
 * @deprecated Use {@link PdfExportResult}. This name shadows the DOM `Response`
 * inside this module and for anyone importing it, which reads as though the
 * exports resolve to a fetch response rather than the parsed body.
 */
export type Response = PdfExportResult;

export class PdfGeneratorService extends BaseService {
  readonly serviceName = 'pdfGenerator' as const;

  async pdfFromSiteMap({
    body,
    timeout = 3000
  }: {
    body: SiteMapRequest;
    timeout?: number;
  }): Promise<PdfExportResult> {
    const url = `${this.getUrlPrefix()}/sitemap`;

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

  async pdfFromWritingTask({
    body,
    timeout = 3000
  }: {
    body: WritingTaskRequest;
    timeout?: number;
  }): Promise<PdfExportResult> {
    const url = `${this.getUrlPrefix()}/writingTask`;

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

  async pdfFromPrint({
    body,
    timeout = 3000
  }: {
    body: PrintRequest;
    timeout?: number;
  }): Promise<PdfExportResult> {
    const url = `${this.getUrlPrefix()}/print`;

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

  async pdfFromNotes({
    body,
    timeout = 3000
  }: {
    body: NotesRequest;
    timeout?: number;
  }): Promise<PdfExportResult> {
    const url = `${this.getUrlPrefix()}/notes`;

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
export default PdfGeneratorService;
