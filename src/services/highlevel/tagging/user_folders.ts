import crypto from 'crypto';
import TaggingService from '../../tagging_service.js';

interface FolderObject {}

interface Folder extends FolderObject {
  name: string;
  uuid: string;
  parent?: string;
}

interface FolderContent extends FolderObject {
  type: string;
  identifier: string;
  folder_uuid: string;
}

/**
 * UserFolders is a service that allows users to create folders in their account. It's built on top of the Tagging service.
 * Folders are created with a name and an optional parent folder. If no parent folder is provided, the folder is created at the root level.
 * Folders are created with a unique UUID that can be used to reference the folder in future requests. The folder name is stored as a base64 encoded string.
**/
export class UserFolders extends TaggingService {
  private identity?: string = undefined;
  
  async getIdentity() : Promise<string> {
    if (this.identity) {
      return this.identity;
    }

    if (this.bearerToken) {
      const tokenParts = this.bearerToken.split('.');
      const payload = Buffer.from(tokenParts[1], 'base64').toString();
      const payloadObject = JSON.parse(payload);
      // The identity is the keyword user, the user's authns and the ekeysuserid (user) concatenated with an underscore
      // This value is enforced by the Tagging service and this is the only identity
      // that the Service will accept when invoked with a user specific bearer token.
      return `user_${payloadObject.authns}_${payloadObject.user}`;
    }

    throw new Error('The UserFolders service must be invoked with a valid bearer token');
  }

  async createFolder(
    {
      folder_name,
      parent_folder_uuid,
      timeout = 3000
    }:
    {
      folder_name: string,
      parent_folder_uuid?: string,
      timeout?: number
    }
  ): Promise<Folder> {
    const tag = await this.createTag(
      {
        tag: {
          identity: await this.getIdentity(),
          resource_type: 'myaccount_user_folder',
          resource_name: crypto.randomUUID(),
          tag_name: Buffer.from(folder_name).toString('base64'),
          tag_value: parent_folder_uuid ?? '-',
        },
        timeout
      }
    );
    return {name: folder_name, uuid: tag['resource_name'], parent: parent_folder_uuid} as Folder;
  }

  async listFolders(
    {
      parent_folder_uuid,
      timeout = 3000
    }:
    {
      parent_folder_uuid?: string,
      timeout?: number
    }
  ): Promise<Folder[]> {
    let tags;
    if (parent_folder_uuid) {
      tags = await this.getTagsByValue(
        {
          identity: await this.getIdentity(),
          resource_type: 'myaccount_user_folder',
          tag_value: parent_folder_uuid,
          timeout
        }
      );
    } else {
      tags = await this.getTagsByName(
        {
          identity: await this.getIdentity(),
          resource_type: 'myaccount_user_folder',
          timeout
        }
      );
    }

    let folders = [];

    for (const tag of tags) {
      folders.push(
        {
          name: Buffer.from(tag['tag_name'], 'base64').toString(),
          uuid: tag['resource_name'],
          parent: tag['tag_value'] === '-' ? undefined : tag['tag_value']
        } as Folder
      );
    }

    return folders;
  }

  async getFolderContent(
    {
      folder_uuid,
      timeout = 3000
    }:
    {
      folder_uuid: string,
      timeout?: number
    }
  ): Promise<FolderObject[]> {
    let tags = await this.getTagsByValue(
      {
        identity: await this.getIdentity(),
        tag_value: folder_uuid,
        timeout
      }
    );

    let content = [];

    for (const tag of tags) {
      if (tag['resource_type'] === 'myaccount_user_folder') {
        content.push(
          {
            type: tag['resource_type'],
            identifier: tag['resource_name'],
            folder_uuid: tag['tag_value']
          } as FolderContent
        );
      } else {
        let folder = {
            name: Buffer.from(tag['tag_name'], 'base64').toString(),
            uuid: tag['resource_name'],
            parent: tag['tag_value']
          } as Folder
        content.push(folder);
      }
    }

    return content;
  }

  async addInternetbookToFolder(
    {
      folder_uuid,
      isbn,
      timeout = 3000
    }:
    {
      folder_uuid: string,
      isbn: string,
      timeout?: number
    }
  ): Promise<FolderContent> {
    return await this.addContentToFolder(
      {
        folder_uuid,
        resource_name: isbn,
        resource_type: 'internetbook',
        timeout
      },
    );
  }

  /**
  * This is a generic function for creating folder content elements.
  **/
  async addContentToFolder(
    {
      folder_uuid,
      resource_name,
      resource_type,
      timeout = 3000
    }:
    {
      folder_uuid: string,
      resource_name: string,
      resource_type: string,
      timeout?: number
    }
  ): Promise<FolderContent> {
    await this.createTag(
      {
        tag: {
          identity: await this.getIdentity(),
          resource_type: resource_type,
          resource_name: resource_name,
          tag_name: 'MYACCOUNT_USER_FOLDER',
          tag_value: folder_uuid,
        },
        timeout
      }
    );
    return {type: resource_type, identifier: resource_name, folder_uuid} as FolderContent;
  }

  async deleteFolder(
    {
      folder_uuid,
      timeout = 3000
    }:
    {
      folder_uuid: string,
      timeout?: number
    }
  ): Promise<void> {
    await this.deleteTag(
      {
        identity: await this.getIdentity(),
        resource_type: 'myaccount_user_folder',
        resource_name: folder_uuid,
        timeout
      }
    );
  }

  async deleteAllFolders(
    {
      timeout = 3000
    }:
    {
      timeout?: number
    }
  ): Promise<void> {
    await this.deleteTag(
      {
        identity: await this.getIdentity(),
        resource_type: 'myaccount_user_folder',
        timeout
      }
    );
  }
}

export default UserFolders;
