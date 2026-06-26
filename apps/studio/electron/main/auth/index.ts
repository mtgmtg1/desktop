// [Flow: Load local accounts -> Ensure admin account exists -> Authenticate by email/password -> Manage accounts -> Emit sign in/out events]
import { MainChannels } from '@onlook/models/constants';
import type { LocalAccount, LocalAccounts, UserMetadata } from '@onlook/models/settings';
import { createHash, randomUUID } from 'node:crypto';
import { mainWindow } from '..';
import { PersistentStorage } from '../storage';

const ADMIN_EMAIL = 'mtgmtg@naver.com';
const ADMIN_PASSWORD = 'PAkd21109!';

function hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

function getAccounts(): LocalAccount[] {
    const data = PersistentStorage.LOCAL_ACCOUNTS.read();
    return data?.accounts || [];
}

function saveAccounts(accounts: LocalAccount[]) {
    PersistentStorage.LOCAL_ACCOUNTS.replace({ accounts });
}

function ensureAdminAccount() {
    const accounts = getAccounts();
    if (accounts.find((a) => a.email === ADMIN_EMAIL)) {
        return;
    }

    const adminAccount: LocalAccount = {
        id: randomUUID(),
        email: ADMIN_EMAIL,
        passwordHash: hashPassword(ADMIN_PASSWORD),
        isAdmin: true,
        createdAt: new Date().toISOString(),
    };

    saveAccounts([adminAccount, ...accounts]);
}

function toUserMetadata(account: LocalAccount): UserMetadata {
    return {
        id: account.id,
        email: account.email,
        name: account.email.split('@')[0],
        avatarUrl: undefined,
        plan: 'pro',
        isAdmin: account.isAdmin,
    };
}

function emitSignInEvent() {
    mainWindow?.webContents.send(MainChannels.USER_SIGNED_IN);
}

function emitSignOutEvent() {
    mainWindow?.webContents.send(MainChannels.USER_SIGNED_OUT);
}

export function initLocalAuth() {
    ensureAdminAccount();
}

export function signIn(email: string, password: string): { success: boolean; error?: string } {
    const accounts = getAccounts();
    const account = accounts.find((a) => a.email === email);

    if (!account) {
        return { success: false, error: 'Account not found' };
    }

    if (!verifyPassword(password, account.passwordHash)) {
        return { success: false, error: 'Invalid password' };
    }

    const userMetadata = toUserMetadata(account);
    PersistentStorage.USER_METADATA.replace(userMetadata);
    PersistentStorage.LOCAL_SESSION.replace({ email: account.email });
    emitSignInEvent();
    return { success: true };
}

export function signOut() {
    PersistentStorage.USER_METADATA.clear();
    PersistentStorage.LOCAL_SESSION.clear();
    emitSignOutEvent();
}

export function createAccount(
    email: string,
    password: string,
    isAdmin: boolean,
): { success: boolean; error?: string } {
    const accounts = getAccounts();

    if (accounts.find((a) => a.email === email)) {
        return { success: false, error: 'Account already exists' };
    }

    if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
    }

    const newAccount: LocalAccount = {
        id: randomUUID(),
        email,
        passwordHash: hashPassword(password),
        isAdmin,
        createdAt: new Date().toISOString(),
    };

    saveAccounts([...accounts, newAccount]);
    return { success: true };
}

export function changePassword(
    email: string,
    newPassword: string,
): { success: boolean; error?: string } {
    const accounts = getAccounts();
    const account = accounts.find((a) => a.email === email);

    if (!account) {
        return { success: false, error: 'Account not found' };
    }

    if (newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
    }

    account.passwordHash = hashPassword(newPassword);
    saveAccounts(accounts);
    return { success: true };
}

export function listAccounts(): LocalAccount[] {
    return getAccounts();
}

export function deleteAccount(email: string): { success: boolean; error?: string } {
    if (email === ADMIN_EMAIL) {
        return { success: false, error: 'Cannot delete the admin account' };
    }

    const accounts = getAccounts();
    const filtered = accounts.filter((a) => a.email !== email);

    if (filtered.length === accounts.length) {
        return { success: false, error: 'Account not found' };
    }

    saveAccounts(filtered);
    return { success: true };
}

export function getUserMetadata(): UserMetadata | null {
    const session = PersistentStorage.LOCAL_SESSION.read();
    if (!session?.email) {
        return null;
    }

    const account = getAccounts().find((a) => a.email === session.email);
    if (!account) {
        return null;
    }

    return toUserMetadata(account);
}

export function isUserSignedIn(): boolean {
    return getUserMetadata() !== null;
}

export function restoreSession(): { success: boolean; error?: string } {
    const session = PersistentStorage.LOCAL_SESSION.read();
    if (!session?.email) {
        return { success: false, error: 'No session found' };
    }

    const account = getAccounts().find((a) => a.email === session.email);
    if (!account) {
        return { success: false, error: 'Session account not found' };
    }

    const userMetadata = toUserMetadata(account);
    PersistentStorage.USER_METADATA.replace(userMetadata);
    emitSignInEvent();
    return { success: true };
}
