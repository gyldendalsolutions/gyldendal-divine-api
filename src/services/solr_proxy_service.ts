import BaseService from './base_service.js';

export class SolrProxyService extends BaseService {
  readonly serviceName = 'solrProxy' as const;
}

export default SolrProxyService;
