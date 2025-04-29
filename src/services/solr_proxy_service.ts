import BaseService from './base_service.js';

export class SolrProxyService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://solr-proxy.eu-west-1.${this.baseDomain}`;
      case 'development':
      case 'local':
        return `https://solr-proxy-staging.eu-west-1.${this.baseDomain}`;
      case 'test':
        return `https://localhost:3010/services/solrproxy`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  }
}

export default SolrProxyService;
