import BaseService from './base_service.js';

export class WritingTaskService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://writingtask.services.${this.baseDomain}`;
      case 'development':
      case 'local':
        return `https://staging-writingtask.services.${this.baseDomain}`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  }
}
export default WritingTaskService;
