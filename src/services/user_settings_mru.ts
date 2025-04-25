import UserSettingsBase from './user_settings_base.js';

export interface MRU {
    isbn: string;
    link: string;
    title: string;
}

export class UserSettingsMRU extends UserSettingsBase {
  async setMRU(
    {
      mru,
      externalUserId,
      timeout = 5000
    }:
    {
      mru: MRU,
      externalUserId?: string,
      timeout?: number
    }
  ): Promise<MRU[]> {

    const url = `${this.getUrlPrefix()}/mru`;
    const headers: HeadersInit = new Headers();

    if (externalUserId) {
      headers.set('external-user-id', externalUserId);
    }

    headers.set('Content-Type', 'application/json');
    const response = await this.postAsync({url, headers, body: JSON.stringify(mru), timeout});
    return response.json();
  }

  async clearMRU(
    {
      timeout = 5000
    }:
    {
      timeout?: number
    }
  ): Promise<void> {
    const url = `${this.getUrlPrefix()}/mru`;
    const headers: HeadersInit = new Headers();

    await this.deleteAsync({url, headers, timeout});
    return;
  }

  async getMRU(
    {
      timeout = 5000
    }:
    {
      timeout?: number
    }
  ): Promise<MRU[]> {
    let url = `${this.getUrlPrefix()}/mru`;

    const headers: HeadersInit = new Headers();

    const response = await this.getAsync({url, headers, timeout});
    return response.json();
  }
}

export default UserSettingsMRU;
