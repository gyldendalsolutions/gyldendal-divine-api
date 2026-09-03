import BaseService from './base_service.js';

export class WritingTaskService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://writingtask.services.${this.baseDomain}`;
      case 'development':
      case 'testing':
        return `https://staging-writingtask.services.${this.baseDomain}`;
      case 'local':
        // Local instance (systime_sso local service block).
        return `http://localhost:5000`;
      case 'test':
        return `https://localhost:3010/services/writingtask`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  }
}
export default WritingTaskService;
