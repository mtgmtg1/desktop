import { useAuthManager, useUserManager } from '@/components/Context';
import { useTheme } from '@/components/ThemeProvider';
import { invokeMainChannel } from '@/lib/utils';
import { Language, LANGUAGE_DISPLAY_NAMES, MainChannels, Theme } from '@onlook/models/constants';
import { DEFAULT_IDE } from '@onlook/models/ide';
import type { AIProviderSettings, LocalAccount } from '@onlook/models/settings';
import { Button } from '@onlook/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@onlook/ui/dropdown-menu';
import { Icons } from '@onlook/ui/icons';
import { Input } from '@onlook/ui/input';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IDE } from '/common/ide';

const PreferencesTab = observer(() => {
    const userManager = useUserManager();
    const authManager = useAuthManager();
    const { theme, setTheme } = useTheme();
    const { i18n } = useTranslation();

    const ide = IDE.fromType(userManager.settings.settings?.editor?.ideType || DEFAULT_IDE);
    const isAnalyticsEnabled = userManager.settings.settings?.enableAnalytics || false;
    const shouldWarnDelete = userManager.settings.settings?.editor?.shouldWarnDelete ?? true;
    const IDEIcon = Icons[ide.icon];

    const aiProvider = userManager.settings.settings?.aiProvider || {
        endpoint: '',
        modelId: '',
        apiKey: '',
    };
    const [aiEndpoint, setAiEndpoint] = useState(aiProvider.endpoint);
    const [aiModelId, setAiModelId] = useState(aiProvider.modelId);
    const [aiApiKey, setAiApiKey] = useState(aiProvider.apiKey);

    const [accounts, setAccounts] = useState<LocalAccount[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newIsAdmin, setNewIsAdmin] = useState(false);
    const [changePasswordEmail, setChangePasswordEmail] = useState('');
    const [changePasswordValue, setChangePasswordValue] = useState('');
    const [accountMessage, setAccountMessage] = useState<string | null>(null);

    useEffect(() => {
        setAiEndpoint(aiProvider.endpoint);
        setAiModelId(aiProvider.modelId);
        setAiApiKey(aiProvider.apiKey);
    }, [userManager.settings.settings?.aiProvider]);

    useEffect(() => {
        if (authManager.userMetadata?.isAdmin) {
            refreshAccounts();
        }
    }, [authManager.userMetadata?.isAdmin]);

    async function refreshAccounts() {
        const result = (await invokeMainChannel(
            MainChannels.LOCAL_LIST_ACCOUNTS,
        )) as LocalAccount[];
        setAccounts(result || []);
    }

    function updateIde(ide: IDE) {
        userManager.settings.updateEditor({ ideType: ide.type });
    }

    function updateAnalytics(enabled: boolean) {
        userManager.settings.update({ enableAnalytics: enabled });
        invokeMainChannel(MainChannels.UPDATE_ANALYTICS_PREFERENCE, enabled);
    }

    function updateDeleteWarning(enabled: boolean) {
        userManager.settings.updateEditor({ shouldWarnDelete: enabled });
    }

    async function saveAiProvider() {
        const settings: AIProviderSettings = {
            endpoint: aiEndpoint,
            modelId: aiModelId,
            apiKey: aiApiKey,
        };
        await userManager.settings.update({ aiProvider: settings });
    }

    async function createAccount() {
        setAccountMessage(null);
        const result = (await invokeMainChannel(MainChannels.LOCAL_CREATE_ACCOUNT, {
            email: newEmail,
            password: newPassword,
            isAdmin: newIsAdmin,
        })) as { success: boolean; error?: string };

        if (result.success) {
            setAccountMessage('Account created');
            setNewEmail('');
            setNewPassword('');
            setNewIsAdmin(false);
            await refreshAccounts();
        } else {
            setAccountMessage(result.error || 'Failed to create account');
        }
    }

    async function updatePassword() {
        setAccountMessage(null);
        const result = (await invokeMainChannel(MainChannels.LOCAL_CHANGE_PASSWORD, {
            email: changePasswordEmail || authManager.userMetadata?.email,
            newPassword: changePasswordValue,
        })) as { success: boolean; error?: string };

        if (result.success) {
            setAccountMessage('Password updated');
            setChangePasswordValue('');
        } else {
            setAccountMessage(result.error || 'Failed to update password');
        }
    }

    async function removeAccount(email: string) {
        setAccountMessage(null);
        const result = (await invokeMainChannel(MainChannels.LOCAL_DELETE_ACCOUNT, {
            email,
        })) as { success: boolean; error?: string };

        if (result.success) {
            setAccountMessage('Account deleted');
            await refreshAccounts();
        } else {
            setAccountMessage(result.error || 'Failed to delete account');
        }
    }

    return (
        <div className="flex flex-col gap-8 p-6">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <p className="text-largePlus">Language</p>
                    <p className="text-foreground-onlook text-small">
                        Choose your preferred language
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="text-smallPlus min-w-[150px]">
                            {LANGUAGE_DISPLAY_NAMES[
                                i18n.language as keyof typeof LANGUAGE_DISPLAY_NAMES
                            ] || 'English'}
                            <Icons.ChevronDown className="ml-auto" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-[150px]">
                        {Object.entries(LANGUAGE_DISPLAY_NAMES).map(([code, name]) => (
                            <DropdownMenuItem
                                key={code}
                                onClick={() => userManager.language.update(code as Language)}
                            >
                                <span>{name}</span>
                                {i18n.language === code && (
                                    <Icons.CheckCircled className="ml-auto" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <p className="text-largePlus">Theme</p>
                    <p className="text-foreground-onlook text-small">
                        Choose your preferred appearance
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="text-smallPlus min-w-[150px]">
                            {theme === Theme.Dark && <Icons.Moon className="mr-2 h-4 w-4" />}
                            {theme === Theme.Light && <Icons.Sun className="mr-2 h-4 w-4" />}
                            {theme === Theme.System && <Icons.Laptop className="mr-2 h-4 w-4" />}
                            <span className="capitalize">{theme}</span>
                            <Icons.ChevronDown className="ml-auto" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-[150px]">
                        <DropdownMenuItem onClick={() => setTheme(Theme.Light)}>
                            <Icons.Sun className="mr-2 h-4 w-4" />
                            <span>Light</span>
                            {theme === Theme.Light && <Icons.CheckCircled className="ml-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme(Theme.Dark)}>
                            <Icons.Moon className="mr-2 h-4 w-4" />
                            <span>Dark</span>
                            {theme === Theme.Dark && <Icons.CheckCircled className="ml-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme(Theme.System)}>
                            <Icons.Laptop className="mr-2 h-4 w-4" />
                            <span>System</span>
                            {theme === Theme.System && <Icons.CheckCircled className="ml-auto" />}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <p className="text-largePlus">Code Editor</p>
                    <p className="text-foreground-onlook text-small">
                        Choose the IDE where you open your code in
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[150px]">
                            <IDEIcon className="text-default h-3 w-3 mr-2" />
                            <span className="smallPlus">{ide.displayName}</span>
                            <Icons.ChevronDown className="ml-auto" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {IDE.getAll().map((item) => {
                            const ItemIcon = Icons[item.icon];
                            return (
                                <DropdownMenuItem
                                    key={item.displayName}
                                    className="text-smallPlus min-w-[140px]"
                                    onSelect={() => {
                                        updateIde(item);
                                    }}
                                >
                                    <ItemIcon className="text-default h-3 w-3 mr-2" />
                                    <span>{item.displayName}</span>
                                    {ide === item && <Icons.CheckCircled className="ml-auto" />}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className=" flex justify-between items-center gap-4">
                <div className=" flex flex-col gap-2">
                    <p className="text-largePlus">{'Warn before delete'}</p>
                    <p className="text-foreground-onlook text-small">
                        {'This adds a warning before deleting elements in the editor'}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="text-smallPlus min-w-[150px]">
                            {shouldWarnDelete ? 'On' : 'Off'}
                            <Icons.ChevronDown className="ml-auto" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="text-smallPlus min-w-[150px]">
                        <DropdownMenuItem onClick={() => updateDeleteWarning(true)}>
                            {'Warning On'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateDeleteWarning(false)}>
                            {'Warning Off'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex justify-between items-center gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-largePlus">Analytics</p>
                    <p className="text-foreground-onlook text-small">
                        This helps our small team of two know what we need to improve with the
                        product.
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="text-smallPlus min-w-[150px]">
                            {isAnalyticsEnabled ? 'On' : 'Off'}
                            <Icons.ChevronDown className="ml-auto" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="text-smallPlus min-w-[150px]">
                        <DropdownMenuItem onClick={() => updateAnalytics(true)}>
                            {'Analytics On'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAnalytics(false)}>
                            {'Analytics Off'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-largePlus">AI Provider</p>
                    <p className="text-foreground-onlook text-small">
                        Configure your OpenAI-compatible local LLM endpoint.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <Input
                        placeholder="Endpoint (e.g. http://localhost:8000/v1)"
                        value={aiEndpoint}
                        onChange={(e) => setAiEndpoint(e.target.value)}
                    />
                    <Input
                        placeholder="Model ID"
                        value={aiModelId}
                        onChange={(e) => setAiModelId(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="API Key (optional)"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                    />
                    <Button onClick={saveAiProvider} className="self-start">
                        Save AI Provider
                    </Button>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-largePlus">Account Management</p>
                    <p className="text-foreground-onlook text-small">
                        {authManager.userMetadata?.isAdmin
                            ? 'Create and manage local accounts.'
                            : 'Change your password.'}
                    </p>
                </div>
                {accountMessage && <p className="text-small text-blue-500">{accountMessage}</p>}
                {authManager.userMetadata?.isAdmin && (
                    <div className="flex flex-col gap-2">
                        <p className="text-smallPlus">Create Account</p>
                        <Input
                            placeholder="Email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder="Password (min 8 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <label className="flex items-center gap-2 text-small">
                            <input
                                type="checkbox"
                                checked={newIsAdmin}
                                onChange={(e) => setNewIsAdmin(e.target.checked)}
                            />
                            Admin
                        </label>
                        <Button onClick={createAccount} className="self-start">
                            Create Account
                        </Button>
                    </div>
                )}
                {authManager.userMetadata?.isAdmin && accounts.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <p className="text-smallPlus">Accounts</p>
                        {accounts.map((account) => (
                            <div
                                key={account.email}
                                className="flex justify-between items-center text-small"
                            >
                                <span>
                                    {account.email} {account.isAdmin ? '(Admin)' : ''}
                                </span>
                                {!account.isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeAccount(account.email)}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <p className="text-smallPlus">Change Password</p>
                    {authManager.userMetadata?.isAdmin && (
                        <Input
                            placeholder="Account email (leave blank for current user)"
                            value={changePasswordEmail}
                            onChange={(e) => setChangePasswordEmail(e.target.value)}
                        />
                    )}
                    <Input
                        type="password"
                        placeholder="New password (min 8 characters)"
                        value={changePasswordValue}
                        onChange={(e) => setChangePasswordValue(e.target.value)}
                    />
                    <Button onClick={updatePassword} className="self-start">
                        Update Password
                    </Button>
                </div>
            </div>
        </div>
    );
});

export default PreferencesTab;
