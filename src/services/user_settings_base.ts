import BaseService from './base_service.js';

export class UserSettingsBase extends BaseService {
  readonly serviceName = 'userSettings' as const;
}

export default UserSettingsBase;
