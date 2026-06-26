import type { ChatConversation, ProjectSuggestions } from '@onlook/models/chat';
import type {
    AppState,
    AuthTokens,
    LocalAccounts,
    ProjectsCache,
    UserMetadata,
    UserSettings,
} from '@onlook/models/settings';
import { DirectoryPersistentStorage } from './directory';
import { SingleFilePersistentStorage } from './file';

export enum StorageType {
    USER_SETTINGS = 'user-settings',
    APP_STATE = 'app-state',
    USER_METADATA = 'user-metadata',
    AUTH_TOKENS = 'auth-tokens-v1',
    PROJECTS = 'projects',
    CONVERSATIONS = 'conversations-v1',
    SUGGESTIONS = 'suggestions',
    LOCAL_ACCOUNTS = 'local-accounts',
    LOCAL_SESSION = 'local-session',
}

export class PersistentStorage {
    static readonly APP_STATE = new SingleFilePersistentStorage<AppState>(StorageType.APP_STATE);
    static readonly PROJECTS = new SingleFilePersistentStorage<ProjectsCache>(StorageType.PROJECTS);
    static readonly USER_SETTINGS = new SingleFilePersistentStorage<UserSettings>(
        StorageType.USER_SETTINGS,
    );
    static readonly USER_METADATA = new SingleFilePersistentStorage<UserMetadata>(
        StorageType.USER_METADATA,
    );
    static readonly AUTH_TOKENS = new SingleFilePersistentStorage<AuthTokens>(
        StorageType.AUTH_TOKENS,
    );
    static readonly LOCAL_ACCOUNTS = new SingleFilePersistentStorage<LocalAccounts>(
        StorageType.LOCAL_ACCOUNTS,
    );
    static readonly LOCAL_SESSION = new SingleFilePersistentStorage<{ email: string | null }>(
        StorageType.LOCAL_SESSION,
    );
    static readonly CONVERSATIONS = new DirectoryPersistentStorage<ChatConversation>(
        StorageType.CONVERSATIONS,
        false,
        (conversation) => conversation.projectId,
    );
    static readonly SUGGESTIONS = new DirectoryPersistentStorage<ProjectSuggestions>(
        StorageType.SUGGESTIONS,
        false,
        (suggestion) => suggestion.projectId,
    );
}
