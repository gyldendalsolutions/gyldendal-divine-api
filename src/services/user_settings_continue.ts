import UserSettingsBase from './user_settings_base.js';
import {HTTPError} from './base_service.js'

export interface Continue extends ContinueUpdate {
    createdTimeStamp?: number;
}

export interface ContinueUpdate {
    pageId: number;
}

export class UserSettingsContinue extends UserSettingsBase {
  async setContinue(
    {
      isbn,
      pageId,
      externalUserId,
      timeout = 5000
    }:
    {
      isbn: string,
      pageId: number,
      externalUserId?: string,
      timeout?: number
    }
  ): Promise<Continue> {

    const continueBody: ContinueUpdate = {
      pageId
    };
    const url = `${this.getUrlPrefix()}/continue/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    if (externalUserId) {
      headers.set('external-user-id', externalUserId);
    }

    headers.set('Content-Type', 'application/json');
    return await this.putAsync({url, headers, body: JSON.stringify(continueBody), timeout}) as Continue;
  }

  async deleteContinue(
    {
      isbn,
      timeout = 5000
    }:
    {
      isbn: string,
      timeout?: number
    }
  ): Promise<void> {
    const url = `${this.getUrlPrefix()}/continue/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    await this.deleteAsync({url, headers, timeout});
    return
  }

  async getContinue(
    {
      isbn,
      timeout = 5000
    }:
    {
      isbn: string,
      timeout?: number
    }
  ): Promise<Continue> {
    let url = `${this.getUrlPrefix()}/continue/isbn/${isbn}`;

    const headers: HeadersInit = new Headers();

    try {
        return await this.getAsync({url, headers, timeout}) as Continue;
    } catch (Error) {
      if (Error instanceof HTTPError && Error.response.status === 404) {
        return {} as Continue;
      } else {
        throw HTTPError;
      }
    }
  }

}

export default UserSettingsContinue;
