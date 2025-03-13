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
 * Folders are created with a unique UUID that can be used to reference the folder in future requests. The folder properties are stored as a base64 encoded JSON string.
**/
export class UserFolders extends TaggingService {
  private readonly hasNoParent: string = '-';
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

  /**
  *  Create a folder.
  *  @param folder_name The name of the folder.
  *  @param parent_folder_uuid The UUID of the parent folder. If no parent folder is provided, the folder is created at the root level.
  *  @param color The color of the folder.
  *  @param timeout The timeout for the request in milliseconds.
  *
  *  @return Folder
  **/
  async createFolder(
    {
      folder_name,
      parent_folder_uuid,
      color,
      timeout = 3000
    }:
    {
      folder_name: string,
      color: string,
      parent_folder_uuid?: string,
      timeout?: number
    }
  ): Promise<Folder> {
    const folder_payload = JSON.stringify({"folder": folder_name, "color": color});
    const tag = await this.createTag(
      {
        tag: {
          identity: await this.getIdentity(),
          resource_type: 'myaccount_user_folder',
          resource_name: crypto.randomUUID(),
          tag_name: parent_folder_uuid ?? this.hasNoParent,
          tag_value: Buffer.from(folder_payload).toString('base64'),
        },
        timeout
      }
    );
    return {name: folder_name, uuid: tag['resource_name'], parent: parent_folder_uuid} as Folder;
  }

  /**
  *  Update a folder. Only name and color can be changed.
  *
  * @param folder_uuid The UUID of the folder.
  * @param folder_name The new name of the folder.
  * @param color The new color of the folder.
  * @param timeout The timeout for the request in milliseconds.
  *
  * @return Folder
  **/
  async updateFolder(
    {
      folder_uuid,
      folder_name,
      color,
      timeout = 3000
    }:
    {
      folder_uuid: string,
      folder_name?: string,
      color?: string,
      timeout?: number
    }
  ): Promise<Folder> {
    const tags = await this.getTagsByResource(
      {
        identity: await this.getIdentity(),
        resource_type: 'myaccount_user_folder',
        resource_name: folder_uuid,
        timeout
      }
    );

    if (tags.length === 0) {
      throw new Error(`Folder with UUID ${folder_uuid} not found`);
    }

    const tag = tags[0];
    const folder_payload = JSON.parse(Buffer.from(tag['tag_value'], 'base64').toString());
    const new_folder_name = folder_name ?? folder_payload['folder'];
    const new_color = color ?? folder_payload['color'];

    const new_folder_payload = JSON.stringify({"folder": new_folder_name, "color": new_color});

    await this.updateTag(
      {
        tag: {
          identity: await this.getIdentity(),
          resource_type: 'myaccount_user_folder',
          resource_name: folder_uuid,
          tag_name: tag['tag_name'],
          tag_value: Buffer.from(new_folder_payload).toString('base64'),
        },
        timeout
      }
    );

    const parent = tag['tag_name'] === this.hasNoParent ? undefined : tag['tag_name'];
    return {name: new_folder_name, uuid: folder_uuid, parent: parent} as Folder;
  }

  /**
  * List all folders in the user's account.
  * 
  * @param timeout The timeout for the request in milliseconds.
  *
  * @return Folder[]
  **/
  async listAllFolders(
    {
      timeout = 3000
    }:
    {
      timeout?: number
    }
  ): Promise<Folder[]> {
    const tags = await this.getTagsByResource(
        {
        identity: await this.getIdentity(),
        resource_type: 'myaccount_user_folder',
        timeout
        }
    );

    let folders = [];

    for (const tag of tags) {
      const folder_payload = JSON.parse(Buffer.from(tag['tag_value'], 'base64').toString());
      folders.push(
        {
          name: folder_payload['folder'],
          color: folder_payload['color'],
          uuid: tag['resource_name'],
          parent: tag['tag_name'] === this.hasNoParent ? undefined : tag['tag_name']
        } as Folder
      );
    }

    return folders;
  }

