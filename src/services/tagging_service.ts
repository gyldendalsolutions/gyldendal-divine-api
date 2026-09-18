import BaseService from './base_service.js';
import type {
  Tag,
  TagOutput
} from '@gyldendalsolutions/divine-api-types';



export class TaggingService extends BaseService {
  readonly serviceName = 'tagging' as const;

  async getTagsByResource({
    identity,
    resource_type,
    resource_name,
    tag_name,
    timeout = 3000
  }: {
    identity: string;
    tag_name?: string;
    resource_type?: string;
    resource_name?: string;
    timeout?: number;
  }): Promise<TagOutput[]> {
    const url = `${this.getUrlPrefix()}/tags/by_resource/${identity}${resource_type ? `/${resource_type}` : ''}${resource_name ? `/${resource_name}` : ''}${tag_name ? `/${tag_name}` : ''}`;

    const headers: HeadersInit = new Headers();
    const response = await this.getAsync({ url, headers, timeout });
    return response.json();
  }

  async getTagsByName({
    identity,
    resource_type,
    resource_name,
    tag_name,
    timeout = 3000
  }: {
    identity: string;
    tag_name: string;
    resource_type?: string;
    resource_name?: string;
    timeout?: number;
  }): Promise<TagOutput[]> {
    const url = `${this.getUrlPrefix()}/tags/by_tag_name/${identity}/${tag_name}${resource_type ? `/${resource_type}` : ''}${resource_name ? `/${resource_name}` : ''}`;

    const headers: HeadersInit = new Headers();
    const response = await this.getAsync({ url, headers, timeout });
    return await response.json();
  }

  async createTag({
    tag,
    timeout = 3000
  }: {
    tag: Tag;
    timeout?: number;
  }): Promise<TagOutput> {
    const url = `${this.getUrlPrefix()}/tags`;
    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', 'application/json');
    const response = await this.postAsync({
      url,
      headers,
      body: JSON.stringify(tag),
      timeout
    });
    return await response.json();
  }

  async updateTag({
    tag,
    timeout = 3000
  }: {
    tag: Tag;
    timeout?: number;
  }): Promise<TagOutput> {
    const url = `${this.getUrlPrefix()}/tags`;
    const headers: HeadersInit = new Headers();

    headers.append('Content-Type', 'application/json');
    const response = await this.putAsync({
      url,
      headers,
      body: JSON.stringify(tag),
      timeout
    });
    return await response.json();
  }

  async deleteTag({
    identity,
    resource_type,
    resource_name,
    tag_name,
    timeout = 3000
  }: {
    identity: string;
    resource_type?: string;
    resource_name?: string;
    tag_name?: string;
    timeout?: number;
  }): Promise<void> {
    const url = `${this.getUrlPrefix()}/tags/${identity}${resource_type ? `/${resource_type}` : ''}${resource_name ? `/${resource_name}` : ''}${tag_name ? `/${tag_name}` : ''}`;

    const headers: HeadersInit = new Headers();
    const response = await this.deleteAsync({ url, headers, timeout });
    await response.json();
    return;
  }
}

export default TaggingService;
