import UserSettingsBase from './user_settings_base.js';
import { HTTPError } from './base_service.js';
import type {
  ClientSettings,
  ClientSettingsResponse
} from '@gyldendalsolutions/divine-api-types';

export class UserSettingsClientSettings extends UserSettingsBase {
  async getSettings({
    isbn,
    timeout = 5000
  }: {
    isbn: string;
    timeout?: number;
  }): Promise<ClientSettingsResponse> {
    const url = `${this.getUrlPrefix()}/clientsettings/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    try {
      const response = await this.getAsync({ url, headers, timeout });
      return response.json();
    } catch (error) {
      if (error instanceof HTTPError && error.response.status === 404) {
        return { settings: {} } as ClientSettingsResponse;
      } else {
        throw error;
      }
    }
  }

  async setSettings({
    isbn,
    settings,
    timeout = 5000
  }: {
    isbn: string;
    settings: ClientSettings;
    timeout?: number;
  }): Promise<ClientSettingsResponse> {
    const url = `${this.getUrlPrefix()}/clientsettings/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    headers.set('Content-Type', 'application/json');
    const response = await this.putAsync({
      url,
      headers,
      body: JSON.stringify(settings),
      timeout
    });
    return response.json();
  }

  async deleteSettings({
    isbn,
    timeout = 5000
  }: {
    isbn: string;
    timeout?: number;
  }): Promise<void> {
    const url = `${this.getUrlPrefix()}/clientsettings/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    await this.deleteAsync({ url, headers, timeout });
    return;
  }
}

export default UserSettingsClientSettings;
