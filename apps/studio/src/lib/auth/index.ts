// [Flow: Check local session -> Listen for auth events -> Sign in/out with email/password]
import { MainChannels } from '@onlook/models/constants';
import type { UserMetadata } from '@onlook/models/settings';
import { makeAutoObservable } from 'mobx';
import { invokeMainChannel } from '../utils';

export class AuthManager {
    authenticated = false;
    userMetadata: UserMetadata | null = null;
    isAuthEnabled = true;
    errorMessage: string | null = null;

    constructor() {
        makeAutoObservable(this);
        this.fetchUserMetadata();
        this.listenForAuthEvents();
    }

    async fetchUserMetadata() {
        this.userMetadata = (await invokeMainChannel(
            MainChannels.GET_USER_METADATA,
        )) as UserMetadata;

        const signedIn = (await invokeMainChannel(MainChannels.IS_USER_SIGNED_IN)) as boolean;

        if (this.userMetadata && signedIn) {
            this.authenticated = true;
        }
    }

    listenForAuthEvents() {
        window.api.on(MainChannels.USER_SIGNED_IN, async () => {
            this.authenticated = true;
            this.fetchUserMetadata();
        });

        window.api.on(MainChannels.USER_SIGNED_OUT, async () => {
            this.authenticated = false;
            this.userMetadata = null;
        });
    }

    async signIn(email: string, password: string): Promise<boolean> {
        this.errorMessage = null;
        const result = (await invokeMainChannel(MainChannels.LOCAL_SIGN_IN, {
            email,
            password,
        })) as { success: boolean; error?: string };

        if (!result.success) {
            this.errorMessage = result.error || 'Login failed';
            return false;
        }

        this.authenticated = true;
        await this.fetchUserMetadata();
        return true;
    }

    async signOut() {
        await invokeMainChannel(MainChannels.LOCAL_SIGN_OUT);
        this.authenticated = false;
        this.userMetadata = null;
    }
}