  /**
   * List the next level of folders in the user's account.
   *
   * @param parent_folder_uuid The UUID of the parent folder. If no parent folder is provided, the folder is created at the root level.
   * @param timeout The timeout for the request in milliseconds.
   *
   * @return Folder[]
  **/
  async listNextFolderLevel(
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
    if (!parent_folder_uuid) {
      parent_folder_uuid = this.hasNoParent;
    }

    tags = await this.getTagsByName(
        {
        identity: await this.getIdentity(),
        resource_type: 'myaccount_user_folder',
        tag_name: parent_folder_uuid,
        timeout
        }
    );

    let folders = [];

    for (const tag of tags) {
      const folder_payload = JSON.parse(Buffer.from(tag['tag_value'], 'base64').toString());
      folders.push(
        {
          name: folder_payload['folder'],
          color: folder_payload['color'],
          uuid: tag['resource_name'],
          parent: tag['tag_name'] === this.hasNoParent ? undefined : tag['tag_name']
        } as Folder
      );
    }

    return folders;
  }

  /**
   * List the content of a folder.
   *
   * @param folder_uuid The UUID of the folder.
   * @param timeout The timeout for the request in milliseconds.
   *
   * @return FolderContent[]
  **/
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
    let tags = await this.getTagsByName(
      {
        identity: await this.getIdentity(),
        tag_name: folder_uuid,
        timeout
      }
    );

    let content = [];

    for (const tag of tags) {
      if (tag['resource_type'] === 'myaccount_user_folder') {
        const folder_payload = JSON.parse(Buffer.from(tag['tag_value'], 'base64').toString());
        content.push({
            name: folder_payload['folder'],
            color: folder_payload['color'],
            uuid: tag['resource_name'],
            parent: tag['tag_name']
          } as Folder)
      } else {
        content.push(
          {
            type: tag['resource_type'],
            identifier: tag['resource_name'],
            folder_uuid: tag['tag_name']
          } as FolderContent
        );
      }
    }

    return content;
  }

  /**
   * Add a book to a folder.
   *
   * @param folder_uuid The UUID of the folder.
   * @param isbn The ISBN of the book.
   * @param timeout The timeout for the request in milliseconds.
   *
   * @return FolderContent
  **/
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
        resource_type: 'internetbook',
        resource_name: isbn,
        timeout
      },
    );
  }

  /**
   * Remove a book from a folder.
   *
   * @param folder_uuid The UUID of the folder.
   * @param isbn The ISBN of the book.
   * @param timeout The timeout for the request in milliseconds.
   *
   * @return FolderContent
  **/
  async removeInternetbookFromFolder(
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
    return await this.removeContentFromFolder(
      {
        folder_uuid,
        resource_type: 'internetbook',
        resource_name: isbn,
        timeout
      },
    );
  }

  /**
   * Create a new folder content element.
   *
   * @param folder_uuid The UUID of the folder.
   * @param resource_name The name of the resource.
   * @param resource_type The type of the resource.
   * @param timeout The timeout for the request in milliseconds.
   *
   * @return FolderContent
  **/
  async addContentToFolder(
    {
      folder_uuid,
      resource_type,
      resource_name,
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
          tag_name: folder_uuid,
          tag_value: 'MYACCOUNT_USER_FOLDER'
        },
        timeout
      }
    );
    return {type: resource_type, identifier: resource_name, folder_uuid} as FolderContent;
  }

  /**
   * Create a new folder content element.
   *
   * @param folder_uuid The UUID of the folder.
   * @param resource_name The name of the resource.
   * @param resource_type The type of the resource.
   * @param timeout The timeout for the request in milliseconds.
   *
   * @return FolderContent
  **/
  async removeContentFromFolder(
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
    await this.deleteTag(
      {
        identity: await this.getIdentity(),
        resource_type: resource_type,
        resource_name: resource_name,
        tag_name: folder_uuid,
        timeout
      }
    );
    return {type: resource_type, identifier: resource_name, folder_uuid} as FolderContent;
  }

  /**
   * Delete a folder.
   *
   * @param folder_uuid The UUID of the folder.
   * @param timeout The timeout for the request in milliseconds.
   *
   * @return void
  **/
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

  /**
   * Delete all folders. Note, this will not delete the content of the folders.
   *
   * @param timeout The timeout for the request in milliseconds.
   *
   * @return void
  **/
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
