import BaseService from './base_service.js';

export class UserSettings extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'local':
        return 'http://localhost:4000';
      case 'production':
        return `https://user-settings-service.services.${this.baseDomain}`;
      case 'development':
        return `https://${this.environment}-user-settings-service.services.${this.baseDomain}`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  }

  async getSettings(
    {
      isbn,
      timeout = 5000
    }:
    {
      isbn: string,
      timeout?: number
    }
  ): Promise<object> {
    const url = `${this.getUrlPrefix()}/clientsettings/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    return await this.getAsync({url, headers, timeout});
  }

  async setSettings(
    {
      isbn,
      settings,
      timeout = 5000
    }: 
    {
      isbn: string,
      settings: object,
      timeout?: number
    }
  ): Promise<object> {
    const url = `${this.getUrlPrefix()}/clientsettings/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    headers.set('Content-Type', 'application/json');
    return await this.putAsync({url, headers, body: JSON.stringify(settings), timeout});
  }
}

export default UserSettings;
