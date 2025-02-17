import BaseService from './base_service.js';

interface Tag {
  identity: string;
  resource_type: string;
  resource_name: string;
  tag_name: string;
  tag_value: string;
}

export class TaggingService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'local':
        return 'http://localhost:4000';
      case 'production':
        return `https://tagging.services.${this.baseDomain}`;
      case 'staging':
        return `https://${this.environment}-tagging.services.${this.baseDomain}`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  };

  async getTagsByValue(
    {
      identity,
      resource_type,
      resource_name,
      tag_value,
      timeout = 3000
    }:
    {
      tag_value: string,
      identity: string,
      resource_type?: string,
      resource_name?: string,
      timeout?: number
    }
  ): Promise<Tag[]> {
    const url = `${this.getUrlPrefix()}/tags/by_value/${tag_value}/${identity}${resource_type ? `/${resource_type}` : ''}${resource_name ? `/${resource_name}` : ''}`;

    const headers: HeadersInit = new Headers();
    return await this.getAsync({url, headers, timeout}) as Tag[];
  }

  async getTagsByName(
    {
      identity,
      resource_type,
      resource_name,
      tag_name,
      timeout = 3000
    }:
    {
      identity: string,
      resource_type?: string,
      resource_name?: string,
      tag_name?: string,
      timeout?: number
    }
  ): Promise<Tag[]> {
    const url = `${this.getUrlPrefix()}/tags/by_name/${identity}${resource_type ? `/${resource_type}` : ''}${resource_name ? `/${resource_name}` : ''}${tag_name ? `/${tag_name}` : ''}`;

    const headers: HeadersInit = new Headers();
    return await this.getAsync({url, headers, timeout}) as Tag[];
  }

  async createTag(
    {
      tag,
      timeout = 3000
    }:
    {
      tag: Tag,
      timeout?: number
    }
  ): Promise<Tag> {
    const url = `${this.getUrlPrefix()}/tags`;
    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', "application/json");
    return await this.putAsync({url, headers, body: JSON.stringify(tag), timeout}) as Tag;
  }

  async deleteTag(
    {
      identity,
      resource_type,
      resource_name,
      tag_name,
      timeout = 3000
    }:
    {
      identity: string,
      resource_type?: string,
      resource_name?: string,
      tag_name?: string,
      timeout?: number
    }
  ): Promise<void> {
    const url = `${this.getUrlPrefix()}/tags/by_name/${identity}${resource_type ? `/${resource_type}` : ''}${resource_name ? `/${resource_name}` : ''}${tag_name ? `/${tag_name}` : ''}`;

    const headers: HeadersInit = new Headers();
    await this.deleteAsync({url, headers, timeout});
  }
}

export default TaggingService;
