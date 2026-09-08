import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { PdfGeneratorService } from './pdf_generator.js';
import type { SiteMapPage, WritingTaskItem } from './pdf_generator.js';

const realFetch = globalThis.fetch;

let sent: { url: string; body: Record<string, unknown> } | null = null;

function captureRequests(): void {
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    sent = {
      url: String(url),
      body: JSON.parse(String(init?.body ?? '{}'))
    };
    return new Response(JSON.stringify({ status: 'success', url: 'https://s3' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof globalThis.fetch;
}

function service(): PdfGeneratorService {
  return new PdfGeneratorService({
    bearerToken: 'a-token',
    environment: 'testing',
    myAccountId: 'SYSTIMEMYACCOUNT',
    serviceUrl: 'https://example.invalid'
  });
}

afterEach(() => {
  globalThis.fetch = realFetch;
  sent = null;
});

describe('pdfFromPrint', () => {
  test('posts the body to /print', async () => {
    captureRequests();

    const result = await service().pdfFromPrint({
      body: {
        contentElements: [{ content: { content: { bodytext: 'text' } } }],
        isbn: '9788761687050',
        userId: 'user-1',
        userName: 'probe',
        filename: 'export'
      }
    });

    assert.equal(sent?.url, 'https://example.invalid/print');
    assert.equal(sent?.body.isbn, '9788761687050');
    assert.equal(result.status, 'success');
  });
});

describe('the request types match what the export reads', () => {
  test('a sitemap page needs only what the template renders', () => {
    // link, title, uid and children; the navigation entries callers pass
    // carry nothing else.
    const page: SiteMapPage = {
      children: [],
      link: '/?id=9394',
      title: 'Kapitel 2',
      uid: 9394
    };

    assert.equal(page.uid, 9394);
  });

  test('a note needs no id', async () => {
    captureRequests();

    await service().pdfFromNotes({
      body: {
        exportedDate: '2026-09-08T09:00:00.000Z',
        userId: 'user-1',
        userName: 'probe',
        notesData: {
          labels: {
            amountOfNotesProse: 'p',
            documentTitle: 'p',
            markedText: 'p',
            noContentLabel: 'p',
            noSelectedTextLabel: 'p',
            notesExportedAt: 'p',
            yourNote: 'p'
          },
          notes: [
            {
              created: '2026-09-08',
              highlight: { color: '#ff0', comment: 'c', selectedText: 's' },
              link: 'https://example.invalid/?id=1',
              pid: 'p1',
              title: 'Kapitel 1'
            }
          ]
        }
      }
    });

    assert.equal(sent?.url, 'https://example.invalid/notes');
  });

  test('a writing task export carries the task data the route requires', async () => {
    captureRequests();

    await service().pdfFromWritingTask({
      body: {
        pdftitle: 'Task',
        userId: 'user-1',
        userName: 'probe',
        writingTaskData: {
          createdDate: '2026-09-08',
          exportedDateTimeString: '2026-09-08 09:00',
          header: 'Header',
          headerStripped: 'Header',
          host: 'example.invalid',
          isbn: '9788761687050',
          publisher: 'Systime',
          siteTitle: 'Site',
          userIdentity: 'user-1',
          writingTaskItems: []
        }
      }
    });

    assert.equal(sent?.url, 'https://example.invalid/writingTask');
    assert.ok(sent?.body.writingTaskData);
  });
});

describe('a writing task item takes the row the caller holds', () => {
  test('a TYPO3 row from the reader satisfies the type', () => {
    // The shape ibog keeps per task: booleans for the flags, a count for
    // files, its own gallery model, and the parsed pair filled in before
    // sending.
    const row = {
      answer: 'raw answer',
      crdate: 1_700_000_000,
      cruserId: 42,
      deleted: false,
      files: 0,
      gallery: { position: 1, rows: {} },
      hidden: false,
      imageorient: 0,
      images: null,
      parentid: 9394,
      parenttable: 'tt_content',
      parsedAnswer: 'parsed answer',
      parsedQuestion: 'parsed question',
      pid: 9394,
      question: 'raw question',
      sorting: 256,
      title: 'Opgave 1',
      tstamp: 1_700_000_001,
      uid: 7,
      userAnswered: true
    };

    const item: WritingTaskItem = row;

    assert.equal(item.parsedAnswer, 'parsed answer');
    assert.equal(item.files, 0);
  });

  test('an item carrying only what the template renders is enough', () => {
    const item: WritingTaskItem = {
      parsedAnswer: 'parsed answer',
      parsedQuestion: 'parsed question'
    };

    assert.equal(item.title, undefined);
  });
});

