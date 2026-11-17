import UserSettingsBase from './user_settings_base.js';

export interface ReadPages {
  isbn: string;
  pageIds: number[];
}

export class UserSettingsReadPages extends UserSettingsBase {
  async getReadPages({
    isbn,
    timeout = 5000
  }: {
    isbn: string;
    timeout?: number;
  }): Promise<ReadPages> {
    const url = `${this.getUrlPrefix()}/read-pages/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    const response = await this.getAsync({ url, headers, timeout });
    return response.json();
  }

  async setPageRead({
    isbn,
    pageId,
    timeout = 5000
  }: {
    isbn: string;
    pageId: number;
    timeout?: number;
  }): Promise<ReadPages> {
    const url = `${this.getUrlPrefix()}/read-pages/isbn/${isbn}/page/${pageId}`;
    const headers: HeadersInit = new Headers();

    const response = await this.putAsync({
      url,
      headers,
      body: null,
      timeout
    });
    return response.json();
  }

  async deletePageRead({
    isbn,
    pageId,
    timeout = 5000
  }: {
    isbn: string;
    pageId: number;
    timeout?: number;
  }): Promise<ReadPages> {
    const url = `${this.getUrlPrefix()}/read-pages/isbn/${isbn}/page/${pageId}`;
    const headers: HeadersInit = new Headers();

    const response = await this.deleteAsync({ url, headers, timeout });
    return response.json();
  }

  async deletePagesRead({
    isbn,
    pageIds,
    timeout = 5000
  }: {
    isbn: string;
    pageIds: number[];
    timeout?: number;
  }): Promise<ReadPages> {
    const url = `${this.getUrlPrefix()}/read-pages/isbn/${isbn}/remove`;
    const headers: HeadersInit = new Headers();

    headers.set('Content-Type', 'application/json');
    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify({ pageIds }),
      timeout
    });
    return response.json();
  }
}

export default UserSettingsReadPages;
