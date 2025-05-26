import BaseService from './base_service.js';

export enum HighlightResultType {
    'highlight' = 'highlight',
    'note' = 'note',
}

export interface HighlightRanges {
    start: number|null;
    end: number|null;
    startOffset: number;
    endOffset: number;
}

export interface Highlight extends HighlightUpdate {
    id: string;
    recreationdata?: IRecreationData;
    ranges?: HighlightRanges[];
    createdTStamp?: number;
    lang?: string;
}

export interface HighlightRequest {
    breadCrumb: string;
    pageTitle: string;
    externalUserId?: string;
    highlight: Highlight;
}

export interface HighlightSearchRequest {
    searchQuery: string;
    resultType?: HighlightResultType;
    isbn?: string;
    maxResults?: number;
    vectorMinConfidence?: number;
    vectorHighConfidence?: number;
    fulltextMinScore?: number;
}

export interface HiglightSearchMatch {
    rangeKey: number;
    confidence: number;
    texttype: HighlightResultType;
    isbn: string;
    pid: number;
    returnedItem: number;
}

export interface HighlightSearchResponse {
    Items: HighlightResponse[];
    Matches: HiglightSearchMatch[];
}

export interface HighlightResponse extends HighlightRequest {
    debugHostname: string
    uidIsbnPidMyAccountIdPartitionKey: string;
    timestampSortKey: number;
    timeToDie: number;
    pid: number;
    uid: string;
    myAccountid: string;
    commentText: string;
    breadCrumb: string;
    quote: string;
}

export interface HighlightUpdate {
    hlcolor: string;
    quote: string;
    text: string;
}

export interface HighlightUpdateRequest {
    highlight: HighlightUpdate;
}

export interface HighlightCountResponse {
    type: HighlightResultType;
    isbn: string;
    count: number;
}

export interface HighlightDeleteResult extends HighlightUpdateResponse {
    changed: number;
}

export interface HighlightAddResult extends HighlightUpdateResponse {
    timestampSortKey: number;
}

export interface HighlightUpdateResponse {
    status: string;
}

interface IBKNGData {
  prev20TextContent?: string | null;
  next20TextContent?: string;
  cid?: number;
  isPageNote?: boolean;
  domPath?: string;
  newElementPath?: string;
  elementPath?: string;
  prevNextTextContent?: {
    before: string | null;
    after: string;
    srcText: string | null;
  };
}

export interface ICtype {
  SiblingsCount: string; // e.g. '15'
  classes: string; // e.g.  'csc-default csc-textpic'
}

export interface ICtypeDict {
  [cid: string]: ICtype;
}

export interface ITextStartEndObject {
  startSelectedText: string | undefined | null; // start of selection, text value
  endSelectedText: string | undefined; // end of selection, text value '150.000';
}

export interface IRecreationData {
  startCID: number; // id of section start, e.g. 'c319'
  numberOfSiblingsOnStartNode?: number | undefined; // sibling count adjacent to the start node, e.g. '5'
  numberofPrevSiblingsOnCIDStartNode?: number | undefined; // e.g. '1';
  startCtypes?: ICtypeDict | null | undefined; // this was never used....

  endCID: number;
  numberOfSiblingsOnEndNode?: number | undefined;
  numberofPrevSiblingsOnCIDEndNode?: number | undefined;
  endCTypes?: ICtypeDict | null | undefined; // this was never used ....

  startSelectionInnerText?: string | null | undefined; // inner html (text) of the start node that was selected
  endSelectionInnerText?: string | null | undefined; // inner html (text) of the end node that was selected

  mathObject?: string | null | undefined; // e.g. '0'. who knows?

  selectedTextStartAndEndObject?: ITextStartEndObject | undefined; // not really used in the old client

  totalSiblingsToCIDs?: number | undefined; // e.g. '15'

  ibkngData?: IBKNGData | null | undefined;

  specialSelectedText?: string | undefined;
  source?: any | null | undefined;
}

export class HighlightService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://highlights.services.${this.baseDomain}`;
      case 'development':
      case 'local':
      case 'testing':
        return `https://staging-highlights.services.${this.baseDomain}`;
      case 'test':
        return `https://localhost:3010/services/highlight`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  };

  async search(
    {
      search,
      timeout = 3000
    }:
    {
      search: HighlightSearchRequest,
      timeout?: number
    }
  ): Promise<HighlightSearchResponse> {
    const url = `${this.getUrlPrefix()}/v2/search`;

    const headers: HeadersInit = new Headers();
    headers.append('Content-Type', "application/json");
    const response = await this.postAsync({url, headers, body: JSON.stringify(search), timeout});
    return response.json();
  }

  async deleteHighlightOrNote(
    {
      isbn,
      pid,
      key,
      timeout = 3000
    }:
    {
      isbn: string,
      pid: number,
      key: number,
      timeout?: number
    }
  ): Promise<HighlightDeleteResult> {
    const url = `${this.getUrlPrefix()}/v2/isbn/${isbn}/pid/${pid}/key/${key}`;

    const headers: HeadersInit = new Headers();
    headers.append('Content-Type', "application/json");
    const response = await this.deleteAsync({url, headers, timeout});
    return response.json();
  }

  async getHighlightOrNote(
    {
      isbn,
      pid,
      timeout = 3000
    }:
    {
      isbn: string,
      pid?: number,
      timeout?: number
    }
  ): Promise<HighlightResponse[]> {
    let url = `${this.getUrlPrefix()}/v2/isbn/${isbn}`;
    if (pid) {
      url += `/pid/${pid}`;
    }

    const headers: HeadersInit = new Headers();

    const response = await this.getAsync({url, headers, timeout});
    return response.json();
  }

  async getHighlightOrNoteCounts(
    {
      noteType,
      timeout = 3000
    }:
    {
      noteType?: HighlightResultType,
      timeout?: number
    }
  ): Promise<HighlightCountResponse[]> {
    let url = `${this.getUrlPrefix()}/v2/count`;
    if (noteType) {
        url += `/${noteType}`;
    }

    const headers: HeadersInit = new Headers();

    const response = await this.getAsync({url, headers, timeout});
    return response.json();
  }

  async updateHighlightOrNote(
    {
      payload,
      isbn,
      pid,
      key,
      timeout = 5000
    }:
    {
      payload: HighlightUpdateRequest,
      isbn: string,
      pid: number,
      key: number,
      timeout?: number
    }
  ): Promise<HighlightUpdateResponse> {
    const url = `${this.getUrlPrefix()}/v2/isbn/${isbn}/pid/${pid}/key/${key}`;
    const headers: HeadersInit = new Headers();

    headers.set('Content-Type', 'application/json');
    const response = await this.putAsync({url, headers, body: JSON.stringify(payload), timeout});
    return response.json();
  }

  async addHighlightOrNote(
    {
      payload,
      isbn,
      pid,
      timeout = 5000
    }:
    {
      payload: HighlightRequest,
      isbn: string,
      pid: number,
      timeout?: number
    }
  ): Promise<HighlightAddResult> {
    const url = `${this.getUrlPrefix()}/v2/isbn/${isbn}/pid/${pid}`;
    const headers: HeadersInit = new Headers();

    headers.set('Content-Type', 'application/json');
    const response = await this.postAsync({url, headers, body: JSON.stringify(payload), timeout});
    return response.json();
  }
}

export default HighlightService;
