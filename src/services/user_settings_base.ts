import BaseService from './base_service.js';

export class UserSettingsBase extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://user-settings-service.services.${this.baseDomain}`;
      case 'development':
      case 'local':
        return `https://staging-user-settings-service.services.${this.baseDomain}`;
      case 'test':
        return `https://localhost:3010/services/usersettingsservice`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  }
}

export default UserSettingsBase;
