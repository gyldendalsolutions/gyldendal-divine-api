import BaseService from './base_service.js';

export interface Tag {
  identity: string;
  resource_type: string;
  resource_name: string;
  tag_name: string;
  tag_value: string;
}

export interface TagOutput extends Tag {
  created_at: number;
}

export class TaggingService extends BaseService {
  discoverUrlPrefix(): string {
    switch (this.environment) {
      case 'production':
        return `https://tagging.services.${this.baseDomain}`;
      case 'development':
      case 'local':
        return `https://staging-tagging.services.${this.baseDomain}`;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  };

  async getTagsByResource(
    {
      identity,
      resource_type,
      resource_name,
      tag_name,
      timeout = 3000
    }:
    {
      identity: string,
      tag_name?: string,
      resource_type?: string,
      resource_name?: string,
      timeout?: number
    }
  ): Promise<TagOutput[]> {
    const url = `${this.getUrlPrefix()}/tags/by_resource/${identity}${resource_type ? `/${resource_type}` : ''}${resource_name ? `/${resource_name}` : ''}${tag_name ? `/${tag_name}` : ''}`;

    const headers: HeadersInit = new Headers();
    return await this.getAsync({url, headers, timeout}) as TagOutput[];
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
      tag_name: string,
      resource_type?: string,
      resource_name?: string,
      timeout?: number
    }
  ): Promise<TagOutput[]> {
    const url = `${this.getUrlPrefix()}/tags/by_tag_name/${identity}/${tag_name}${resource_type ? `/${resource_type}` : ''}${resource_name ? `/${resource_name}` : ''}`;

    const headers: HeadersInit = new Headers();
    return await this.getAsync({url, headers, timeout}) as TagOutput[];
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
  ): Promise<TagOutput> {
    const url = `${this.getUrlPrefix()}/tags`;
    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', "application/json");
    return await this.postAsync({url, headers, body: JSON.stringify(tag), timeout}) as TagOutput;
  }

  async updateTag(
    {
      tag,
      timeout = 3000
    }:
    {
      tag: Tag,
      timeout?: number
    }
  ): Promise<TagOutput> {
    const url = `${this.getUrlPrefix()}/tags`;
    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', "application/json");
    return await this.putAsync({url, headers, body: JSON.stringify(tag), timeout}) as TagOutput;
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
    const url = `${this.getUrlPrefix()}/tags/${identity}${resource_type ? `/${resource_type}` : ''}${resource_name ? `/${resource_name}` : ''}${tag_name ? `/${tag_name}` : ''}`;

    const headers: HeadersInit = new Headers();
    await this.deleteAsync({url, headers, timeout});
  }
}

export default TaggingService;
