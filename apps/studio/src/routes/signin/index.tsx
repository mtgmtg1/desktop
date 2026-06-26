// [Flow: Render email/password form -> Validate input -> Call local sign in -> Show error or proceed]
import { useAuthManager } from '@/components/Context';
import { Dunes } from '@/components/ui/dunes';
import { Button } from '@onlook/ui/button';
import { Icons } from '@onlook/ui/icons';
import { Input } from '@onlook/ui/input';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const SignIn = observer(() => {
    const { t } = useTranslation();
    const authManager = useAuthManager();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            return;
        }
        setIsLoading(true);
        await authManager.signIn(email, password);
        setIsLoading(false);
    };

    return (
        <div className="flex h-[calc(100vh-2.5rem)]">
            <div className="flex flex-col justify-between w-full h-full max-w-xl p-16 space-y-8 overflow-auto">
                <div className="flex items-center space-x-2">
                    <Icons.OnlookTextLogo viewBox="0 0 139 17" />
                </div>
                <div className="space-y-8">
                    <div className="space-y-2 uppercase rounded-full p-1 px-2 w-auto inline-block text-micro border-[0.5px] text-blue-400 border-blue-400">
                        <p>{t('welcome.alpha')}</p>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-title1 leading-tight">Sign in to Onlook</h1>
                        <p className="text-foreground-onlook text-regular">Local account login</p>
                    </div>
                    <div className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                        {authManager.errorMessage && (
                            <p className="text-small text-red-500">{authManager.errorMessage}</p>
                        )}
                        <Button
                            className="w-full text-active text-small"
                            onClick={handleLogin}
                            disabled={isLoading || !email || !password}
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>
                </div>
                <div className="flex flex-row space-x-1 text-small text-gray-600">
                    <p>{t('welcome.version', { version: window.env.APP_VERSION })}</p>
                </div>
            </div>
            <Dunes />
        </div>
    );
});
