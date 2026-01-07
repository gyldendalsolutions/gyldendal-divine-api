import UserSettingsBase from './user_settings_base.js';
import { HTTPError } from './base_service.js';

export interface ClientSettingsResponse {
  settings: ClientSettings;
}
export interface ClientSettings {
  readabilities?: Readability;
  darkMode?: boolean;
  displayMode?: DisplayModeOption;
  enableKeyboardShortcuts?: boolean;
  showBookmarks?: boolean;
  showNoteHighlights?: boolean;
  featureGalleryVersion?: number;
  readAloudStore?: ReadAloudStore;
  leftDrawerWidth?: number;
  recentSearches?: string[];
  materialListImagesView?: LayoutView;
  frontPageSections?: FrontPageSection[];
  activePublicationFilters?: ActivePublicationFilters;
  cardsView?: LayoutView;
  cardsSorting?: SortOptions;
  foldersView?: LayoutView;
  foldersSorting?: SortOptions;
  onboardingPromptTime?: string;
  showOnboardingPrompt?: boolean;
  favoritesSorting?: SortOptions;
}

export type DisplayModeOption = 'light' | 'dark' | 'system';

export type LayoutView = 'list' | 'grid';

export interface ActivePublicationFilters {
  educations?: string[];
  displaySubjects?: string[];
  categoriesNames?: string[];
  categoriesLevels?: string[];
  publishers?: string[];
}

export interface Readability {
  letterSpacing?: number;
  lineHeight?: number;
  textSize?: number;
  fontFamily?: FontFamily;
}

export interface FontFamily {
  name?: string;
  defaultSize?: string;
  url?: string;
}

export interface ReadAloudStore {
  currentVoiceSelection?: CurrentVoiceSelection;
  currentSpeedSelection?: CurrentSpeedSelection;
}

export interface CurrentSpeedSelection {
  speed?: number;
  text?: string;
}

export interface CurrentVoiceSelection {
  voice?: number;
  gender?: number;
  language?: number;
}

export interface FrontPageSection {
  changeable?: boolean;
  code?: string;
  enabled?: boolean;
  name?: string;
  position?: number;
}

export type SortOptions = 'recent' | 'alphabetical';

export class UserSettingsClientSettings extends UserSettingsBase {
  async getSettings({
    isbn,
    timeout = 5000
  }: {
    isbn: string;
    timeout?: number;
  }): Promise<ClientSettingsResponse> {
    const url = `${this.getUrlPrefix()}/clientsettings/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    try {
      const response = await this.getAsync({ url, headers, timeout });
      return response.json();
    } catch (Error) {
      if (Error instanceof HTTPError && Error.response.status === 404) {
        return { settings: {} } as ClientSettingsResponse;
      } else {
        throw HTTPError;
      }
    }
  }

  async setSettings({
    isbn,
    settings,
    timeout = 5000
  }: {
    isbn: string;
    settings: ClientSettings;
    timeout?: number;
  }): Promise<ClientSettingsResponse> {
    const url = `${this.getUrlPrefix()}/clientsettings/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    headers.set('Content-Type', 'application/json');
    const response = await this.putAsync({
      url,
      headers,
      body: JSON.stringify(settings),
      timeout
    });
    return response.json();
  }

  async deleteSettings({
    isbn,
    timeout = 5000
  }: {
    isbn: string;
    timeout?: number;
  }): Promise<void> {
    const url = `${this.getUrlPrefix()}/clientsettings/isbn/${isbn}`;
    const headers: HeadersInit = new Headers();

    await this.deleteAsync({ url, headers, timeout });
    return;
  }
}

export default UserSettingsClientSettings;
