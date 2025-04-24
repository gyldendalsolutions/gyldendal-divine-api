import UserSettingsBase from './user_settings_base.js';

export interface Bookmark extends BookmarkUpdate {
    createdTimeStamp: number;
    isbn?: string;
}

export interface BookmarkUpdate {
    pageId: number;
    contentId: number;
}

export interface BookmarkResponse {
  bookmarks: Bookmark[];
}

export class UserSettingsBookmarks extends UserSettingsBase {
  async setBookmark(
    {
      isbn,
      bookmark,
      externalUserId,
      timeout = 5000
    }:
    {
      isbn: string,
      bookmark: BookmarkUpdate,
      externalUserId?: string,
      timeout?: number
    }
  ): Promise<Bookmark> {
    const url = `${this.getUrlPrefix()}/bookmark/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    if (externalUserId) {
      headers.set('external-user-id', externalUserId);
    }

    headers.set('Content-Type', 'application/json');
    return await this.putAsync({url, headers, body: JSON.stringify(bookmark), timeout}) as Bookmark;
  }

  async deleteBookmark(
    {
      isbn,
      pageId,
      contentId,
      timeout = 5000
    }:
    {
      isbn: string,
      pageId: number,
      contentId: number,
      timeout?: number
    }
  ): Promise<void> {
    const url = `${this.getUrlPrefix()}/bookmark/isbn/${isbn}/page/${pageId}/content/${contentId}`;
    const headers: HeadersInit = new Headers();

    await this.deleteAsync({url, headers, timeout});
    return
  }

  async getBookmark(
    {
      isbn,
      pageId,
      timeout = 5000
    }:
    {
      isbn?: string,
      pageId?: number,
      timeout?: number
    }
  ): Promise<BookmarkResponse> {
    if (!isbn && pageId) {
        throw new Error('The isbn parameter is required if pageId is provided.');
    }

    let url = `${this.getUrlPrefix()}/bookmark/`;
    if (isbn) {
      url += `isbn/${isbn}`;
    }

    if (pageId) {
      url += `/page/${pageId}`;
    }
    const headers: HeadersInit = new Headers();

    return await this.getAsync({url, headers, timeout}) as BookmarkResponse;
  }

  // Favourites are bookmarks that are ISBN specific, with a pageId of 0.
  async getFavourite(
    {
      timeout = 5000
    }:
    {
      timeout?: number
    }
  ): Promise<BookmarkResponse> {
    let url = `${this.getUrlPrefix()}/bookmark/favourite`;

    const headers: HeadersInit = new Headers();

    return await this.getAsync({url, headers, timeout}) as BookmarkResponse;
  }

}

export default UserSettingsBookmarks;
